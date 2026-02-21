import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { processAndSave } from "@/lib/imageProcessing";

const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./data/uploads");

/**
 * POST /api/questions/reprocess
 * Re-processes existing uploaded images with the document-scan pipeline.
 * Body: { ids?: string[] }  — if omitted, re-processes ALL questions.
 *
 * Images are processed sequentially to avoid memory pressure.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    const where = ids?.length ? { id: { in: ids } } : {};

    const questions = await prisma.question.findMany({
        where,
        select: { id: true, fileId: true, fileUrl: true },
    });

    if (questions.length === 0) {
        return NextResponse.json({ error: "İşlenecek soru bulunamadı" }, { status: 404 });
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const q of questions) {
        try {
            const fileName = `${q.fileId}.webp`;
            const filePath = join(UPLOAD_DIR, fileName);

            // Read existing file
            const original = await readFile(filePath);

            // Re-process and overwrite
            await processAndSave(original, filePath);

            processed++;
        } catch (err) {
            failed++;
            errors.push(`${q.id}: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
        }
    }

    return NextResponse.json({
        success: true,
        total: questions.length,
        processed,
        failed,
        ...(errors.length > 0 ? { errors: errors.slice(0, 10) } : {}),
    });
}
