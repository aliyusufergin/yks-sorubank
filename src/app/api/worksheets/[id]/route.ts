import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const worksheet = await prisma.worksheet.findUnique({
        where: { id },
        include: {
            questions: {
                include: { question: true },
                orderBy: { order: "asc" },
            },
        },
    });

    if (!worksheet) {
        return NextResponse.json({ error: "Çalışma kağıdı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(worksheet);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    const worksheet = await prisma.worksheet.update({
        where: { id },
        data: body,
    });

    return NextResponse.json(worksheet);
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    await prisma.worksheet.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
