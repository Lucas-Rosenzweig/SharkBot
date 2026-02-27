/*
  Warnings:

  - You are about to drop the `VoiceSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."VoiceSession" DROP CONSTRAINT "VoiceSession_guildId_fkey";

-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "xpChannelId" TEXT;

-- DropTable
DROP TABLE "public"."VoiceSession";
