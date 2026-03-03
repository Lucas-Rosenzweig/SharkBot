import { readdirSync } from 'fs';
import { join } from 'path';

/**
 * Collects all command and context menu data for deployment.
 * Shared by deploy-commands, deploy-global, and deploy-guild scripts.
 */
export function collectCommandData(): object[] {
    const commands: object[] = [];

    const commandsPath = join(__dirname, '../commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(join(commandsPath, file));
        if (command.data) {
            commands.push(command.data.toJSON());
        }
    }

    const contextMenusPath = join(__dirname, '../contextMenus');
    const contextMenuFiles = readdirSync(contextMenusPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of contextMenuFiles) {
        const menu = require(join(contextMenusPath, file));
        if (menu.data) {
            commands.push(menu.data.toJSON());
        }
    }

    return commands;
}

