-- CreateIndex
CREATE INDEX "LevelRole_guildId_idx" ON "LevelRole"("guildId");

-- CreateIndex
CREATE INDEX "ReactionMap_guildId_idx" ON "ReactionMap"("guildId");

-- CreateIndex
CREATE INDEX "User_guildId_xpTotal_idx" ON "User"("guildId", "xpTotal" DESC);
