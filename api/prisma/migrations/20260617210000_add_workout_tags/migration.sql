-- CreateTable
CREATE TABLE "WorkoutTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNorm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSessionTag" (
    "sessionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "WorkoutSessionTag_pkey" PRIMARY KEY ("sessionId","tagId")
);

-- CreateIndex
CREATE INDEX "WorkoutTag_userId_idx" ON "WorkoutTag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutTag_userId_nameNorm_key" ON "WorkoutTag"("userId", "nameNorm");

-- CreateIndex
CREATE INDEX "WorkoutSessionTag_tagId_idx" ON "WorkoutSessionTag"("tagId");

-- AddForeignKey
ALTER TABLE "WorkoutTag" ADD CONSTRAINT "WorkoutTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSessionTag" ADD CONSTRAINT "WorkoutSessionTag_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSessionTag" ADD CONSTRAINT "WorkoutSessionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "WorkoutTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
