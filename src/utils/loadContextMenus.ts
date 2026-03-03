import {Client, Collection} from 'discord.js';
import {readdirSync} from 'fs';
import {join} from 'path';
import type {BotContextMenu} from '../type/discord';

export function loadContextMenus(client: Client) {
    client.contextMenus = new Collection<string, BotContextMenu>();
    const contextMenusPath = join(__dirname, '../contextMenus');
    const contextMenuFiles = readdirSync(contextMenusPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of contextMenuFiles) {
        const contextMenu = require(join(contextMenusPath, file));
        if ('data' in contextMenu && 'execute' in contextMenu) {
            client.contextMenus.set(contextMenu.data.name, contextMenu);
        }
    }
}
