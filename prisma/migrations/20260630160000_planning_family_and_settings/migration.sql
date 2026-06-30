-- DropIndex
DROP INDEX "Week_weekOf_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "familyId" TEXT;

-- AlterTable
ALTER TABLE "Week" ADD COLUMN     "familyId" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'familia';

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Mi familia',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Week_weekOf_idx" ON "Week"("weekOf");

-- CreateIndex
CREATE INDEX "Week_ownerId_scope_idx" ON "Week"("ownerId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "Week_familyId_ownerId_scope_weekOf_key" ON "Week"("familyId", "ownerId", "scope", "weekOf");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

