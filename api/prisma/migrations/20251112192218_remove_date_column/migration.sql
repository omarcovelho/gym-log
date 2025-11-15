/*
  Warnings:

  - You are about to drop the column `date` on the `WorkoutSession` table. All the data in the column will be lost.
  - Made the column `startAt` on table `WorkoutSession` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "WorkoutSession_userId_date_idx";

-- AlterTable
ALTER TABLE "WorkoutSession" DROP COLUMN "date",
ALTER COLUMN "startAt" SET NOT NULL,
ALTER COLUMN "startAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_startAt_idx" ON "WorkoutSession"("userId", "startAt");
