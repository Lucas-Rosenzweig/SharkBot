import {ReactionMapRecord, ReactionMapState} from "../state/reactionMapState";

export function setupReactionMapListeners() {
    // Placeholder for reaction map listeners setup
    const reactionMapState = ReactionMapState.getInstance();

    reactionMapState.on('loaded-reaction-maps', () => {
        //On parcoure tous les messages auxquels le bot a réagi et si il ne sont plus dans la base de donnée on retire les réactions
        console.log(`ReactionMap loaded: ${JSON.stringify(reactionMapState.getStore())}`);
    });
}