import Stream from "node:stream";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export async function saveFileStream(
  file: Stream.Readable,
  dir: string,
  filename: string
) {
  return new Promise<string>((resolve, reject) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const filepath = path.join(dir, filename);

    const stream = createWriteStream(filepath);

    stream.on("finish", () => resolve(filepath));
    stream.on("error", (err) => {
      console.error(err);
      reject(err);
    });
    file.pipe(stream);
  });
}
