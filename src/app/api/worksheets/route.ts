import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const lesson = searchParams.get("lesson");

    const where: Record<string, unknown> = {};
    if (search) where.title = { contains: search };
    if (lesson) {
        where.questions = {
            some: { question: { lesson } },
        };
    }

    const worksheets = await prisma.worksheet.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            name: true,
            createdAt: true,
            _count: { select: { questions: true } },
            questions: {
                select: { question: { select: { lesson: true } } },
                orderBy: { order: "asc" },
            },
        },
    });

    return NextResponse.json(worksheets);
}

export async function POST(request: NextRequest) {
    const { title, name, questionIds } = await request.json();

    if (!questionIds?.length) {
        return NextResponse.json({ error: "En az bir soru seçin" }, { status: 400 });
    }

    const worksheet = await prisma.worksheet.create({
        data: {
            title: title || `Çalışma Kağıdı - ${new Date().toLocaleDateString("tr-TR")}`,
            name: name || null,
            questions: {
                create: questionIds.map((id: string, index: number) => ({
                    questionId: id,
                    order: index,
                })),
            },
        },
        include: {
            questions: {
                include: { question: true },
                orderBy: { order: "asc" },
            },
        },
    });

    return NextResponse.json(worksheet, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const { ids } = await request.json();

    if (!ids?.length) {
        return NextResponse.json({ error: "Silinecek çalışma kağıdı seçin" }, { status: 400 });
    }

    await prisma.worksheet.deleteMany({
        where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, deleted: ids.length });
}
