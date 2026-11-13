import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny, output } from "zod";

/** Client-facing error with an HTTP status and a machine-readable code. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

/** Forwards rejected promises to the error handler (Express 4 does not do this for async handlers). */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/**
 * Parses a request body with Zod; throws a 400 with per-field issues on failure.
 * Returns the schema's output type, so fields with defaults are never undefined.
 */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "داده‌های ارسالی معتبر نیست",
      result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    );
  }
  return result.data;
}

/** Uniform error response shape: { error: { code, message, details? } } */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  // Malformed JSON body (thrown by express.json)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "JSON ارسالی خراب است" } });
    return;
  }
  // A body over the route's size limit (thrown by express.json / express.raw)
  if (typeof err === "object" && err && (err as { type?: string }).type === "entity.too.large") {
    res.status(413).json({ error: { code: "TOO_LARGE", message: "حجم فایل بیشتر از حد مجاز است" } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "خطای داخلی سرور" } });
}
