import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const question = await prisma.question.findUnique({
        where: { id },
        include: { analysis: true },
    });

    if (!question) {
        return NextResponse.json({ error: "Soru bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(question);
}


export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = ["lesson", "subject", "source", "pageNumber", "questionNumber", "answer", "status"];
    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
        if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "Geçerli alan bulunamadı" }, { status: 400 });
    }

    const question = await prisma.question.update({
        where: { id },
        data,
    });

    return NextResponse.json(question);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
        return NextResponse.json({ error: "Soru bulunamadı" }, { status: 404 });
    }

    // Delete file
    try {
        const fileName = question.fileUrl.split("/").pop()!;
        await unlink(join(UPLOAD_DIR, fileName));
    } catch {
        // File might not exist
    }

    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
