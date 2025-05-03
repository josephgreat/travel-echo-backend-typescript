import { MemoryImage, MemoryImageModel } from "../models/memory-image.model";
import { Repository } from "./repository";

export class MemoryImageRepository extends Repository<MemoryImage> {
  constructor() {
    super(MemoryImageModel);
  }
}

export const memoryImageRepository = new MemoryImageRepository();
