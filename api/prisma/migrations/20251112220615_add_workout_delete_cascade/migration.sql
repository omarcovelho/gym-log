-- DropForeignKey
ALTER TABLE "SessionExercise" DROP CONSTRAINT "SessionExercise_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "SessionSet" DROP CONSTRAINT "SessionSet_sessionExId_fkey";

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSet" ADD CONSTRAINT "SessionSet_sessionExId_fkey" FOREIGN KEY ("sessionExId") REFERENCES "SessionExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
