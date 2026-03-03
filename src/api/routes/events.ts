import { Router, Request, Response } from 'express';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { eventBus, GuildEvent } from '../../services/EventBus';
import { createLogger } from '../../utils/logger';

const logger = createLogger('API:Events');

const router = Router({ mergeParams: true });

// GET /api/guilds/:guildId/events — SSE stream
router.get('/', requireAuth, requireGuildAdmin, (req: Request, res: Response) => {
    const guildId = req.params.guildId as string;

    // ── SSE headers ──────────────────────────────────────────
    res.status(200);
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx/proxy buffering
        'Content-Encoding': 'none', // Disable compression for SSE
    });
    res.flushHeaders();

    // Send initial connection event
    const writeSSE = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    writeSSE('connected', { guildId, timestamp: Date.now() });

    logger.info({ guildId }, 'SSE client connected');

    // ── Guild event listener ─────────────────────────────────
    const onGuildEvent = (event: GuildEvent) => {
        try {
            writeSSE(event.type, event);
        } catch {
            // Client probably disconnected
            cleanup();
        }
    };

    eventBus.onGuildEvent(guildId, onGuildEvent);

    // ── Heartbeat every 15 seconds ──────────────────────────
    const heartbeat = setInterval(() => {
        try {
            res.write(`:heartbeat ${Date.now()}\n\n`);
        } catch {
            cleanup();
        }
    }, 15_000);

    // ── Cleanup on disconnect ────────────────────────────────
    let cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        clearInterval(heartbeat);
        eventBus.offGuildEvent(guildId, onGuildEvent);
        logger.info({ guildId }, 'SSE client disconnected');
    };

    req.on('close', cleanup);
    req.on('error', cleanup);
});

export default router;


