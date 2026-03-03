import { apiFetch } from '@/lib/api';
import type { Config, Channel } from '@/lib/types';
import ConfigForm from '@/app/_components/ConfigForm';

export default async function ConfigPage({
    params,
}: {
    params: Promise<{ guildId: string }>;
}) {
    const { guildId } = await params;

    const [config, channels] = await Promise.all([
        apiFetch<Config>(`/guilds/${guildId}/config`),
        apiFetch<Channel[]>(`/guilds/${guildId}/channels`),
    ]);

    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                    Configuration
                </h1>
                <p className="text-muted-foreground text-lg">
                    Paramètres d'expérience et notifications du serveur.
                </p>
            </div>
            <ConfigForm guildId={guildId} initialConfig={config} channels={channels} />
        </div>
    );
}
