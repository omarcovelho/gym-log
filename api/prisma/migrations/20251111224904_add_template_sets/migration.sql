/*
  Warnings:

  - You are about to drop the column `target` on the `TemplateExercise` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TemplateExercise" DROP CONSTRAINT "TemplateExercise_templateId_fkey";

-- AlterTable
ALTER TABLE "TemplateExercise" DROP COLUMN "target",
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "WorkoutTemplate" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "TemplateSet" (
    "id" TEXT NOT NULL,
    "templateExId" TEXT NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "reps" INTEGER,
    "rir" INTEGER,
    "notes" TEXT,

    CONSTRAINT "TemplateSet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSet" ADD CONSTRAINT "TemplateSet_templateExId_fkey" FOREIGN KEY ("templateExId") REFERENCES "TemplateExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
