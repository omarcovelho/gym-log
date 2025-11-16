-- CreateTable
CREATE TABLE "RestTimer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestTimer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestTimer_userId_idx" ON "RestTimer"("userId");

-- AddForeignKey
ALTER TABLE "RestTimer" ADD CONSTRAINT "RestTimer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
