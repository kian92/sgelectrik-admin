import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const middleware = withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/api") && token?.role === "editor") {
      const editorApi =
        pathname.startsWith("/api/blog-posts") ||
        pathname.startsWith("/api/upload") ||
        pathname.startsWith("/api/auth");
      if (!editorApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Superadmins can access every admin route; editors are limited to blog.
    if (pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/backoffice-login", req.url));
      }
      if (token.role === "editor" && pathname.startsWith("/admin/blog")) {
        return NextResponse.next();
      }
      if (token.role !== "superadmin") {
        return NextResponse.redirect(new URL("/dealer/dashboard", req.url));
      }
    }

    // Dealer routes - require dealer or admin role
    if (pathname.startsWith("/dealer")) {
      if (!token) {
        return NextResponse.redirect(new URL("/backoffice-login", req.url));
      }
      if (token.role !== "dealer" && token.role !== "superadmin") {
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
    "/api/:path*",
  ],
};
