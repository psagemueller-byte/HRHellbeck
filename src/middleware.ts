import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_ROUTES = [
  "/login",
  "/datenschutz",
  "/impressum",
  "/passwort-vergessen",
  "/passwort-zuruecksetzen",
  "/konto-einrichten",
  "/api/auth",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) return NextResponse.next();

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|ico)$/)
  ) {
    return NextResponse.next();
  }

  // Check session (Auth.js v5 — reads cookie natively)
  const session = req.auth;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is active
  if (session.user?.isActive === false) {
    return NextResponse.redirect(
      new URL("/login?error=Deactivated", req.url)
    );
  }

  // Admin-only routes
  const adminRoutes = ["/admin", "/organigramm"];
  if (
    adminRoutes.some((r) => pathname.startsWith(r)) &&
    session.user?.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo_hellbeck.svg).*)",
  ],
};
