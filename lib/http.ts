import { NextResponse } from "next/server";

export const MAX_BYTES = 32 * 1024 * 1024;

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function readUpload(
  request: Request,
  field = "file",
): Promise<{ buffer: Buffer; filename: string }> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) {
    throw Object.assign(new Error("Fichier trop volumineux (max 32 Mo)"), { status: 413 });
  }
  const form = await request.formData();
  const file = form.get(field);
  if (!file || typeof file === "string") {
    throw Object.assign(new Error("Fichier manquant"), { status: 400 });
  }
  const blob = file as File;
  if (blob.size > MAX_BYTES) {
    throw Object.assign(new Error("Fichier trop volumineux (max 32 Mo)"), { status: 413 });
  }
  const buffer = Buffer.from(await blob.arrayBuffer());
  return { buffer, filename: blob.name || "upload" };
}

export function withStatus(err: unknown): { message: string; status: number } {
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    return { message: String((err as { message: string }).message), status: Number((err as { status: number }).status) };
  }
  if (err instanceof Error) return { message: err.message, status: 400 };
  return { message: "Erreur", status: 500 };
}
