export function getFirebaseAuthMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  if (code.includes("email-already-in-use")) return "Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email atau password tidak sesuai.";
  if (code.includes("weak-password")) return "Password terlalu lemah. Gunakan minimal 6 karakter.";
  if (code.includes("invalid-email")) return "Format email tidak valid.";
  if (code.includes("too-many-requests")) return "Terlalu banyak percobaan. Coba kembali beberapa saat lagi.";
  return error instanceof Error ? error.message : "Autentikasi tidak dapat diselesaikan.";
}
