import busboy, { Busboy, BusboyConfig, FileInfo } from "busboy";
import { Request } from "express";
import Stream from "node:stream";

export type AsyncBusboyHandlerFunction<T = unknown> = (
  name: string,
  file: Stream.Readable & { truncated?: boolean },
  info: FileInfo
) => Promise<T>;

export interface FileUploadResult<T = Buffer> {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  filesize: number;
  error: Error | null;
  data: T | null;
}

export interface UploadedField {
  name: string;
  value: string;
}

export type AsyncBusboyConfig = {
  timeout?: number;
};

export class BusboyAsync {
  private bb: Busboy | null = null;
  private filePromises: Promise<FileUploadResult>[] = [];
  private fields: UploadedField[] = [];
  private handlerFn: AsyncBusboyHandlerFunction | null = null;
  private hasFinished = false;
  private hasErrored = false;

  constructor(
    private options: BusboyConfig,
    private config: AsyncBusboyConfig = {}
  ) {}

  async process<T extends Buffer<ArrayBufferLike>>(
    req: Request,
    handler?: AsyncBusboyHandlerFunction<T>
  ): Promise<{
    data: { fields: UploadedField[]; files: FileUploadResult<T>[] } | null;
    error: Error | null;
  }> {
    this.handlerFn = handler ?? null;
    try {
      const result = await this.uploadPromise<T>(req);
      return {
        data: result,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private uploadPromise<T extends Buffer<ArrayBufferLike>>(
    req: Request
  ): Promise<{ files: FileUploadResult<T>[]; fields: UploadedField[] }> {
    const { timeout: timeoutMs = 300000 } = this.config;

    return new Promise<{ files: FileUploadResult<T>[]; fields: UploadedField[] }>(
      (resolve, reject) => {
        // Reset state
        this.filePromises = [];
        this.fields = [];
        this.hasFinished = false;
        this.hasErrored = false;

        // Create new busboy instance for each upload
        this.bb = busboy(this.options);

        let rejectCalled = false;
        let resolveCalled = false;

        const safeReject = (error: unknown) => {
          if (!rejectCalled && !resolveCalled) {
            rejectCalled = true;
            this.hasErrored = true;
            reject(error);
          }
        };

        const safeResolve = (data: { files: FileUploadResult<T>[]; fields: UploadedField[] }) => {
          if (!resolveCalled && !rejectCalled) {
            resolveCalled = true;
            resolve(data);
          }
        };

        // Handle busboy errors
        this.bb.on("error", (err) => {
          safeReject(err);
        });

        // Handle request stream errors
        req.on("error", (err) => {
          safeReject(new Error(`Request stream error: ${err.message}`));
        });

        this.bb.on("field", (name, value) => {
          this.fields.push({ name, value });
        });

        this.bb.on("file", (name, file, info) => {
          // Only process files that have actual content
          // Skip empty files or files with no filename
          if (!info.filename || info.filename.trim() === "") {
            file.resume(); // Drain the empty stream
            // maybe later on handle these sort of files
            return;
          }

          const filePromise = this.processFile<T>(name, file, info);
          this.filePromises.push(filePromise);
        });

        this.bb.on("finish", async () => {
          this.hasFinished = true;

          // Wait a bit to ensure all file events have been processed
          await new Promise((resolve) => setImmediate(resolve));

          if (this.hasErrored) {
            return; // Already rejected
          }

          if (this.filePromises.length === 0) {
            //safeReject(new Error("No files uploaded"));
            return;
          }

          try {
            const results = await Promise.allSettled(this.filePromises);
            const fileResults: FileUploadResult<T>[] = results.map((result, index) => {
              if (result.status === "fulfilled") {
                return result.value as FileUploadResult<T>;
              } else {
                // Create error result for failed files
                return {
                  fieldname: `file_${index}`,
                  filename: "unknown",
                  encoding: "unknown",
                  mimetype: "unknown",
                  filesize: 0,
                  error:
                    result.reason instanceof Error
                      ? result.reason
                      : new Error(String(result.reason)),
                  data: null
                } as FileUploadResult<T>;
              }
            });

            safeResolve({ fields: this.fields, files: fileResults });
          } catch (error) {
            safeReject(error instanceof Error ? error : new Error(String(error)));
          }
        });

        // Pipe the request to busboy
        req.pipe(this.bb);

        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (!this.hasFinished && !this.hasErrored) {
            safeReject(new Error("Upload timeout - request took too long"));
          }
        }, timeoutMs); // default 300 second timeout (5 minutes)

        // Clear timeout when we're done
        const originalReject = reject;
        const originalResolve = resolve;
        reject = (error) => {
          clearTimeout(timeout);
          originalReject(error);
        };
        resolve = (data) => {
          clearTimeout(timeout);
          originalResolve(data);
        };
      }
    );
  }

  private async processFile<T = Buffer>(
    name: string,
    file: Stream.Readable & { truncated?: boolean },
    info: FileInfo
  ): Promise<FileUploadResult<T>> {
    try {
      let data;
      let filesize: number = 0;

      if (this.handlerFn) {
        // Use custom handler if provided
        filesize = await this.getFilesize(file);
        data = await this.handlerFn(name, file, info);
      } else {
        // Default behavior: collect file data as buffer
        const { size, buffer } = await this.saveAsBuffer(file);
        filesize = size;
        data = buffer;
      }

      return {
        fieldname: name,
        filename: info.filename,
        encoding: info.encoding,
        mimetype: info.mimeType,
        filesize,
        error: null,
        data: data as T
      };
    } catch (error) {
      // Drain the file stream to prevent hanging
      file.resume();

      return {
        fieldname: name,
        filename: info.filename,
        encoding: info.encoding,
        mimetype: info.mimeType,
        filesize: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        data: null
      };
    }
  }

  private getFilesize(
    file: Stream.Readable & { truncated?: boolean },
  ) {
    return new Promise<number>((resolve, reject) => {
      let size: number = 0;
      let errorOccurred = false;
      let hasData = false;

      file.on("error", (err) => {
        if (!errorOccurred) {
          errorOccurred = true;
          reject(err);
        }
      });

      file.on("data", (chunk) => {
        if (!errorOccurred) {
          hasData = true;
          size += chunk.length;
        }
      });

      file.on("end", async () => {
        if (!errorOccurred) {
          try {
            // Check if we actually received any data
            if (!hasData || size === 0) {
              reject(new Error("File is empty or contains no data"));
              return;
            }

            if (!this.handlerFn) {
              reject(new Error("Handler function not provided"));
              return;
            }
            resolve(size);
          } catch (err) {
            reject(err);
          }
        }
      });

      // Handle aborted/closed streams
      file.on("close", () => {
        if (!errorOccurred && !hasData) {
          reject(new Error("File stream closed without receiving data"));
        }
      });
    });
  }

  private saveAsBuffer(file: Stream.Readable): Promise<{ size: number; buffer: Buffer }> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size: number = 0;
      let errorOccurred = false;
      let hasData = false;

      file.on("error", (err) => {
        if (!errorOccurred) {
          errorOccurred = true;
          reject(err);
        }
      });

      file.on("data", (chunk) => {
        if (!errorOccurred) {
          hasData = true;
          size += chunk.length;
          chunks.push(chunk);
        }
      });

      file.on("end", () => {
        if (!errorOccurred) {
          try {
            // Check if we actually received any data
            if (!hasData || chunks.length === 0) {
              reject(new Error("File is empty or contains no data"));
              return;
            }

            const buffer = Buffer.concat(chunks);
            if (buffer.length === 0) {
              reject(new Error("File buffer is empty"));
              return;
            }

            resolve({ size, buffer });
          } catch (err) {
            reject(err);
          }
        }
      });

      // Handle aborted/closed streams
      file.on("close", () => {
        if (!errorOccurred && !hasData) {
          reject(new Error("File stream closed without receiving data"));
        }
      });
    });
  }
}
