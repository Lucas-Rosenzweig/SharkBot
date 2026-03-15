-- DropIndex: remove the old global unique constraint on discordId
DROP INDEX IF EXISTS "User_discordId_key";

-- DropIndex: remove the old composite index (replaced by unique constraint)
DROP INDEX IF EXISTS "User_guildId_discordId_idx";

-- CreateIndex: compound unique constraint so each user is unique per guild
CREATE UNIQUE INDEX "User_guildId_discordId_key" ON "User"("guildId", "discordId");
