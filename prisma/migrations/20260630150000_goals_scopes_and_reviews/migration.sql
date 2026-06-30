-- CreateEnum
CREATE TYPE "GoalVisibility" AS ENUM ('private', 'family');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "visibility" "GoalVisibility" NOT NULL DEFAULT 'family',
ALTER COLUMN "quarter" DROP NOT NULL;

-- CreateTable
CREATE TABLE "QuarterReview" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "visibility" "GoalVisibility" NOT NULL DEFAULT 'family',
    "ownerId" TEXT,
    "wins" TEXT,
    "challenges" TEXT,
    "learnings" TEXT,
    "nextFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarterReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuarterReview_visibility_ownerId_year_quarter_idx" ON "QuarterReview"("visibility", "ownerId", "year", "quarter");

-- CreateIndex
CREATE INDEX "Goal_visibility_ownerId_year_idx" ON "Goal"("visibility", "ownerId", "year");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarterReview" ADD CONSTRAINT "QuarterReview_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

