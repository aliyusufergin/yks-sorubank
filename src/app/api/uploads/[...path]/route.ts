import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, resolve } from "path";

const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./data/uploads");

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const fileName = path.join("/");

    // Prevent path traversal
    const filePath = resolve(join(UPLOAD_DIR, fileName));
    if (!filePath.startsWith(UPLOAD_DIR)) {
        return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
    }

    try {
        const file = await readFile(filePath);

        const ext = fileName.split(".").pop()?.toLowerCase();
        const contentType =
            ext === "webp"
                ? "image/webp"
                : ext === "png"
                    ? "image/png"
                    : ext === "jpg" || ext === "jpeg"
                        ? "image/jpeg"
                        : "application/octet-stream";

        return new NextResponse(file, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }
}
