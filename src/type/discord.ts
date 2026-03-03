import {
    ChatInputCommandInteraction,
    Collection,
    ContextMenuCommandInteraction,
    SlashCommandBuilder,
    ContextMenuCommandBuilder,
} from 'discord.js';

export interface BotCommand {
    data: SlashCommandBuilder;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface BotContextMenu {
    data: ContextMenuCommandBuilder;
    execute(interaction: ContextMenuCommandInteraction): Promise<void>;
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, BotCommand>;
        contextMenus: Collection<string, BotContextMenu>;
    }
}

