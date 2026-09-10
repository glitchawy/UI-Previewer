import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.headers['x-paymob-hmac']",
    "req.headers['x-authevo-signature']",
    "req.query.hmac",
    "req.body.otp",
    "req.body.otpCode",
    "req.body.token",
    "req.body.sessionToken",
    "req.body.accessToken",
    "req.body.refreshToken",
    "req.body.hmac",
    "body.otp",
    "body.otpCode",
    "body.token",
    "body.sessionToken",
    "body.accessToken",
    "body.refreshToken",
    "body.hmac",
    "*.otp",
    "*.otpCode",
    "*.token",
    "*.sessionToken",
    "*.accessToken",
    "*.refreshToken",
    "*.hmac",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
