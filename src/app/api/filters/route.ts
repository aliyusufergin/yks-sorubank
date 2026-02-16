import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const [lessons, subjects, sources] = await Promise.all([
        prisma.question.findMany({
            select: { lesson: true },
            distinct: ["lesson"],
            orderBy: { lesson: "asc" },
        }),
        prisma.question.findMany({
            select: { subject: true, lesson: true },
            where: { subject: { not: null } },
            distinct: ["subject"],
            orderBy: { subject: "asc" },
        }),
        prisma.question.findMany({
            select: { source: true },
            where: { source: { not: null } },
            distinct: ["source"],
            orderBy: { source: "asc" },
        }),
    ]);

    return NextResponse.json({
        lessons: lessons.map((l) => l.lesson),
        subjects: subjects.map((s) => ({ subject: s.subject!, lesson: s.lesson })),
        sources: sources.map((s) => s.source!),
    });
}
