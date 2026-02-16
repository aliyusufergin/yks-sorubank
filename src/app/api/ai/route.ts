import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    const { apiKey, action, data, model: modelId, customPrompt } = await request.json();

    if (!apiKey) {
        return NextResponse.json({ error: "API anahtarı gerekli" }, { status: 400 });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId || "gemini-2.0-flash" });

    try {
        let prompt = "";

        switch (action) {
            case "study-recommendations": {
                const { questionIds } = data;

                if (!questionIds?.length) {
                    return NextResponse.json({ error: "En az bir soru seçin" }, { status: 400 });
                }

                // Get analyses for selected questions
                const analyses = await prisma.questionAnalysis.findMany({
                    where: { questionId: { in: questionIds } },
                });

                // Also get questions without analysis for context
                const questions = await prisma.question.findMany({
                    where: { id: { in: questionIds } },
                    select: { id: true, lesson: true, subject: true },
                });

                const analysisInfo = analyses.length > 0
                    ? analyses.map((a) => {
                        const topics = JSON.parse(a.topics);
                        return `- ${a.lesson}${a.subject ? ` > ${a.subject}` : ""}: ${topics.join(", ")} (Zorluk: ${a.difficulty})\n  Özet: ${a.summary}`;
                    }).join("\n")
                    : questions.map((q) => `- ${q.lesson}${q.subject ? ` > ${q.subject}` : ""}`).join("\n");

                prompt = customPrompt
                    ? `${customPrompt}\n\nÖğrenci bilgileri:\n${analysisInfo}\n\nToplam ${questionIds.length} soru seçilmiş. Türkçe yanıtla.`
                    : `Sen bir YKS sınav koçusun. Öğrenci aşağıdaki soruları çalışmak istiyor:

${analysisInfo}

Toplam ${questionIds.length} soru seçilmiş. Bu bilgilere göre:
1. Hangi konulara öncelik vermesi gerektiğini
2. Her konu için somut çalışma tavsiyeleri
3. Zayıf yönlerini nasıl güçlendirebileceğini
4. Motivasyon artırıcı öneriler

Türkçe olarak, madde madde açıkla.`;
                break;
            }

            case "study-plan": {
                const { questionIds, hoursPerDay, days } = data;

                if (!questionIds?.length) {
                    return NextResponse.json({ error: "En az bir soru seçin" }, { status: 400 });
                }

                const analyses = await prisma.questionAnalysis.findMany({
                    where: { questionId: { in: questionIds } },
                });

                const questions = await prisma.question.findMany({
                    where: { id: { in: questionIds } },
                    select: { id: true, lesson: true, subject: true },
                });

                const subjectList = analyses.length > 0
                    ? [...new Set(analyses.map((a) => {
                        const topics = JSON.parse(a.topics);
                        return `${a.lesson}: ${topics.join(", ")} (${a.difficulty})`;
                    }))].join("\n")
                    : [...new Set(questions.map((q) => `${q.lesson}${q.subject ? `: ${q.subject}` : ""}`))].join("\n");

                prompt = customPrompt
                    ? `${customPrompt}\n\nKonular:\n${subjectList}\n\nGünlük çalışma süresi: ${hoursPerDay || 6} saat\nProgram süresi: ${days || 7} gün\n\nTürkçe yanıtla.`
                    : `Sen bir YKS sınav koçusun. Aşağıdaki sorulardan elde edilen konulara göre bir çalışma programı hazırla:

Konular:
${subjectList}

Günlük çalışma süresi: ${hoursPerDay || 6} saat
Program süresi: ${days || 7} gün

Lütfen:
1. Günlük program tablosu oluştur
2. Konuları önem ve zorluk derecesine göre dağıt
3. Tekrar zamanlarını planla
4. Mola zamanlarını ekle

Türkçe olarak, detaylı bir şekilde açıkla.`;
                break;
            }

            default:
                return NextResponse.json({ error: "Geçersiz aksiyon" }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return NextResponse.json({ result: response });
    } catch (error) {
        const message = error instanceof Error ? error.message : "AI hatası";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
