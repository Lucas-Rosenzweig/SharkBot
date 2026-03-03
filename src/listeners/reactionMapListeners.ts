import { ReactionMapService } from "../services/ReactionMapService";
import { createLogger } from "../utils/logger";

const logger = createLogger('ReactionMapListeners');

export function setupReactionMapListeners() {
    const reactionMapState = ReactionMapService.getInstance();

    reactionMapState.on('loaded-reaction-maps', () => {
        const store = reactionMapState.getStore();
        logger.info({ guildCount: store.size }, 'Reaction maps loaded into memory');
    });
}