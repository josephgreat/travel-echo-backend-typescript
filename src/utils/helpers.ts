/* eslint-disable @typescript-eslint/no-explicit-any */
import { Secret, sign, type SignOptions } from "jsonwebtoken";
import env from "./env";
import crypto from "node:crypto";
import mongoose from "mongoose";

export function computeAge(dateOfBirth: string | Date) {
  const dob = new Date(dateOfBirth);
  if (!dob) {
    return 0;
  }
  const now = new Date();

  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  const dayDiff = now.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
}

export function isPlainObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value) && value !instanceof Date;
}

export function signJWT<T extends string | object | Buffer<ArrayBufferLike>>(
  data: T,
  options?: SignOptions
) {
  return sign(data, env.get("JWT_SECRET") as Secret, options);
}

function setDeep(obj: Record<string, any>, path: string[], value: any): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const part = path[i];
    if (
      typeof current[part] !== "object" ||
      current[part] === null ||
      current[part] === undefined
    ) {
      current[part] = {};
    }
    current = current[part];
  }
  if (path.length > 0) {
    current[path[path.length - 1]] = value;
  }
}

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

// Type to define the structure created by picking a *single* path (similar to your original PathsToProps, slightly adjusted)
export type PickSinglePath<
  T extends object,
  Path extends string
> = Path extends `${infer Key}.${infer Rest}`
  ? // Yes, it has a dot.
    Key extends keyof T // Check if the first part (Key) is a valid key in T
    ? T[Key] extends object // Check if the value at Key is (or could be) an object
      ? // Determine if the Key itself is optional in T or if its type includes undefined/null
        undefined extends T[Key] // <--- This is the key check for optionality
        ? // If the original key is optional or its value can be undefined/null, make the resulting nested key optional
          { [K in Key]?: PickSinglePath<NonNullable<T[Key]> & object, Rest> | undefined }
        : // If the original key is required and its value cannot be undefined/null, keep the resulting nested key required
          { [K in Key]: PickSinglePath<T[Key] & object, Rest> }
      : // If the value at Key is not an object type, you can't nest further.
        // Determine optionality based on the original non-object key's type.
        undefined extends T[Key]
        ? { [K in Key]?: T[Key] | undefined }
        : { [K in Key]: T[Key] }
    : // No, Key is not a valid key. This path is invalid.
      never
  : // No, it doesn't have a dot (is a top-level path)
    Path extends keyof T // Check if the entire Path string is a valid key in T
    ? // Yes, Path is a valid key. Use the original property's type (which includes its own optionality/nullability).
      { [K in Path]: T[Path] }
    : // No, Path is not a valid key. This path is invalid.
      never;

export type PathsToProps<T extends object, P extends string> = UnionToIntersection<
  PickSinglePath<T, P>
>;

/**
 * Creates an object composed of the picked object properties or nested properties. *
 * @template T The type of the source object
 * @template P The literal type of keys to pick (can be dot-notation paths or a union of paths)
 * @param obj The source object
 * @param paths The property paths to pick (a single path string or an array of path strings)
 * @returns A new object with just the picked properties, preserving nested structure.
 */
export function pick<
  T extends object,
  // P represents the union of all possible path string literals passed.
  // If paths is a single string 'a.b', P is 'a.b'.
  // If paths is ['a.b', 'c.d'], P is 'a.b' | 'c.d'.
  P extends string
>(obj: T, paths: P | P[]): PathsToProps<T, P> {
  const result: Record<string, any> = {};

  const pathsArray = Array.isArray(paths) ? paths : [paths];

  for (const keyPath of pathsArray) {
    const pathParts = keyPath.split(".");
    let current: any = obj;
    let exists = true;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];

      const isLastPart = i === pathParts.length - 1;
      const canDescend =
        current !== null && current !== undefined && typeof current === "object" && part in current;
      const existsFinalPart = current !== null && current !== undefined && part in current;

      if (isLastPart ? existsFinalPart : canDescend) {
        current = current[part];
      } else {
        exists = false;
        break;
      }
    }

    if (exists) {
      setDeep(result, pathParts, current);
    }
  }
  return result as PathsToProps<T, P>;
}

/**
 *
 * @param obj
 * @param {string | string[]} keys
 * @returns An object with the specified keys removed
 */
