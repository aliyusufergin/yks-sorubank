import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mkdir } from "fs/promises";
import { join } from "path";
import { processAndSave } from "@/lib/imageProcessing";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads";
const DEFAULT_LIMIT = 50;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lesson = searchParams.get("lesson");
    const subject = searchParams.get("subject");
    const source = searchParams.get("source");
    const status = searchParams.get("status") || "ACTIVE";
    const search = searchParams.get("search");
    const hasAnalysis = searchParams.get("hasAnalysis");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT)), 100);

    const where: Record<string, unknown> = { status };

    if (lesson) where.lesson = lesson;
    if (subject) where.subject = subject;
    if (source) where.source = source;
    if (hasAnalysis === "true") {
        where.analysis = { isNot: null };
    } else if (hasAnalysis === "false") {
        where.analysis = null;
    }
    if (search) {
        where.OR = [
            { lesson: { contains: search } },
            { subject: { contains: search } },
            { source: { contains: search } },
        ];
        delete where.status;
    }

    try {
        const questions = await prisma.question.findMany({
            where,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                fileId: true,
                fileUrl: true,
                lesson: true,
                subject: true,
                source: true,
                status: true,
                pageNumber: true,
                questionNumber: true,
                answer: true,
                createdAt: true,
                analysis: { select: { id: true } },
            },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

        const hasMore = questions.length > limit;
        const result = hasMore ? questions.slice(0, limit) : questions;
        const nextCursor = hasMore ? result[result.length - 1].id : null;

        return NextResponse.json({
            questions: result,
            nextCursor,
            hasMore,
        });
    } catch (error) {
        console.error("Questions GET error:", error);
        const questions = await prisma.question.findMany({
            where: { status: searchParams.get("status") || "ACTIVE" },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                fileId: true,
                fileUrl: true,
                lesson: true,
                subject: true,
                source: true,
                status: true,
                pageNumber: true,
                questionNumber: true,
                answer: true,
                createdAt: true,
            },
            take: limit,
        });
        return NextResponse.json({ questions, nextCursor: null, hasMore: false });
    }
}

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const lesson = formData.get("lesson") as string;
    const subject = (formData.get("subject") as string) || null;
    const source = (formData.get("source") as string) || null;
    const pageNumber = formData.get("pageNumber")
        ? parseInt(formData.get("pageNumber") as string)
        : null;
    const questionNumber = formData.get("questionNumber")
        ? parseInt(formData.get("questionNumber") as string)
        : null;
    const answer = (formData.get("answer") as string) || null;

    if (!files.length || !lesson) {
        return NextResponse.json({ error: "Dosya ve ders gerekli" }, { status: 400 });
    }

    // Validate file types and sizes
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Desteklenmeyen dosya türü: ${file.type}. Sadece resim dosyaları kabul edilir.` },
                { status: 400 }
            );
        }
        if (file.size > maxFileSize) {
            return NextResponse.json(
                { error: `Dosya boyutu çok büyük (max 5MB): ${file.name}` },
                { status: 400 }
            );
        }
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const results = await Promise.all(
        files.map(async (file) => {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileId = crypto.randomUUID();
            const fileName = `${fileId}.webp`;
            const filePath = join(UPLOAD_DIR, fileName);

            // Document-scan pipeline: beyaz arka plan, net siyah metin
            await processAndSave(buffer, filePath);

            const question = await prisma.question.create({
                data: {
                    fileId,
                    fileUrl: `/api/uploads/${fileName}`,
                    lesson,
                    subject,
                    source,
                    pageNumber,
                    questionNumber,
                    answer,
                },
            });

            return question;
        })
    );

    return NextResponse.json(results, { status: 201 });
}
