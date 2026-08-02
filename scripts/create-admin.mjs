import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

async function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = await readFile(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

await loadEnvFile(".env.local");
await loadEnvFile(".env");

const required = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_NAME",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Environment belum lengkap: ${missing.join(", ")}`);
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth(app);
const db = getFirestore(app);
const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
let user;

try {
  user = await auth.getUserByEmail(email);
  user = await auth.updateUser(user.uid, {
    displayName: process.env.ADMIN_NAME,
    password: process.env.ADMIN_PASSWORD,
    disabled: false,
  });
  console.log(`Akun ${email} ditemukan dan diperbarui.`);
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({
    email,
    password: process.env.ADMIN_PASSWORD,
    displayName: process.env.ADMIN_NAME,
    emailVerified: true,
  });
  console.log(`Akun ${email} berhasil dibuat.`);
}

await auth.setCustomUserClaims(user.uid, { role: "admin" });
await db.collection("admins").doc(user.uid).set({
  name: process.env.ADMIN_NAME,
  email,
  role: "admin",
  active: true,
  updatedAt: FieldValue.serverTimestamp(),
  createdAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log("Custom claim admin dan dokumen Firestore berhasil disetel.");
console.log("Keluar lalu login ulang jika akun sebelumnya sedang aktif agar token memuat claim terbaru.");
