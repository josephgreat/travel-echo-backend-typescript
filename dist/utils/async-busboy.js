"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncBusboy = void 0;
const busboy_1 = __importDefault(require("busboy"));
class AsyncBusboy {
    constructor(options) {
        this.options = options;
        this.bb = null;
        this.filePromises = [];
        this.handlerFn = null;
        this.hasFinished = false;
        this.hasErrored = false;
    }
    // Set a custom handler function for processing files
    handler(fn) {
        this.handlerFn = fn;
        return this;
    }
    async upload(req) {
        try {
            const result = await this.uploadPromise(req);
            return {
                data: result,
                error: null
            };
        }
        catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }
    uploadPromise(req) {
        return new Promise((resolve, reject) => {
            // Reset state
            this.filePromises = [];
            this.hasFinished = false;
            this.hasErrored = false;
            // Create new busboy instance for each upload
            this.bb = (0, busboy_1.default)(this.options);
            let rejectCalled = false;
            let resolveCalled = false;
            const safeReject = (error) => {
                if (!rejectCalled && !resolveCalled) {
                    rejectCalled = true;
                    this.hasErrored = true;
                    reject(error);
                }
            };
            const safeResolve = (data) => {
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
                const filePromise = this.processFile(name, file, info);
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
                    const fileResults = results.map((result, index) => {
                        if (result.status === "fulfilled") {
                            return result.value;
                        }
                        else {
                            // Create error result for failed files
                            return {
                                name: `file_${index}`,
                                filename: "unknown",
                                encoding: "unknown",
                                mimeType: "unknown",
                                error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
                                data: null
                            };
                        }
                    });
                    safeResolve(fileResults);
                }
                catch (error) {
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
    async processFile(name, file, info) {
        try {
            let data;
            if (this.handlerFn) {
                // Use custom handler if provided
                data = (await this.handlerFn(name, file, info));
            }
            else {
                // Default behavior: collect file data as buffer
                data = (await this.collectFileData(file));
            }
            return {
                name,
                filename: info.filename,
                encoding: info.encoding,
                mimeType: info.mimeType,
                error: null,
                data
            };
        }
        catch (error) {
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
    collectFileData(file) {
        return new Promise((resolve, reject) => {
            const chunks = [];
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
                    }
                    catch (err) {
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
exports.AsyncBusboy = AsyncBusboy;
