import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    const { ids, status } = await request.json();

    if (!ids?.length || !status) {
        return NextResponse.json({ error: "ID listesi ve durum gerekli" }, { status: 400 });
    }

    await prisma.question.updateMany({
        where: { id: { in: ids } },
        data: { status },
    });

    return NextResponse.json({ success: true, count: ids.length });
}
