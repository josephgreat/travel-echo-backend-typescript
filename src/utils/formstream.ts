import Busboy from "busboy";
import { IncomingMessage } from "node:http";
import { PassThrough, Readable } from "node:stream";

export type FormstreamConfig = {
  timeout?: number;
};

export type FileHandlerParams = {
  name: string;
  file: Readable & { truncated?: boolean };
  info: Busboy.FileInfo;
};

export type FileStreamHandler<T = unknown> = (params: FileHandlerParams) => T | Promise<T>;

export type UploadedField = {
  name: string;
  value: string;
};

export type UploadedFile<T = Buffer> = {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  filesize: number;
  error: Error | null;
  data: T | null;
};

export type FormstreamReturnData<T = Buffer> = {
  fields: UploadedField[];
  files: UploadedFile<T>[];
  partial: boolean;
};

export class FormstreamError extends Error {
  public code: string;
  public context?: unknown;
  constructor({ message, code, context }: { message: string; code: string; context?: unknown }) {
    super(message);
    this.name = "FormstreamError";
    this.code = code;
    this.context = context;
  }
}

export type FormstreamReturnType<T = Buffer> =
  | {
      data: FormstreamReturnData<T>;
      error: null;
    }
  | {
      data: null;
      error: FormstreamError;
    };

export class Formstream {
  constructor(
    private busboyConfig: Busboy.BusboyConfig,
    private formstreamOptions: FormstreamConfig = {}
  ) {}

  public execute = <T = Buffer>(
    req: IncomingMessage,
    fileStreamHandler?: FileStreamHandler<T>
  ): Promise<FormstreamReturnType<T>> => {
    return new Promise((resolve) => {
      const { timeout: timeoutMs = 30000 } = this.formstreamOptions ?? {}; // Default 30s timeout

      const bb = Busboy({ ...this.busboyConfig, headers: req.headers });
      const fields: UploadedField[] = [];
      const filePromises: Promise<UploadedFile<T>>[] = [];
      let partial: boolean = false;

      let resolveCalled = false;
      let rejectCalled = false;

      const timeout = setTimeout(() => {
        safeReject(
          new FormstreamError({
            message: "Upload timed out",
            code: "TIMEOUT_ERROR"
          })
        );
      }, timeoutMs);

      function cleanup() {
        clearTimeout(timeout);
      }

      function safeResolve(data: FormstreamReturnData<T>) {
        if (!resolveCalled && !rejectCalled) {
          resolveCalled = true;
          cleanup();
          resolve({ data, error: null });
        }
      }

      function safeReject(err: FormstreamError) {
        if (!rejectCalled && !resolveCalled) {
          rejectCalled = true;
          cleanup();
          resolve({ data: null, error: err });
        }
      }

      // Busboy events
      bb.on("error", (err) => {
        safeReject(this.createError(err));
      });

      bb.on("field", (name, value) => {
        fields.push({ name, value });
      });

      bb.on("file", (name, file, info) => {
        // Skip empty files or files with no filename
        if (!info.filename?.trim()) {
          file.resume();
          partial = true;
          return;
        }

        const { stream, resolveSize, resolveBuffer } = this.getFileResolvers(file);

        const filePromise = new Promise<UploadedFile<T>>((resolve) => {
          const processFile = async () => {
            try {
              let data: T | null = null;
              let error: Error | null = null;

              if (fileStreamHandler) {
                // Use custom file handler
                try {
                  data = (await fileStreamHandler({ name, file: stream, info })) as T;
                } catch (err) {
                  error = err instanceof Error ? err : new Error(String(err));
                }
              } else {
                // Default behavior: collect buffer
                const bufferResult = await resolveBuffer;
                if (bufferResult.error) {
                  error =
                    bufferResult.error instanceof Error
                      ? bufferResult.error
                      : new Error(String(bufferResult.error));
                } else {
                  data = bufferResult.data as T;
                }
              }

              const sizeResult = await resolveSize;
              const filesize = sizeResult.error ? 0 : sizeResult.data || 0;

              resolve({
                fieldname: name,
                filename: info.filename,
                encoding: info.encoding,
                mimetype: info.mimeType,
                filesize,
                error,
                data
              });
            } catch (err) {
              resolve({
                fieldname: name,
                filename: info.filename,
                encoding: info.encoding,
                mimetype: info.mimeType,
                filesize: 0,
                error: err instanceof Error ? err : new Error(String(err)),
                data: null
              });
            }
          };

          processFile();
        });

        filePromises.push(filePromise);
      });

      bb.on("close", async () => {
        try {
          // Wait for all file promises to complete
          const files = await Promise.all(filePromises);
          safeResolve({ fields, files, partial });
        } catch (err) {
          safeReject(this.createError(err, "FILE_PROCESSING_ERROR"));
        }
      });

      // Request events
      req.on("close", () => {
        safeReject(this.createError("Request aborted", "ABORT_ERROR"));
      });

      req.on("error", (err) => {
        safeReject(this.createError(err, "REQUEST_ERROR"));
      });

      req.pipe(bb);
    });
  };

