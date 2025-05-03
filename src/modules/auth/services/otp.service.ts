import { TokenType } from "#src/db/models/token.model";
import { tokenRepository } from "#src/db/repositories/token.repository";
import { OTP_EXPIRY_TIME } from "#src/utils/constants";
import { castToObjectId, isDateExpired, randomString, setExpiryDate } from "#src/utils/helpers";
import { compare, hash } from "bcrypt";
import mongoose from "mongoose";

/**
 * Sends a One-Time Password (OTP) to the specified email address.
 *
 * @param {string} userId - The ID of the user associated with the OTP.
 * @param {TokenType} type - The type of token (e.g., email verification, password reset).
 * @returns {Promise<string>} - The generated OTP value.
 * @throws {Error} - Throws an error if email or userId is not provided.
 */
export const getOtp = async (userId: mongoose.Types.ObjectId | string, type: TokenType) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }
  const id = castToObjectId(userId);
  await tokenRepository.deleteMany({ user: id, type });
  const value = randomString(6, "numeric");
  //console.log(value);
  const hashedValue = await hash(value, 10);
  await tokenRepository.create({
    user: id,
    value: hashedValue,
    type,
    expireAt: setExpiryDate(OTP_EXPIRY_TIME)
  });
  return value;
};

/**
 * Validates the provided OTP against the stored token.
 * @param {string} userId - The ID of the user associated with the OTP.
 * @param {string} otp - The OTP to validate.
 * @returns {Promise<boolean>} - Returns true if the OTP is valid and not expired, false otherwise.
 */
export const validateOtp = async (
  userId: mongoose.Types.ObjectId | string,
  otp: string,
  type: TokenType
) => {
  const id = castToObjectId(userId);

  const token = await tokenRepository.findOne({ user: id, type });
  if (!token || isDateExpired(token.expireAt)) {
    await tokenRepository.deleteMany({ user: id, type });
    return false;
  }
  const isMatch = await compare(otp, token.value);
  if (!isMatch) {
    return false;
  }
  await tokenRepository.deleteMany({ user: id, type });
  return true;
};
