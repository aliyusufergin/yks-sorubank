import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { apiKey } = await request.json();

    if (!apiKey) {
        return NextResponse.json({ error: "API anahtarı gerekli" }, { status: 400 });
    }

    try {
        // Use REST API directly since SDK doesn't expose listModels
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!res.ok) {
            const err = await res.json();
            return NextResponse.json({ error: err.error?.message || "Model listesi alınamadı" }, { status: res.status });
        }

        const data = await res.json();
        const models: { id: string; name: string; description: string }[] = [];

        for (const model of data.models || []) {
            if (model.supportedGenerationMethods?.includes("generateContent")) {
                models.push({
                    id: model.name?.replace("models/", "") || "",
                    name: model.displayName || model.name || "",
                    description: model.description || "",
                });
            }
        }

        models.sort((a, b) => a.id.localeCompare(b.id));

        return NextResponse.json(models);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Model listesi alınamadı";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
