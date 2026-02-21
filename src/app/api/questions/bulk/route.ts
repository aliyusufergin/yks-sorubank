import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads";

export async function POST(request: NextRequest) {
    const { ids, status } = await request.json();

    if (!ids?.length || !status) {
        return NextResponse.json({ error: "ID listesi ve durum gerekli" }, { status: 400 });
    }

    const allowedStatuses = ["ACTIVE", "MASTERED"];
    if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }

    await prisma.question.updateMany({
        where: { id: { in: ids } },
        data: { status },
    });

    return NextResponse.json({ success: true, count: ids.length });
}

export async function DELETE(request: NextRequest) {
    const { ids } = await request.json();

    if (!ids?.length) {
        return NextResponse.json({ error: "ID listesi gerekli" }, { status: 400 });
    }

    // Find questions to get file paths
    const questions = await prisma.question.findMany({
        where: { id: { in: ids } },
        select: { id: true, fileUrl: true },
    });

    // Delete files from disk
    await Promise.all(
        questions.map(async (q) => {
            try {
                const fileName = q.fileUrl.split("/").pop()!;
                await unlink(join(UPLOAD_DIR, fileName));
            } catch {
                // File might not exist
            }
        })
    );

    // Delete from database
    await prisma.question.deleteMany({
        where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, count: questions.length });
}
