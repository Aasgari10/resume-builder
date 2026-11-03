// Profile photo uploads. The browser crops and resizes the image and sends it as a data URL;
// the server checks the real file type from its bytes, enforces size and quota, and stores it on disk.

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import express, { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { env } from "../env";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { sniffImage } from "../lib/image";
import { currentUserId, requireAuth } from "../middleware/auth";

export const UPLOADS_PATH = "/_uploads";
const MAX_BYTES = 600 * 1024;
const MAX_FILES_PER_USER = 50;

/** Serves uploaded files; names are random and never reused, so they are cached for a long time. */
export const uploadsStatic = express.static(env.uploadDir, {
  maxAge: "365d",
  immutable: true,
  index: false,
  dotfiles: "deny",
  setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
});

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

const body = z.object({ dataUrl: z.string().max(Math.ceil((MAX_BYTES * 4) / 3) + 100) });

/** POST /api/uploads/avatar  { dataUrl } — returns { url } of the stored image. */
uploadsRouter.post(
  "/avatar",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { dataUrl } = parseBody(body, req.body);

    const match = /^data:image\/[a-z+.-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match?.[1]) throw new HttpError(400, "INVALID_IMAGE", "فایل تصویر معتبر نیست");
    const bytes = Buffer.from(match[1], "base64");
    if (bytes.length > MAX_BYTES) throw new HttpError(413, "IMAGE_TOO_LARGE", "حجم تصویر زیاد است");
    const kind = sniffImage(bytes);
    if (!kind) throw new HttpError(400, "INVALID_IMAGE", "فقط تصویر JPG، PNG یا WebP پذیرفته می‌شود");

    const count = await prisma.upload.count({ where: { userId } });
    if (count >= MAX_FILES_PER_USER) throw new HttpError(429, "UPLOAD_LIMIT", "تعداد تصاویر آپلودشده به سقف رسیده است");

    const fileName = `${randomUUID()}.${kind.ext}`;
    await mkdir(env.uploadDir, { recursive: true });
    await writeFile(join(env.uploadDir, fileName), bytes, { flag: "wx" });
    await prisma.upload.create({ data: { userId, fileName, mimeType: kind.mime, size: bytes.length } });

    res.status(201).json({ url: `${env.appUrl}${UPLOADS_PATH}/${fileName}` });
  })
);
