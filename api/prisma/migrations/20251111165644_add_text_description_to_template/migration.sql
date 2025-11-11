/*
  Warnings:

  - You are about to drop the column `defaultLoad` on the `TemplateExercise` table. All the data in the column will be lost.
  - You are about to drop the column `defaultReps` on the `TemplateExercise` table. All the data in the column will be lost.
  - You are about to drop the column `defaultRir` on the `TemplateExercise` table. All the data in the column will be lost.
  - You are about to drop the column `defaultSets` on the `TemplateExercise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TemplateExercise" DROP COLUMN "defaultLoad",
DROP COLUMN "defaultReps",
DROP COLUMN "defaultRir",
DROP COLUMN "defaultSets",
ADD COLUMN     "target" TEXT;
