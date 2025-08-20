"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formstream = exports.FormstreamError = void 0;
const busboy_1 = __importDefault(require("busboy"));
const node_stream_1 = require("node:stream");
class FormstreamError extends Error {
    constructor({ message, code, context }) {
        super(message);
        this.name = "FormstreamError";
        this.code = code;
        this.context = context;
    }
}
exports.FormstreamError = FormstreamError;
class Formstream {
    constructor(busboyConfig, formstreamOptions = {}) {
        this.busboyConfig = busboyConfig;
        this.formstreamOptions = formstreamOptions;
        this.execute = (req, fileStreamHandler) => {
            return new Promise((resolve) => {
                const { timeout: timeoutMs = 30000 } = this.formstreamOptions ?? {}; // Default 30s timeout
                const bb = (0, busboy_1.default)({ ...this.busboyConfig, headers: req.headers });
                const fields = [];
                const filePromises = [];
                let partial = false;
                let resolveCalled = false;
                let rejectCalled = false;
                const timeout = setTimeout(() => {
                    safeReject(new FormstreamError({
                        message: "Upload timed out",
                        code: "TIMEOUT_ERROR"
                    }));
                }, timeoutMs);
                function cleanup() {
                    clearTimeout(timeout);
                }
                function safeResolve(data) {
                    if (!resolveCalled && !rejectCalled) {
                        resolveCalled = true;
                        cleanup();
                        resolve({ data, error: null });
                    }
                }
                function safeReject(err) {
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
                    const filePromise = new Promise((resolve) => {
                        const processFile = async () => {
                            try {
                                let data = null;
                                let error = null;
                                if (fileStreamHandler) {
                                    // Use custom file handler
                                    try {
                                        data = (await fileStreamHandler({ name, file: stream, info }));
                                    }
                                    catch (err) {
                                        error = err instanceof Error ? err : new Error(String(err));
                                    }
                                }
                                else {
                                    // Default behavior: collect buffer
                                    const bufferResult = await resolveBuffer;
                                    if (bufferResult.error) {
                                        error =
                                            bufferResult.error instanceof Error
                                                ? bufferResult.error
                                                : new Error(String(bufferResult.error));
                                    }
                                    else {
                                        data = bufferResult.data;
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
                            }
                            catch (err) {
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
                    }
                    catch (err) {
                        safeReject(this.createError(err, "FILE_PROCESSING_ERROR"));
                    }
                });
                // Request events
                /*  req.on("close", () => {
                   safeReject(this.createError("Request aborted", "ABORT_ERROR"));
                 });
            */
                req.on("error", (err) => {
                    safeReject(this.createError(err, "REQUEST_ERROR"));
                });
                req.pipe(bb);
            });
        };
    }
    getFileResolvers(stream) {
        const tee = new node_stream_1.PassThrough();
        // ---------- SIZE PROMISE ----------
        const resolveSize = new Promise((resolve) => {
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
        const resolveBuffer = new Promise((resolve) => {
            const chunks = [];
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
                    }
                    catch (error) {
                        resolve({ data: null, error });
                    }
                }
            });
        });
        // Pipe the original stream into the tee
        stream.pipe(tee);
        return { stream: tee, resolveSize, resolveBuffer };
    }
    createError(err, code) {
        if (err === null || err === undefined) {
            return new FormstreamError({
                message: "Unknown error",
                code: code || "UNKNOWN_ERROR"
            });
        }
        else if (err instanceof FormstreamError) {
            err.code = err.code || code || "UNKNOWN_ERROR";
            return err;
        }
        else if (err instanceof Error) {
            return new FormstreamError({
                message: err.message,
                code: code || "UNKNOWN_ERROR"
            });
        }
        else if (typeof err === "string" || typeof err === "number" || typeof err === "boolean") {
            return new FormstreamError({
                message: err.toString(),
                code: code || "UNKNOWN_ERROR"
            });
        }
        else if (typeof err === "object" && "message" in err) {
            return new FormstreamError({
                message: String(err.message),
                code: code || "UNKNOWN_ERROR"
            });
        }
        else {
            return new FormstreamError({
                message: String(err),
                code: code || "UNKNOWN_ERROR"
            });
        }
    }
}
exports.Formstream = Formstream;
