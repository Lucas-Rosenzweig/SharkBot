import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import http from 'node:http';
import https from 'node:https';

const API_BASE = process.env.API_URL || 'http://bot:3001';

// Ensure this route is never statically analysed / cached
export const dynamic = 'force-dynamic';

/**
 * SSE proxy: forwards the backend SSE stream to the browser.
 *
 * We use Node.js `http.get` instead of `fetch()` because the patched
 * Next.js fetch may buffer the response and prevent real-time streaming.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ guildId: string }> },
) {
    const { guildId } = await params;
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const backendUrl = `${API_BASE}/api/guilds/${guildId}/events`;
    const isHttps = backendUrl.startsWith('https');
    const transport = isHttps ? https : http;

    // Create a ReadableStream that pipes from the backend SSE
    const stream = new ReadableStream({
        start(controller) {
            const req = transport.get(backendUrl, {
                headers: {
                    Cookie: cookieHeader,
                    Accept: 'text/event-stream',
                },
            }, (res) => {
                if (res.statusCode !== 200) {
                    controller.close();
                    return;
                }

                res.on('data', (chunk: Buffer) => {
                    try {
                        controller.enqueue(chunk);
                    } catch {
                        // Stream closed by client
                        res.destroy();
                    }
                });

                res.on('end', () => {
                    try {
                        controller.close();
                    } catch {
                        // Already closed
                    }
                });

                res.on('error', () => {
                    try {
                        controller.close();
                    } catch {
                        // Already closed
                    }
                });
            });

            req.on('error', () => {
                try {
                    controller.close();
                } catch {
                    // Already closed
                }
            });

            // When the client disconnects, abort the backend request
            request.signal.addEventListener('abort', () => {
                req.destroy();
            });
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}


