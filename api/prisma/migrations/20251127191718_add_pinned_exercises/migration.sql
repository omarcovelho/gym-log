-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pinnedExerciseIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
