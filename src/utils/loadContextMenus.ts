import {Client, Collection} from 'discord.js';
import fs from 'fs';
import {join} from 'path';

export function loadContextMenus(client: Client) {
    const contextMenus = new Collection();
    const contextMenusPath = join(__dirname, '../contextMenus');
    const contextMenuFiles = fs.readdirSync(contextMenusPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of contextMenuFiles) {
        const contextMenu = require(join(contextMenusPath, file));
        contextMenus.set(contextMenu.data.name, contextMenu);
    }
    // @ts-ignore
    client.contextMenus = contextMenus;
}
