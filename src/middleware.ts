import { NextRequest, NextResponse } from "next/server";
import { decrypt, TOKEN_NAME } from "@/lib/auth";

const publicRoutes = ["/", "/signin", "/signup", "/forgot-password", "/reset-password"];
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const path = nextUrl.pathname;

  // Check if path is a public route or starts with a public route (for dynamic segments like reset-password/[token])
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith("/reset-password/")
  );
  
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

  const session = request.cookies.get(TOKEN_NAME)?.value;
  let user = null;

  if (session) {
    try {
      const decoded = await decrypt(session);
      user = decoded.user;
    } catch (e) {
      // Invalid session
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (path === "/signin" || path === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protect private routes
  if (!user && !isPublicRoute) {
    const searchParams = new URLSearchParams(nextUrl.search);
    searchParams.set("from", path);
    return NextResponse.redirect(new URL(`/signin?${searchParams.toString()}`, nextUrl));
  }

  // Protect admin routes
  if (isAdminRoute && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
