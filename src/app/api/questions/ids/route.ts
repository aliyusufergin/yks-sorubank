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
            // Build raw SQL for efficient random selection via SQLite's RANDOM()
            const conditions: string[] = [`"status" = '${status}'`];
            if (lesson) conditions.push(`"lesson" = '${lesson.replace(/'/g, "''")}'`);
            if (subject) conditions.push(`"subject" = '${subject.replace(/'/g, "''")}'`);
            if (source) conditions.push(`"source" = '${source.replace(/'/g, "''")}'`);
            if (hasAnalysis === "true") {
                conditions.push(`"id" IN (SELECT "questionId" FROM "QuestionAnalysis")`);
            } else if (hasAnalysis === "false") {
                conditions.push(`"id" NOT IN (SELECT "questionId" FROM "QuestionAnalysis")`);
            }

            const whereClause = conditions.join(" AND ");
            const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
                `SELECT "id" FROM "Question" WHERE ${whereClause} ORDER BY RANDOM() LIMIT ${Math.max(1, count)}`
            );
            const totalRows = await prisma.$queryRawUnsafe<{ count: number }[]>(
                `SELECT COUNT(*) as count FROM "Question" WHERE ${whereClause}`
            );

            return NextResponse.json({
                ids: rows.map((r) => r.id),
                total: Number(totalRows[0]?.count ?? 0),
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
