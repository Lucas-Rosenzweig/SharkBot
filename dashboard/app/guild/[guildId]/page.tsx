import { apiFetch } from '@/lib/api';
import type { Config, UsersResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Settings, Award, Activity, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default async function GuildPage({
    params,
}: {
    params: Promise<{ guildId: string }>;
}) {
    const { guildId } = await params;

    // Fetch some basic stats
    const [config, usersData] = await Promise.all([
        apiFetch<Config>(`/guilds/${guildId}/config`).catch(() => null),
        apiFetch<UsersResponse>(`/guilds/${guildId}/users?limit=1`).catch(() => null),
    ]);

    const totalUsers = usersData?.pagination?.total || 0;
    const isConfigured = !!config;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                    Vue d'ensemble
                </h1>
                <p className="text-muted-foreground text-lg">
                    Bienvenue sur le tableau de bord de votre serveur.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Card: Users */}
                <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:bg-card/60 transition-all duration-300 group shadow-lg hover:shadow-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Utisateurs Actifs</CardTitle>
                        <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Membres ayant de l'XP
                        </p>
                    </CardContent>
                </Card>

                {/* Stats Card: XP Rate */}
                <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:bg-card/60 transition-all duration-300 group shadow-lg hover:shadow-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Taux d'XP</CardTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Highlight Feature: Config */}
                <Card className="relative overflow-hidden bg-secondary/10 border-border/50 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Configuration du Serveur
                        </CardTitle>
                        <CardDescription>
                            Gérez les paramètres d'expérience, les multiplicateurs et les canaux de notification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <Button asChild className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all duration-300 group/btn h-12 text-base font-semibold shadow-[0_0_15px_-3px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_-2px_rgba(34,197,94,0.25)]" variant="secondary">
                            <Link href={`/guild/${guildId}/config`} className="flex items-center justify-center gap-2">
                                Modifier la configuration
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Highlight Feature: Roles */}
                <Card className="relative overflow-hidden bg-secondary/10 border-border/50 group">
                    <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-500" />
                            Rôles de Niveau
                        </CardTitle>
                        <CardDescription>
                            Configurez les rôles accordés automatiquement en fonction de l'expérience gagnée.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <Button asChild className="w-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group/btn h-12 text-base font-semibold shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_-2px_rgba(16,185,129,0.25)]" variant="secondary">
                            <Link href={`/guild/${guildId}/level-roles`} className="flex items-center justify-center gap-2">
                                Gérer les rôles
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
