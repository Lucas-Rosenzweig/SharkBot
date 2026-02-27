-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "lastMessage" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReactionMap" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "removeOnUnreact" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReactionMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelRole" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "levelReq" INTEGER NOT NULL,

    CONSTRAINT "LevelRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceSession" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTick" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "open" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_guildId_discordId_idx" ON "User"("guildId", "discordId");

-- CreateIndex
CREATE UNIQUE INDEX "ReactionMap_messageId_emoji_key" ON "ReactionMap"("messageId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "LevelRole_guildId_levelReq_key" ON "LevelRole"("guildId", "levelReq");

-- CreateIndex
CREATE INDEX "VoiceSession_guildId_userId_open_idx" ON "VoiceSession"("guildId", "userId", "open");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionMap" ADD CONSTRAINT "ReactionMap_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelRole" ADD CONSTRAINT "LevelRole_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
