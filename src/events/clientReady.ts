import { Client } from 'discord.js';
import { VoiceXpService } from '../services/VoiceXpService';
import { createLogger } from '../utils/logger';

const logger = createLogger('ClientReady');

export const name = 'clientReady';
export const once = true;

export async function execute(client: Client) {
    logger.info({ tag: client.user?.tag }, 'Bot connected');

    const voiceXpService = VoiceXpService.getInstance();
    await voiceXpService.initializeFromGuilds(client);
}
