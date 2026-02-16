import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const books = await prisma.book.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(books);
}

export async function POST(request: NextRequest) {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: "İsim gerekli" }, { status: 400 });

    const book = await prisma.book.create({ data: { name } });
    return NextResponse.json(book, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