export function omit(obj: Record<string, any>, keys: string | string[]) {
  const keysArray = Array.isArray(keys) ? keys : [keys];

  const cloned = { ...obj };

  for (const keyPath of keysArray) {
    const pathParts = keyPath.split(".");
    let current = cloned;
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (i === pathParts.length - 1) {
        if (current && part in current) {
          delete current[part];
        }
      } else {
        if (!current[part]) {
          break;
        }
        current = current[part];
      }
    }
  }
  return cloned;
}

/**
 * Sets an expiry date based on a validity period string.
 * @param {string} validityPeriod - A string like "10 minutes" or "2 hours".
 * @returns {Date} The expiry date and time.
 * @throws {Error} If the time unit is invalid.
 */
export function setExpiryDate(validityPeriod: string) {
  const [n, t] = validityPeriod.split(" ");
  const num = parseInt(n, 10);
  let multiplier;
  const time = t.toLowerCase();

  if (time.includes("second")) multiplier = 1000;
  else if (time.includes("minute")) multiplier = 60 * 1000;
  else if (time.includes("hour")) multiplier = 60 * 60 * 1000;
  else throw new Error("Invalid time unit. Only 'seconds', 'minutes' or 'hours' are supported.");

  const expiryTime = Date.now() + num * multiplier;
  return new Date(expiryTime);
}

/**
 * Checks if the supplied date has expired.
 * @param {Date | string | number} expiryTime - The expiry time as a Date object, timestamp, or ISO string.
 * @returns {boolean} True if expired, otherwise false.
 */
export function isDateExpired(expiryTime: Date | string | number) {
  return Date.now() > new Date(expiryTime).getTime();
}

/**
 * Generates a random string based on length or pattern.
 *
 * - If `lengthOrPattern` is a number, it generates a random string of that length.
 * - If `lengthOrPattern` is a pattern (e.g., "9aA"), it replaces '9' with a digit, 'a' with a lowercase letter, and 'A' with an uppercase letter.
 *
 * @param {number | string} lengthOrPattern - The length of the random string or a pattern (e.g., "9aA").
 * @param {'numeric' | 'num' | 'alphabetic' | 'alpha' | 'uppercase' | 'alphanumeric' | 'alphanum'} [type='alphanumeric'] - The type of characters to use (only used when `lengthOrPattern` is a number).
 * @returns {string} A randomly generated string based on the given constraints.
 */

export type RandomStringType =
  | "numeric"
  | "num"
  | "alphabetic"
  | "alpha"
  | "uppercase"
  | "alphanumeric"
  | "alphanum";
export function randomString(lengthOrPattern: number | string, type: RandomStringType) {
  const DEFAULT_STR_LENGTH = 16;
  // Define character sets
  const charSets = {
    numeric: "0123456789",
    num: "0123456789",
    alphabetic: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    alphanum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  };

  const getUnbiasedRandomChar = (charset: string) => {
    const charsetLength = charset.length;
    const bytesNeeded = Math.ceil(Math.log(charsetLength) / Math.log(256));
    const maxValidValue = Math.floor(256 ** bytesNeeded / charsetLength) * charsetLength;

    while (true) {
      const randomBytes = crypto.randomBytes(bytesNeeded);

      let randomValue = 0;
      for (let i = 0; i < bytesNeeded; i++) {
        randomValue = randomValue * 256 + randomBytes[i];
      }

      if (randomValue < maxValidValue) {
        return charset[randomValue % charsetLength];
      }
    }
  };

  if (
    lengthOrPattern === undefined ||
    lengthOrPattern === null ||
    typeof lengthOrPattern === "number"
  ) {
    const length = lengthOrPattern || DEFAULT_STR_LENGTH;
    const charset = type ? charSets[type] : charSets["alphanumeric"];

    // Generate token of specified length
    let token = "";
    for (let i = 0; i < length; i++) {
      token += getUnbiasedRandomChar(charset);
    }

    return token;
  }

  // Handle pattern string
  const pattern = lengthOrPattern;
  return pattern.replace(/[9aA]/g, (match) => {
    let charset = "";

    if (match === "9") charset = charSets.numeric;
    else if (match === "A") charset = charSets.uppercase;
    else if (match === "a") charset = charSets.alphabetic;

    return getUnbiasedRandomChar(charset);
  });
}

export function castToObjectId(id: string | mongoose.Types.ObjectId) {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}
