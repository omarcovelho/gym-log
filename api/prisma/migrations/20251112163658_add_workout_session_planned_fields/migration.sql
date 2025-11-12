/*
  Warnings:

  - You are about to drop the column `load` on the `SessionSet` table. All the data in the column will be lost.
  - You are about to drop the column `reps` on the `SessionSet` table. All the data in the column will be lost.
  - You are about to drop the column `rir` on the `SessionSet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "SessionSet" DROP COLUMN "load",
DROP COLUMN "reps",
DROP COLUMN "rir",
ADD COLUMN     "actualLoad" DOUBLE PRECISION,
ADD COLUMN     "actualReps" INTEGER,
ADD COLUMN     "actualRir" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "plannedLoad" DOUBLE PRECISION,
ADD COLUMN     "plannedReps" INTEGER,
ADD COLUMN     "plannedRir" INTEGER;

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "templateId" TEXT;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
