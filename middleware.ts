import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Only protect specific routes
  const protectedPaths = ["/", "/files", "/api/files"];
  const isProtectedPath = protectedPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      (path !== "/" && request.nextUrl.pathname.startsWith(path))
  );

  // Allow login page and auth API
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/api/auth"
  ) {
    return NextResponse.next();
  }

  if (isProtectedPath) {
    const token = request.cookies.get("auth-token")?.value;

    console.log("Middleware check:", {
      path: request.nextUrl.pathname,
      hasToken: !!token,
    });

    if (!token) {
      console.log("No token found, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT secret not configured");
      }

      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret);
      console.log("Token verified successfully for:", payload.username);
      return NextResponse.next();
    } catch (error) {
      console.log("Token verification failed, redirecting to login");
      // Invalid token, redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
