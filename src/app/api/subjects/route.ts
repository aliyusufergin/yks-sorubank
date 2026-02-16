import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const subjects = await prisma.subject.findMany({
        orderBy: { name: "asc" },
        include: { lesson: true },
    });
    return NextResponse.json(subjects);
}

export async function POST(request: NextRequest) {
    const { name, lessonId } = await request.json();
    if (!name || !lessonId) {
        return NextResponse.json({ error: "İsim ve ders gerekli" }, { status: 400 });
    }

    const subject = await prisma.subject.create({ data: { name, lessonId } });
    return NextResponse.json(subject, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
