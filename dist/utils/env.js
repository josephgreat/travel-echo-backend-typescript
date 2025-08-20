"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Env {
    constructor() { }
    /**
     * Get the value of an environment variable.
     * @param key - The name of the environment variable.
     * @param defaultValue - The default value to return if the variable is not set.
     * @returns The value of the environment variable, or the default value.
     */
    get(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined && defaultValue !== undefined) {
            return defaultValue;
        }
        if (value === undefined) {
            throw new Error(`Missing environment variable: ${key}`);
        }
        return value;
    }
    /**
     * Set the value of an environment variable.
     * @param key - The name of the environment variable.
     * @param value - The value to set for the environment variable.
     */
    set(key, value) {
        process.env[key] = value;
    }
    /**
     * Check if an environment variable exists.
     * @param key - The name of the environment variable.
     * @returns True if the variable exists, false otherwise.
     */
    has(key) {
        return Object.prototype.hasOwnProperty.call(process.env, key);
    }
}
exports.Env = Env;
const env = new Env();
exports.default = env;
