// Resizes a picture in the browser (longest edge 1600 px, JPEG, which also drops metadata such as
// location) until it fits the server's size limit, then uploads it and returns its address.

import { api } from "../../api";

const MAX_EDGE = 1600;
const MAX_BYTES = 580 * 1024; // the server accepts up to 600 KB
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

const bytesOf = (dataUrl: string) => Math.ceil(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);

async function toJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let edge = Math.min(MAX_EDGE, Math.max(bitmap.width, bitmap.height));
  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      const scale = edge / Math.max(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.fillStyle = "#fff"; // transparent PNGs get a white background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", attempt < 3 ? 0.85 - attempt * 0.1 : 0.7);
      if (bytesOf(dataUrl) <= MAX_BYTES) return dataUrl;
      if (attempt >= 2) edge = Math.round(edge * 0.8);
    }
    throw new Error("too large");
  } finally {
    bitmap.close();
  }
}

/** Uploads a picture chosen by the user; throws an Error with a Persian message on failure. */
export async function uploadPicture(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("لطفاً یک فایل تصویری انتخاب کنید.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("حجم تصویر بیشتر از ۱۵ مگابایت است.");
  let dataUrl: string;
  try {
    dataUrl = await toJpeg(file);
  } catch {
    throw new Error("این تصویر قابل خواندن نیست؛ تصویر دیگری امتحان کنید.");
  }
  const { url } = await api.uploadImage(dataUrl);
  return url;
}
