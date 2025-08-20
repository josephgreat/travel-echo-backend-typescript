"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOtp = exports.getOtp = void 0;
const token_repository_1 = require("#src/db/repositories/token.repository");
const constants_1 = require("#src/utils/constants");
const helpers_1 = require("#src/utils/helpers");
const bcrypt_1 = require("bcrypt");
/**
 * Sends a One-Time Password (OTP) to the specified email address.
 *
 * @param {string} userId - The ID of the user associated with the OTP.
 * @param {TokenType} type - The type of token (e.g., email verification, password reset).
 * @returns {Promise<string>} - The generated OTP value.
 * @throws {Error} - Throws an error if email or userId is not provided.
 */
const getOtp = async (userId, type) => {
    if (!userId) {
        throw new Error("User ID is required.");
    }
    const id = (0, helpers_1.castToObjectId)(userId);
    await token_repository_1.tokenRepository.deleteMany({ user: id, type });
    const value = (0, helpers_1.randomString)(6, "numeric");
    //console.log(value);
    const hashedValue = await (0, bcrypt_1.hash)(value, 10);
    await token_repository_1.tokenRepository.create({
        user: id,
        value: hashedValue,
        type,
        expireAt: (0, helpers_1.setExpiryDate)(constants_1.OTP_EXPIRY_TIME)
    });
    return value;
};
exports.getOtp = getOtp;
/**
 * Validates the provided OTP against the stored token.
 * @param {string} userId - The ID of the user associated with the OTP.
 * @param {string} otp - The OTP to validate.
 * @returns {Promise<boolean>} - Returns true if the OTP is valid and not expired, false otherwise.
 */
const validateOtp = async (userId, otp, type) => {
    const id = (0, helpers_1.castToObjectId)(userId);
    const token = await token_repository_1.tokenRepository.findOne({ user: id, type });
    if (!token || (0, helpers_1.isDateExpired)(token.expireAt)) {
        await token_repository_1.tokenRepository.deleteMany({ user: id, type });
        return false;
    }
    const isMatch = await (0, bcrypt_1.compare)(otp, token.value);
    if (!isMatch) {
        return false;
    }
    await token_repository_1.tokenRepository.deleteMany({ user: id, type });
    return true;
};
exports.validateOtp = validateOtp;
