import fs from "node:fs/promises";
import path from "node:path";

export function getUploadBaseDir() {
  return path.join(process.cwd(), process.env.UPLOAD_DIR ?? "public/uploads");
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveBufferToUpload(params: { societyId: string; subdir: string; filename: string; data: Buffer }) {
  const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const relative = path.join(params.societyId, params.subdir, `${Date.now()}-${safeName}`);
  const abs = path.join(getUploadBaseDir(), relative);
  await ensureDir(path.dirname(abs));
  await fs.writeFile(abs, params.data);
  return `/uploads/${relative.replace(/\\/g, "/")}`;
}
