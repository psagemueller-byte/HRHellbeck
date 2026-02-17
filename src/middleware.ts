import { auth } from "@/auth";
import { NextResponse } from "next/server";

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

  // Redirect unauthenticated users to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is active
  if (req.auth.user && !(req.auth.user as { isActive?: boolean }).isActive) {
    return NextResponse.redirect(
      new URL("/login?error=Deactivated", req.url)
    );
  }

  // Admin-only routes
  const adminRoutes = ["/admin", "/organigramm"];
  if (
    adminRoutes.some((r) => pathname.startsWith(r)) &&
    (req.auth.user as { role?: string })?.role !== "admin"
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
