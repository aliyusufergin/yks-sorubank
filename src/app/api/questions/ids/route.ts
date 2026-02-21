import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/questions/ids
 *
 * Returns all question IDs matching the given filters (no pagination).
 * Supports optional random selection via `random=true&count=N`.
 * Used by "Tümünü Seç" and "Rastgele Seç" features.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lesson = searchParams.get("lesson");
    const subject = searchParams.get("subject");
    const source = searchParams.get("source");
    const status = searchParams.get("status") || "ACTIVE";
    const hasAnalysis = searchParams.get("hasAnalysis");
    const random = searchParams.get("random") === "true";
    const count = parseInt(searchParams.get("count") || "0");

    const where: Record<string, unknown> = { status };

    if (lesson) where.lesson = lesson;
    if (subject) where.subject = subject;
    if (source) where.source = source;
    if (hasAnalysis === "true") {
        where.analysis = { isNot: null };
    } else if (hasAnalysis === "false") {
        where.analysis = null;
    }

    try {
        if (random && count > 0) {
            // Use Prisma's findMany with orderBy and take for random selection
            // SQLite doesn't support RANDOM() natively in Prisma, so we fetch all IDs
            // and shuffle on server side for correctness
            const allIds = await prisma.question.findMany({
                where,
                select: { id: true },
            });

            // Fisher-Yates shuffle
            const shuffled = allIds.map((q) => q.id);
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            return NextResponse.json({
                ids: shuffled.slice(0, Math.min(count, shuffled.length)),
                total: allIds.length,
            });
        }

        // Return all IDs matching filters
        const questions = await prisma.question.findMany({
            where,
            select: { id: true },
        });

        return NextResponse.json({
            ids: questions.map((q) => q.id),
            total: questions.length,
        });
    } catch (error) {
        console.error("Questions IDs GET error:", error);
        return NextResponse.json({ ids: [], total: 0 });
    }
}
