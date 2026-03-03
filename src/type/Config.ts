export type Config = {
    xpCooldown: number;
    xpPerMessage: number;
    xpPerMinute: number;
    xpChannelId?: string;
    voiceXpRequireUnmuted: boolean;
    /** `null` = default message, `""` = disabled, string = custom template */
    levelUpMessage?: string | null;
};
