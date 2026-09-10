import type { ErrorRequestHandler, Request, Response } from "express";

type HttpError = Error & { status?: number; statusCode?: number; type?: string };

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
    requestId: req.id,
  });
}

export const errorHandler: ErrorRequestHandler = (error: HttpError, req, res, _next) => {
  const status = error.status ?? error.statusCode;
  const isTooLarge = status === 413 || error.type === "entity.too.large";
  const isMalformedJson = error instanceof SyntaxError && error.type === "entity.parse.failed";
  const responseStatus = isTooLarge ? 413 : isMalformedJson ? 400 : 500;
  const code = isTooLarge ? "PAYLOAD_TOO_LARGE" : isMalformedJson ? "MALFORMED_JSON" : "INTERNAL_ERROR";
  const message = isTooLarge
    ? "Request body is too large"
    : isMalformedJson
      ? "Malformed JSON body"
      : "Internal server error";

  if (responseStatus === 500) req.log?.error({ err: error }, "Unhandled request error");
  if (!res.headersSent) {
    res.status(responseStatus).json({ error: { code, message }, requestId: req.id });
  } else {
    res.end();
  }
};
