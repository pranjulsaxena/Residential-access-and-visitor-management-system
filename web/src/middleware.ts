import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Routes that need NO auth (login page itself)
const publicRoutes = ["/login", "/api/auth"];

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;

  // Allow public routes and static files
  if (
    publicRoutes.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  // Not logged in → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.role;

  // Role-based route guards
  if (pathname.startsWith("/guard") && role !== "guard") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/resident") && role !== "resident") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/admin") && role !== "secretary") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Root → redirect to role dashboard
  if (pathname === "/") {
    const dest =
      role === "secretary" ? "/admin" : role === "guard" ? "/guard" : "/resident";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
