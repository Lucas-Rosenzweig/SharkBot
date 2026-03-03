'use client';

import { useState, useCallback } from 'react';
import type { Config } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, Zap } from 'lucide-react';
import { useGuildEvents, type GuildEvent } from '@/lib/useGuildEvents';
import { toast } from 'sonner';

export default function GuildOverviewStats({
    guildId,
    initialTotalUsers,
    initialConfig,
}: {
    guildId: string;
    initialTotalUsers: number;
    initialConfig: Config | null;
}) {
    const [totalUsers, setTotalUsers] = useState(initialTotalUsers);
    const [config, setConfig] = useState<Config | null>(initialConfig);

    const handleXpUpdate = useCallback(() => {
        // An xp:update might mean a new user was created — refetch count
        const refetch = async () => {
            try {
                const res = await fetch(`/api/guilds/${guildId}/users?limit=1`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setTotalUsers(data.pagination?.total || 0);
                }
            } catch {
                // Ignore
            }
        };
        refetch();
    }, [guildId]);

    const handleConfigUpdate = useCallback((event: GuildEvent) => {
        const data = event.data as Config;
        setConfig(data);
    }, []);

    const handleLevelUp = useCallback((event: GuildEvent) => {
        const data = event.data as { discordId: string; newLevel: number; username?: string | null };
        toast.info(`🎉 ${data.username || data.discordId} a atteint le niveau ${data.newLevel} !`);
    }, []);

    useGuildEvents({
        guildId,
        onEvent: {
            'xp:update': handleXpUpdate,
            'config:update': handleConfigUpdate,
            'level:up': handleLevelUp,
        },
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stats Card: Users */}
            <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:bg-card/60 transition-all duration-300 group shadow-lg hover:shadow-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Utilisateurs Actifs</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-foreground">{totalUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Membres ayant de l&apos;XP
                    </p>
                </CardContent>
            </Card>

            {/* Stats Card: XP Rate */}
            <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:bg-card/60 transition-all duration-300 group shadow-lg hover:shadow-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Taux d&apos;XP</CardTitle>
                    <Zap className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-foreground">{config?.xpPerMessage || 0} <span className="text-lg text-muted-foreground font-normal">/ msg</span></div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Cooldown: {config?.xpCooldown || 0}s
                    </p>
                </CardContent>
            </Card>

            {/* Stats Card: Status */}
            <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:bg-card/60 transition-all duration-300 group shadow-lg hover:shadow-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">État du Bot</CardTitle>
                    <Activity className="w-4 h-4 text-primary animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">En Ligne</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Système opérationnel
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

