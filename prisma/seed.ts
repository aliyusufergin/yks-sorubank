import { PrismaClient } from "@prisma/client";
import { DEFAULT_LESSONS } from "../src/lib/seedData";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding default lessons and subjects...");

    for (const lessonData of DEFAULT_LESSONS) {
        const lesson = await prisma.lesson.upsert({
            where: { name: lessonData.name },
            update: {},
            create: { name: lessonData.name },
        });

        for (const subjectName of lessonData.subjects) {
            await prisma.subject.upsert({
                where: {
                    name_lessonId: {
                        name: subjectName,
                        lessonId: lesson.id,
                    },
                },
                update: {},
                create: {
                    name: subjectName,
                    lessonId: lesson.id,
                },
            });
        }

        console.log(`  ✓ ${lessonData.name} (${lessonData.subjects.length} konu)`);
    }

    console.log(`\n✅ ${DEFAULT_LESSONS.length} ders başarıyla eklendi.`);
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
