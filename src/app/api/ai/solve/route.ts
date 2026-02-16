import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads";

const DEFAULT_PROMPT = `Sen bir YKS soru çözücüsün. Bu soru görselini analiz et ve aşağıdaki formatta yanıt ver. Cevabı markdown formatında ver, matematik ifadelerini LaTeX ($..$ ve $$..$$) ile yaz.

**KONU:** [Sorunun ait olduğu konu]
**ZORLUK:** [Kolay/Orta/Zor]
**ÖZET:** [Sorunun kısa açıklaması, 1-2 cümle]

**ÇÖZÜM:**
[Adım adım detaylı çözüm]

**DOĞRU CEVAP:** [Şık varsa belirt]

Türkçe olarak, öğrencinin anlayacağı şekilde açıkla.`;

export async function POST(request: NextRequest) {
    const { questionId, apiKey, model: modelId } = await request.json();

    if (!apiKey) {
        return NextResponse.json({ error: "API anahtarı gerekli" }, { status: 400 });
    }

    if (!questionId) {
        return NextResponse.json({ error: "Soru ID gerekli" }, { status: 400 });
    }

    // Check cache first
    const cached = await prisma.questionAnalysis.findUnique({
        where: { questionId },
    });

    if (cached) {
        return NextResponse.json({
            cached: true,
            analysis: cached,
        });
    }

    // Get question details
    const question = await prisma.question.findUnique({
        where: { id: questionId },
    });

    if (!question) {
        return NextResponse.json({ error: "Soru bulunamadı" }, { status: 404 });
    }

    // Read image file
    const fileName = question.fileUrl.split("/").pop()!;
    const filePath = join(UPLOAD_DIR, fileName);
    let imageBuffer: Buffer;

    try {
        imageBuffer = await readFile(filePath) as Buffer;
    } catch {
        return NextResponse.json({ error: "Soru görseli okunamadı" }, { status: 500 });
    }

    // Get custom prompt if exists
    let customPrompt = DEFAULT_PROMPT;

    const lessonPrompt = await prisma.aIPrompt.findFirst({
        where: {
            lesson: question.lesson,
            subject: question.subject || "__default__",
        },
    });

    if (!lessonPrompt) {
        // Try default prompt for the lesson
        const defaultLessonPrompt = await prisma.aIPrompt.findFirst({
            where: {
                lesson: question.lesson,
                subject: "__default__",
            },
        });
        if (defaultLessonPrompt) {
            customPrompt = defaultLessonPrompt.prompt;
        }
    } else {
        customPrompt = lessonPrompt.prompt;
    }

    // Append markdown/LaTeX instruction to custom prompts
    if (customPrompt !== DEFAULT_PROMPT) {
        customPrompt += "\n\nCevabı markdown formatında ver. Matematik ifadelerini LaTeX ($..$ ve $$..$$) ile yaz. Türkçe yanıtla.";
    }

    // Call Gemini Vision
    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelId || "gemini-2.0-flash" });

        const ext = fileName.split(".").pop()?.toLowerCase() || "jpeg";
        const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType,
            },
        };

        const result = await model.generateContent([customPrompt, imagePart]);
        const responseText = result.response.text();

        // Parse response for structured data
        const topicsMatch = responseText.match(/\*\*KONU:\*\*\s*(.+)/);
        const difficultyMatch = responseText.match(/\*\*ZORLUK:\*\*\s*(.+)/);
        const summaryMatch = responseText.match(/\*\*ÖZET:\*\*\s*(.+)/);

        const topics = topicsMatch ? [topicsMatch[1].trim()] : [question.lesson];
        const difficulty = difficultyMatch ? difficultyMatch[1].trim() : "Orta";
        const summary = summaryMatch ? summaryMatch[1].trim() : "";

        // Save to cache
        const analysis = await prisma.questionAnalysis.create({
            data: {
                questionId,
                lesson: question.lesson,
                subject: question.subject,
                topics: JSON.stringify(topics),
                difficulty,
                summary,
                solution: responseText,
            },
        });

        return NextResponse.json({
            cached: false,
            analysis,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "AI hatası";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { questionIds } = await request.json();

    if (!questionIds?.length) {
        return NextResponse.json({ error: "questionIds gerekli" }, { status: 400 });
    }

    const result = await prisma.questionAnalysis.deleteMany({
        where: { questionId: { in: questionIds } },
    });

    return NextResponse.json({ deleted: result.count });
}
