export type ReactionMapRecord = {
    id: string;
    guildId: string;
    messageId: string;
    emoji: string;
    roleId: string;
    removeOnUnreact: boolean;
    oldReactionMapRecord?: ReactionMapRecord;
};