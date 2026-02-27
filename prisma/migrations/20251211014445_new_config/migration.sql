/*
  Warnings:

  - You are about to drop the column `xpChannelId` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `xpCooldown` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `xpPerMessage` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `xpPerMinute` on the `Guild` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Guild" DROP COLUMN "xpChannelId",
DROP COLUMN "xpCooldown",
DROP COLUMN "xpPerMessage",
DROP COLUMN "xpPerMinute";

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "xpCooldown" INTEGER NOT NULL DEFAULT 20,
    "xpPerMessage" INTEGER NOT NULL DEFAULT 15,
    "xpPerMinute" INTEGER NOT NULL DEFAULT 5,
    "xpChannelId" TEXT,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Config_guildId_key" ON "Config"("guildId");

-- CreateIndex
CREATE INDEX "Config_guildId_idx" ON "Config"("guildId");

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
