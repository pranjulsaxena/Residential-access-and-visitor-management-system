import { NextResponse } from "next/server";

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wraps any API handler in a try/catch.
 * Usage:
 *   export const GET = withErrorHandling(async (req) => { ... });
 */
export function withErrorHandling(
  handler: (...args: any[]) => Promise<NextResponse>
) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Internal server error";
      console.error("[API Error]", msg, error);
      return apiError(msg, 500);
    }
  };
}
