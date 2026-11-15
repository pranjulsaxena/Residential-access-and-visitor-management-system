import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type AllowedRole = "guard" | "resident" | "secretary";

/**
 * Returns the authenticated session user, or sends a 401/403 JSON response.
 * Usage:
 *   const { error, user } = await requireAuth("guard");
 *   if (error) return error;
 */
export async function requireAuth(...roles: AllowedRole[]) {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }

  if (roles.length > 0 && !roles.includes(session.user.role as AllowedRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }

  return { error: null, user: session.user };
}
