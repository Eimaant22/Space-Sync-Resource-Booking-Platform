import crypto from 'crypto';
import redisClient from '../config/redis';
import transporter from '../config/mailer';
import env from '../config/env';

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes time to live

const signupKey = (email: string) => `otp:signup:${email}`;
const resetKey = (email: string) => `otp:reset:${email}`;
const resetTokenKey = (email: string) => `reset_token:${email}`;

const generateOTP = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

const storeOTP = async (key: string, otp: string): Promise<void> => {
    await redisClient.set(key, otp, { EX: OTP_TTL_SECONDS });
};

const sendOTPEmail = async (
    to: string,
    subject: string,
    otp: string
): Promise<void> => {
    await transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject,
        html: `
        <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:28px;font-weight:700;">
                        SpaceSync
                    </h1>
                    <p style="margin:12px 0 0;font-size:15px;opacity:.95;">
                        Smart Resource Booking Platform
                    </p>
                </div>

                <!-- Body -->
                <div style="padding:40px 32px;color:#374151;line-height:1.7;">
                    <h2 style="margin-top:0;color:#111827;">
                        Verify Your Email Address
                    </h2>

                    <p>
                        Hello,
                    </p>

                    <p>
                        Thank you for choosing <strong>SpaceSync</strong>.
                        To continue using our Resource Booking Platform, please verify your email address using the One-Time Password (OTP) below.
                    </p>

                    <p>
                        Enter this verification code in the application to complete the email verification process and proceed with your signup request.
                    </p>

                    <!-- OTP Box -->
                    <div style="margin:32px 0;text-align:center;">
                        <div style="
                            display:inline-block;
                            background:#EEF2FF;
                            border:2px dashed #4F46E5;
                            border-radius:12px;
                            padding:18px 36px;
                            font-size:34px;
                            font-weight:bold;
                            letter-spacing:12px;
                            color:#4F46E5;
                        ">
                            ${otp}
                        </div>
                    </div>

                    <p style="text-align:center;font-size:15px;color:#6B7280;">
                        This verification code will expire in
                        <strong style="color:#111827;">10 minutes</strong>.
                    </p>

                    <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;" />

                    <p style="font-size:14px;color:#6B7280;">
                        If you did not request this verification code, you can safely ignore this email. No signup request will be created unless your email address is verified.
                    </p>
                </div>

                <!-- Footer -->
                <div style="
                    background:#F9FAFB;
                    padding:24px;
                    text-align:center;
                    color:#6B7280;
                    font-size:13px;
                    border-top:1px solid #E5E7EB;
                ">
                    <strong style="color:#374151;">SpaceSync</strong><br/>
                    Secure Resource Booking Platform<br/><br/>

                    © ${new Date().getFullYear()} SpaceSync. All rights reserved.
                </div>

            </div>
        </div>
        `,
    });
};

export const sendSignupOTP = async (email: string): Promise<void> => {
    const otp = generateOTP();
    await storeOTP(signupKey(email), otp);
    await sendOTPEmail(
        email,
        'Verify your SpaceSync email address',
        otp
    );
};

export const verifySignupOTP = async (
    email: string,
    otp: string
): Promise<boolean> => {
    const stored = await redisClient.get(signupKey(email));
    if (!stored || stored !== otp) return false;
    await redisClient.del(signupKey(email));
    return true;
};

export const sendResetOTP = async (email: string): Promise<void> => {
    const otp = generateOTP();
    await storeOTP(resetKey(email), otp);
    await sendOTPEmail(
        email,
        'Reset your SpaceSync account password',
        otp
    );
};

export const verifyResetOTP = async (
    email: string,
    otp: string
): Promise<boolean> => {
    const stored = await redisClient.get(resetKey(email));
    if (!stored || stored !== otp) return false;
    await redisClient.del(resetKey(email));
    return true;
};

export const storeResetToken = async (
    email: string,
    token: string
): Promise<void> => {
    await redisClient.set(resetTokenKey(email), token, { EX: 15 * 60 });
};

export const verifyResetToken = async (
    email: string,
    token: string
): Promise<boolean> => {
    const stored = await redisClient.get(resetTokenKey(email));
    if (!stored || stored !== token) return false;
    await redisClient.del(resetTokenKey(email));
    return true;
};