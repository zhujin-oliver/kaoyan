import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "kaoyan-token";

// Routes that don't require authentication
const publicRoutes = ["/login", "/register"];

// API routes that don't require authentication
const publicApiPrefixes = ["/api/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isAuthenticated = !!token;

  // Allow public routes
  if (publicRoutes.includes(pathname) || publicApiPrefixes.some(p => pathname.startsWith(p))) {
    // If already logged in and trying to access login/register, redirect to home
    if (isAuthenticated && publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes (pages + API)
  if (!isAuthenticated) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    // For pages, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
