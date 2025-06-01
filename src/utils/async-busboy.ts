import busboy, { Busboy, BusboyConfig, FileInfo } from "busboy";
import { Request } from "express";
import Stream from "node:stream";

export type AsyncBusboyHandlerFunction<T = unknown> = (
  name: string,
  file: Stream.Readable & { truncated?: boolean },
  info: FileInfo
) => Promise<T>;

export interface FileUploadResult<T = unknown> {
  name: string;
  filename: string;
  encoding: string;
  mimeType: string;
  error: Error | null;
  data: T | null;
}

export class AsyncBusboy {
  private bb: Busboy | null = null;
  private filePromises: Promise<FileUploadResult>[] = [];
  private handlerFn: AsyncBusboyHandlerFunction | null = null;
  private hasFinished = false;
  private hasErrored = false;

  constructor(private options: BusboyConfig) {}

  // Set a custom handler function for processing files
  handler<T>(fn: AsyncBusboyHandlerFunction<T>): this {
    this.handlerFn = fn;
    return this;
  }

  async upload<T = Buffer>(
    req: Request
  ): Promise<{ data: FileUploadResult<T>[] | null; error: Error | null }> {
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

  private uploadPromise<T>(req: Request): Promise<FileUploadResult<T>[]> {
    return new Promise<FileUploadResult<T>[]>((resolve, reject) => {
      // Reset state
      this.filePromises = [];
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

      const safeResolve = (data: FileUploadResult<T>[]) => {
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

      this.bb.on("file", (name, file, info) => {
        // Only process files that have actual content
        // Skip empty files or files with no filename
        if (!info.filename || info.filename.trim() === "") {
          file.resume(); // Drain the empty stream
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
          safeReject(new Error("No files uploaded"));
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
                name: `file_${index}`,
                filename: "unknown",
                encoding: "unknown",
                mimeType: "unknown",
                error:
                  result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
                data: null
              } as FileUploadResult<T>;
            }
          });

          safeResolve(fileResults);
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
      }, 30000); // 30 second timeout

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
    });
  }

  private async processFile<T>(
    name: string,
    file: Stream.Readable & { truncated?: boolean },
    info: FileInfo
  ): Promise<FileUploadResult<T>> {
    try {
      let data: T;

      if (this.handlerFn) {
        // Use custom handler if provided
        data = (await this.handlerFn(name, file, info)) as T;
      } else {
        // Default behavior: collect file data as buffer
        data = (await this.collectFileData(file)) as T;
      }

      return {
        name,
        filename: info.filename,
        encoding: info.encoding,
        mimeType: info.mimeType,
        error: null,
        data
      };
    } catch (error) {
      // Drain the file stream to prevent hanging
      file.resume();

      return {
        name,
        filename: info.filename,
        encoding: info.encoding,
        mimeType: info.mimeType,
        error: error instanceof Error ? error : new Error(String(error)),
        data: null
      };
    }
  }

  private collectFileData(file: Stream.Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
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

            resolve(buffer);
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