  private getFileResolvers(stream: Readable): {
    stream: PassThrough;
    resolveSize: Promise<{ data: number | null; error: unknown | null }>;
    resolveBuffer: Promise<{ data: Buffer | null; error: unknown | null }>;
  } {
    const tee = new PassThrough();

    // ---------- SIZE PROMISE ----------
    const resolveSize = new Promise<{ data: number | null; error: unknown | null }>((resolve) => {
      let size = 0;
      let errorOccurred = false;

      stream.on("error", (err) => {
        if (!errorOccurred) {
          errorOccurred = true;
          resolve({ data: null, error: err });
        }
      });

      stream.on("data", (chunk) => {
        if (!errorOccurred) {
          size += chunk.length;
        }
      });

      stream.on("end", () => {
        if (!errorOccurred) {
          resolve({ error: null, data: size });
        }
      });
    });

    // ---------- BUFFER PROMISE ----------
    const resolveBuffer = new Promise<{ data: Buffer | null; error: unknown | null }>((resolve) => {
      const chunks: Buffer[] = [];
      let errorOccurred = false;
      let hasData = false;

      // Listen to *tee*, so we don't consume original stream twice
      tee.on("error", (err) => {
        if (!errorOccurred) {
          errorOccurred = true;
          resolve({ data: null, error: err });
        }
      });

      tee.on("data", (chunk) => {
        if (!errorOccurred) {
          hasData = true;
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
      });

      tee.on("end", () => {
        if (!errorOccurred) {
          try {
            if (!hasData || chunks.length === 0) {
              resolve({ data: Buffer.alloc(0), error: null });
              return;
            }
            resolve({ data: Buffer.concat(chunks), error: null });
          } catch (error) {
            resolve({ data: null, error });
          }
        }
      });
    });

    // Pipe the original stream into the tee
    stream.pipe(tee);

    return { stream: tee, resolveSize, resolveBuffer };
  }

  private createError(err: unknown, code?: string): FormstreamError {
    if (err === null || err === undefined) {
      return new FormstreamError({
        message: "Unknown error",
        code: code || "UNKNOWN_ERROR"
      });
    } else if (err instanceof FormstreamError) {
      err.code = err.code || code || "UNKNOWN_ERROR";
      return err;
    } else if (err instanceof Error) {
      return new FormstreamError({
        message: err.message,
        code: code || "UNKNOWN_ERROR"
      });
    } else if (typeof err === "string" || typeof err === "number" || typeof err === "boolean") {
      return new FormstreamError({
        message: err.toString(),
        code: code || "UNKNOWN_ERROR"
      });
    } else if (typeof err === "object" && "message" in err) {
      return new FormstreamError({
        message: String(err.message),
        code: code || "UNKNOWN_ERROR"
      });
    } else {
      return new FormstreamError({
        message: String(err),
        code: code || "UNKNOWN_ERROR"
      });
    }
  }
}
