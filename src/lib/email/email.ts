import transporter from "#src/config/nodemailer.config";
import env from "#src/utils/env";
import { SendMailOptions } from "nodemailer";

/**
 * Sends an email using the configured Nodemailer transporter.
 *
 * @async
 * @function sendMail
 * @param {Object} options - The email options.
 * @param {string|string[]} options.to - Recipient email address(es).
 * @param {string} options.subject - Email subject line.
 * @param {string} [options.text] - Plain text version of the message.
 * @param {string} [options.html] - HTML version of the message.
 * @param {Object.<string, any>} [options.rest] - Additional email options to pass to Nodemailer.
 *                                                 See: https://nodemailer.com/message/
 * @returns {Promise<Object>} A promise resolving to the Nodemailer info object on success.
 *                            See: https://nodemailer.com/usage/
 * @throws {Error} If email sending fails or if there's an issue with the transporter.
 * @example
 * try {
 *   const info = await sendMail({
 *     to: 'recipient@example.com',
 *     subject: 'Hello',
 *     text: 'Hello world',
 *     html: '<p>Hello world</p>'
 *   });
 *   console.log('Email sent successfully:', info);
 * } catch (error) {
 *   console.error('Failed to send email:', error);
 * }
 */

export const sendMail = async ({ to, subject, text, html, ...rest }: SendMailOptions) => {
  const info = await transporter.sendMail({
    from: { name: env.get("APP_Name"), address: env.get("EMAIL_USER") },
    to,
    subject,
    text,
    html,
    ...(Object.keys(rest).length && rest)
  });

  return info;
};
