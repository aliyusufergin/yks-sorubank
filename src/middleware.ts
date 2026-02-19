import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );

    // File upload size limit (10MB) — reject oversized requests early
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        if (request.nextUrl.pathname.startsWith("/api/questions")) {
            return NextResponse.json(
                { error: "Dosya boyutu çok büyük (max 10MB)" },
                { status: 413 }
            );
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except Next.js internals and static files
         */
        "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
    ],
};
