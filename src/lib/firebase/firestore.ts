import "server-only";

import { Timestamp } from "firebase-admin/firestore";

export function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => stripUndefined(item)) as T;
  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return value;

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (child !== undefined) result[key] = stripUndefined(child);
    }
    return result as T;
  }
  return value;
}
