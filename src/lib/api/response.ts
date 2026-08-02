import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Data tidak valid.", fields } },
      { status: 400 },
    );
  }

  const message = error instanceof Error ? error.message : "Terjadi kesalahan internal.";
  const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 500;
  const publicMessage =
    status === 401 ? "Silakan masuk terlebih dahulu." :
    status === 403 ? "Anda tidak memiliki izin untuk tindakan ini." :
    status === 404 ? "Data tidak ditemukan." :
    process.env.NODE_ENV === "development" ? message : "Tindakan tidak dapat diselesaikan.";

  return NextResponse.json(
    { ok: false, error: { code: status === 500 ? "INTERNAL_ERROR" : message, message: publicMessage } },
    { status },
  );
}
