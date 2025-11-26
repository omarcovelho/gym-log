-- CreateEnum
CREATE TYPE "SetIntensityType" AS ENUM ('NONE', 'REST_PAUSE', 'DROP_SET', 'CLUSTER_SET');

-- AlterTable
ALTER TABLE "SessionSet" ADD COLUMN     "intensityType" "SetIntensityType" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "SessionSetIntensityBlock" (
    "id" TEXT NOT NULL,
    "sessionSetId" TEXT NOT NULL,
    "blockIndex" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "restSeconds" INTEGER,

    CONSTRAINT "SessionSetIntensityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionSetIntensityBlock_sessionSetId_blockIndex_idx" ON "SessionSetIntensityBlock"("sessionSetId", "blockIndex");

-- AddForeignKey
ALTER TABLE "SessionSetIntensityBlock" ADD CONSTRAINT "SessionSetIntensityBlock_sessionSetId_fkey" FOREIGN KEY ("sessionSetId") REFERENCES "SessionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
