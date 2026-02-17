import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = [
  "/login",
  "/datenschutz",
  "/impressum",
  "/passwort-vergessen",
  "/passwort-zuruecksetzen",
  "/konto-einrichten",
  "/api/auth",
];

export async function middleware(req: NextRequest) {
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

  // Check JWT token (lightweight — no Prisma/bcrypt import)
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is active
  if (token.isActive === false) {
    return NextResponse.redirect(
      new URL("/login?error=Deactivated", req.url)
    );
  }

  // Admin-only routes
  const adminRoutes = ["/admin", "/organigramm"];
  if (
    adminRoutes.some((r) => pathname.startsWith(r)) &&
    token.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo_hellbeck.svg).*)",
  ],
};
