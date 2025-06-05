const fs = require("fs");
const path = require("path");

/**
 *
 * @param {string} name
 * @returns {string}
 */
function toKebabCase(name) {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

/**
 *
 * @param {string} name
 * @returns {string}
 */
function toPascalCase(name) {
  return toKebabCase(name)
    .split("-")
    .map((word) => word.toLowerCase())
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 *
 * @param {string} modelName
 * @param {object} options
 */
function createModelTemplate(modelName, options) {
  const kebabName = toKebabCase(modelName);
  const pascalName = toPascalCase(modelName);
  const fileName = `${kebabName}.model.ts`;
  const modelsDir = path.resolve(__dirname, "../src/db/models");
  const filePath = path.join(modelsDir, fileName);
  const { force } = options;

  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    if (force) {
      fs.unlinkSync(filePath);
      console.log(`Model "${fileName}" overwritten.`);
    } else {
      console.error(`Model "${fileName}" already exists.`);
      process.exit(1);
    }
  }

  const template = `
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { User } from "./user.model";

@modelOptions({
  schemaOptions: { timestamps: true }
})
export class ${pascalName} {
  @prop({ required: true, ref: () => User })
  public user!: mongoose.Types.ObjectId;

  @prop()
  public field!: string;

  @prop({ type: () => [String] })
  public arrayField!: string[];
}
 
export const ${pascalName}Model = getModelForClass(${pascalName});
`;

  fs.writeFileSync(filePath, template.trimStart());
  console.log(`Model created: src/db/models/${fileName}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: npm run create:model <model-name>");
    process.exit(1);
  }

  const modelName = args[0];
  const flags = args.slice(1);

  const options = {
    force: flags.includes("%f"),
    createRepo: flags.includes("%r"),
    createRoutes: flags.includes("%r")
  };

  createModelTemplate(modelName, options);
}

main();
