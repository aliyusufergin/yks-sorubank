import { PrismaClient } from "@prisma/client";
import { DEFAULT_LESSONS } from "./seedData";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; __seeded?: boolean };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Auto-seed: İlk kurulumda Lesson tablosu boşsa varsayılan dersleri ekler.
 * Uygulama başlangıcında bir kez çalışır.
 */
async function autoSeed() {
    if (globalForPrisma.__seeded) return;
    globalForPrisma.__seeded = true;

    try {
        const count = await prisma.lesson.count();
        if (count > 0) return; // Zaten ders var, seed atla

        console.log("🌱 İlk kurulum: Varsayılan dersler yükleniyor...");

        for (const lessonData of DEFAULT_LESSONS) {
            const lesson = await prisma.lesson.create({
                data: { name: lessonData.name },
            });

            await prisma.subject.createMany({
                data: lessonData.subjects.map((name) => ({
                    name,
                    lessonId: lesson.id,
                })),
            });
        }

        console.log(`✅ ${DEFAULT_LESSONS.length} ders başarıyla yüklendi.`);
    } catch (error) {
        console.error("Auto-seed hatası:", error);
    }
}

// Trigger auto-seed on module load — only at runtime, not during build
if (process.env.DATABASE_URL) {
    autoSeed();
}
