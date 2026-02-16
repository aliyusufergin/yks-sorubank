import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const prompts = await prisma.aIPrompt.findMany({
        orderBy: [{ lesson: "asc" }, { subject: "asc" }],
    });
    return NextResponse.json(prompts);
}

export async function POST(request: NextRequest) {
    const { lesson, subject, prompt } = await request.json();

    if (!lesson || !prompt) {
        return NextResponse.json({ error: "Ders ve prompt gerekli" }, { status: 400 });
    }

    const subjectKey = subject?.trim() || "__default__";

    const existing = await prisma.aIPrompt.findFirst({
        where: { lesson, subject: subjectKey },
    });

    if (existing) {
        const updated = await prisma.aIPrompt.update({
            where: { id: existing.id },
            data: { prompt },
        });
        return NextResponse.json(updated);
    }

    const created = await prisma.aIPrompt.create({
        data: { lesson, subject: subjectKey, prompt },
    });

    return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    await prisma.aIPrompt.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
