"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAge = computeAge;
exports.isPlainObject = isPlainObject;
exports.signJWT = signJWT;
exports.pick = pick;
exports.omit = omit;
exports.setExpiryDate = setExpiryDate;
exports.isDateExpired = isDateExpired;
exports.randomString = randomString;
exports.castToObjectId = castToObjectId;
/* eslint-disable @typescript-eslint/no-explicit-any */
const jsonwebtoken_1 = require("jsonwebtoken");
const env_1 = __importDefault(require("./env"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
function computeAge(dateOfBirth) {
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
function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value) && value instanceof Date;
}
function signJWT(data, options) {
    return (0, jsonwebtoken_1.sign)(data, env_1.default.get("JWT_SECRET"), options);
}
function setDeep(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const part = path[i];
        if (typeof current[part] !== "object" ||
            current[part] === null ||
            current[part] === undefined) {
            current[part] = {};
        }
        current = current[part];
    }
    if (path.length > 0) {
        current[path[path.length - 1]] = value;
    }
}
/**
 * Creates an object composed of the picked object properties or nested properties. *
 * @template T The type of the source object
 * @template P The literal type of keys to pick (can be dot-notation paths or a union of paths)
 * @param obj The source object
 * @param paths The property paths to pick (a single path string or an array of path strings)
 * @returns A new object with just the picked properties, preserving nested structure.
 */
function pick(obj, paths) {
    const result = {};
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    for (const keyPath of pathsArray) {
        const pathParts = keyPath.split(".");
        let current = obj;
        let exists = true;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            const isLastPart = i === pathParts.length - 1;
            const canDescend = current !== null && current !== undefined && typeof current === "object" && part in current;
            const existsFinalPart = current !== null && current !== undefined && part in current;
            if (isLastPart ? existsFinalPart : canDescend) {
                current = current[part];
            }
            else {
                exists = false;
                break;
            }
        }
        if (exists) {
            setDeep(result, pathParts, current);
        }
    }
    return result;
}
/**
 *
 * @param obj
 * @param {string | string[]} keys
 * @returns An object with the specified keys removed
 */
function omit(obj, keys) {
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
            }
            else {
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
function setExpiryDate(validityPeriod) {
    const [n, t] = validityPeriod.split(" ");
    const num = parseInt(n, 10);
    let multiplier;
    const time = t.toLowerCase();
    if (time.includes("second"))
        multiplier = 1000;
    else if (time.includes("minute"))
        multiplier = 60 * 1000;
    else if (time.includes("hour"))
        multiplier = 60 * 60 * 1000;
    else
        throw new Error("Invalid time unit. Only 'seconds', 'minutes' or 'hours' are supported.");
    const expiryTime = Date.now() + num * multiplier;
    return new Date(expiryTime);
}
/**
 * Checks if the supplied date has expired.
 * @param {Date | string | number} expiryTime - The expiry time as a Date object, timestamp, or ISO string.
 * @returns {boolean} True if expired, otherwise false.
 */
function isDateExpired(expiryTime) {
    return Date.now() > new Date(expiryTime).getTime();
}
function randomString(lengthOrPattern, type) {
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
    const getUnbiasedRandomChar = (charset) => {
        const charsetLength = charset.length;
        const bytesNeeded = Math.ceil(Math.log(charsetLength) / Math.log(256));
        const maxValidValue = Math.floor(256 ** bytesNeeded / charsetLength) * charsetLength;
        while (true) {
            const randomBytes = node_crypto_1.default.randomBytes(bytesNeeded);
            let randomValue = 0;
            for (let i = 0; i < bytesNeeded; i++) {
                randomValue = randomValue * 256 + randomBytes[i];
            }
            if (randomValue < maxValidValue) {
                return charset[randomValue % charsetLength];
            }
        }
    };
    if (lengthOrPattern === undefined ||
        lengthOrPattern === null ||
        typeof lengthOrPattern === "number") {
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
        if (match === "9")
            charset = charSets.numeric;
        else if (match === "A")
            charset = charSets.uppercase;
        else if (match === "a")
            charset = charSets.alphabetic;
        return getUnbiasedRandomChar(charset);
    });
}
function castToObjectId(id) {
    return typeof id === "string" ? new mongoose_1.default.Types.ObjectId(id) : id;
}
