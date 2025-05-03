import dotenv from "dotenv";

dotenv.config();

export class Env {
  constructor() {}

  /**
   * Get the value of an environment variable.
   * @param key - The name of the environment variable.
   * @param defaultValue - The default value to return if the variable is not set.
   * @returns The value of the environment variable, or the default value.
   */
  get<T>(key: keyof NodeJS.ProcessEnv, defaultValue?: T): T {
    const value = process.env[key];
    if (value === undefined && defaultValue !== undefined) {
      return defaultValue;
    }
    if (value === undefined) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value as T;
  }

  /**
   * Set the value of an environment variable.
   * @param key - The name of the environment variable.
   * @param value - The value to set for the environment variable.
   */
  set(key: keyof NodeJS.ProcessEnv, value: string): void {
    process.env[key] = value;
  }

  /**
   * Check if an environment variable exists.
   * @param key - The name of the environment variable.
   * @returns True if the variable exists, false otherwise.
   */
  has(key: keyof NodeJS.ProcessEnv): boolean {
    return Object.prototype.hasOwnProperty.call(process.env, key);
  }
}

const env = new Env();
export default env;
