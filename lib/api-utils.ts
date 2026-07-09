import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function handleZodError(error: ZodError) {
  const messages = error.issues.map(
    (e) => `${e.path.join(".")}: ${e.message}`
  );
  return apiError(messages.join("; "), 422);
}
