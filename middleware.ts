import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const middleware = withAuth(
  function middleware(req: any) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes - require admin role
    if (pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/backoffice-login", req.url));
      }
      if (token.role !== "admin") {
        return NextResponse.redirect(new URL("/dealer/dashboard", req.url));
      }
    }

    // Dealer routes - require dealer or admin role
    if (pathname.startsWith("/dealer")) {
      if (!token) {
        return NextResponse.redirect(new URL("/backoffice-login", req.url));
      }
      if (token.role !== "dealer" && token.role !== "admin") {
        return NextResponse.redirect(new URL("/backoffice-login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/backoffice-login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow these without authentication
        if (
          pathname.startsWith("/backoffice-login") ||
          pathname.startsWith("/backoffice-signup") ||
          pathname.startsWith("/auth/callback") // ← add this line
        ) {
          return true;
        }

        if (pathname.startsWith("/admin") || pathname.startsWith("/dealer")) {
          return !!token;
        }

        return true;
      },
    },
  },
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dealer/:path*",
    "/backoffice-login",
    "/backoffice-signup",
    "/auth/callback", // ← add this line
  ],
};
