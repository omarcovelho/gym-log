-- CreateTable
CREATE TABLE "Sleep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sleepHours" DOUBLE PRECISION NOT NULL,
    "sleepQuality" INTEGER,
    "sleepBedtime" TIMESTAMP(3),
    "sleepWakeTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sleep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sleep_userId_date_idx" ON "Sleep"("userId", "date");

-- AddForeignKey
ALTER TABLE "Sleep" ADD CONSTRAINT "Sleep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
