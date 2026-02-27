/*
  Warnings:

  - You are about to drop the column `xp` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "xp",
ADD COLUMN     "xpCurrent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xpNext" INTEGER NOT NULL DEFAULT 155,
ADD COLUMN     "xpTotal" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "level" SET DEFAULT 1;
