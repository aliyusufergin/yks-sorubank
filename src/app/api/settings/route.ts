import { prisma } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

const ALLOWED_KEYS = ["theme", "ai-model", "worksheet-spacing", "prompt-recommendations", "prompt-plan", "encrypted-api-key", "api-key-salt", "api-key-iv"];

export async function GET() {
    const rows = await prisma.appSetting.findMany({
        where: { key: { in: ALLOWED_KEYS } },
    });

    const settings: Record<string, string> = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
    const body = await request.json();
    const updates: { key: string; value: string }[] = [];

    for (const [key, value] of Object.entries(body)) {
        if (!ALLOWED_KEYS.includes(key)) continue;

        if (value === null || value === undefined || value === "") {
            await prisma.appSetting.deleteMany({ where: { key } });
        } else {
            updates.push({ key, value: String(value) });
        }
    }

    for (const { key, value } of updates) {
        await prisma.appSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    return NextResponse.json({ ok: true });
}
