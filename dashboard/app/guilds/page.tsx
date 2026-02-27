import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import LogoutButton from '@/app/_components/LogoutButton';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Server } from 'lucide-react';

interface Guild {
    id: string;
    name: string;
    icon: string | null;
}

interface AuthResponse {
    authenticated: boolean;
    user?: {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
    };
}

export default async function GuildsPage() {
    let auth: AuthResponse;
    try {
        auth = await apiFetch<AuthResponse>('/auth/me');
    } catch {
        redirect('/login');
    }

    if (!auth.authenticated || !auth.user) {
        redirect('/login');
    }

    const { user } = auth;
    let avatarUrl: string;

    if (user.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
    } else {
        const isPomelo = user.discriminator === '0' || user.discriminator === '0000';
        if (isPomelo) {
            const defaultAvatarIndex = Number((BigInt(user.id) >> 22n) % 6n);
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        } else {
            const defaultAvatarIndex = Number(user.discriminator) % 5;
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }
    }

    let guilds: Guild[] = [];
    try {
        guilds = await apiFetch<Guild[]>('/guilds');
    } catch {
        guilds = [];
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none -z-10 blur-3xl" />

            {/* Header */}
            <header className="fixed top-0 inset-x-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-50 flex items-center">
                <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                            <Server className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Shark Bot
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 pr-3 pl-1 pr-4 py-1 rounded-full bg-secondary/30 border border-border/50">
                            <div className="relative w-8 h-8 shrink-0">
                                <Image
                                    src={avatarUrl}
                                    alt={user.username}
                                    fill
                                    className="rounded-full border border-primary/30 shadow-sm object-cover"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-background flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                            <span className="text-sm font-medium text-foreground ml-1">
                                {user.username}
                            </span>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-7xl mx-auto px-6 pt-32 pb-16 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mb-12">
                    <h2 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
                        Sélectionner un serveur
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Choisissez le serveur que vous souhaitez configurer. Seuls les serveurs où vous possédez des permissions d'administrateur sont affichés.
                    </p>
                </div>

                {guilds.length === 0 ? (
                    <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-xl overflow-hidden p-12 text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 rounded-full bg-secondary/30 border border-border/50 flex items-center justify-center mx-auto mb-6">
                            <Server className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-4">Aucun serveur trouvé</h3>
                        <p className="text-muted-foreground text-lg">
                            Vérifiez que le bot est dans vos serveurs et que vous êtes bien administrateur de ces derniers.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {guilds.map((guild) => {
                            const iconUrl = guild.icon
                                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
                                : null;

                            return (
                                <Link
                                    key={guild.id}
                                    href={`/guild/${guild.id}/config`}
                                    className="group block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                                >
                                    <Card className="h-full bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:bg-card/60 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.15)] hover:-translate-y-1 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        <CardContent className="p-6 flex flex-col h-full relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="relative">
                                                    {iconUrl ? (
                                                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-border/50 group-hover:scale-105 transition-transform duration-300">
                                                            <Image
                                                                src={iconUrl}
                                                                alt={guild.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="64px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/50 flex items-center justify-center text-2xl font-bold text-foreground shadow-lg group-hover:scale-105 transition-transform duration-300 text-shadow">
                                                            {guild.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-sm">
                                                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    </div>
                                                </div>

                                                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors duration-300">
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <h3 className="text-xl font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                    {guild.name}
                                                </h3>
                                                <p className="text-sm font-mono text-muted-foreground mt-1 opacity-70">
                                                    ID: {guild.id}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
