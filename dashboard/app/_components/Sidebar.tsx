'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Settings, Award, Smile, BarChart3, ChevronLeft, LogOut, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SharkIcon } from '@/app/_components/SharkIcon';

const navItems = [
    { to: '', label: 'Vue d\'ensemble', icon: Home },
    { to: 'config', label: 'Configuration', icon: Settings },
    { to: 'level-roles', label: 'Rôles de niveau', icon: Award },
    { to: 'reaction-roles', label: 'Rôles de réaction', icon: Smile },
    { to: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
];

export default function Sidebar({
    guildId,
    username,
    avatarUrl
}: {
    guildId: string;
    username: string;
    avatarUrl: string;
}) {
    const pathname = usePathname();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/login';
    };

    return (
        <aside className="w-72 bg-card/60 backdrop-blur-xl border-r border-border/50 flex flex-col shadow-2xl shrink-0 z-10 relative">
            <div className="p-6 border-b border-border/50">
                <Link
                    href="/guilds"
                    className="text-muted-foreground hover:text-foreground text-sm mb-4 inline-flex items-center gap-1.5 transition-colors font-medium hover:bg-secondary/50 px-3 py-1.5 -ml-3 rounded-md"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Retour aux serveurs
                </Link>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
                    <SharkIcon className="w-7 h-7 text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" /> Shark Bot
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const href = `/guild/${guildId}/${item.to}`;
                    const isActive = pathname === href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.to}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 group cursor-pointer",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-[inset_4px_0_0_0_rgba(34,197,94,1)] bg-gradient-to-r from-primary/10 to-transparent"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "text-muted-foreground group-hover:text-foreground")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50 bg-secondary/10">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative w-9 h-9 shrink-0">
                            <Image
                                src={avatarUrl}
                                alt={`${username}'s avatar`}
                                fill
                                className="rounded-full border border-primary/30 shadow-[0_0_10px_rgba(34,197,94,0.2)] object-cover"
                            />
                        </div>
                        <span className="text-foreground text-sm font-medium truncate">{username}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0" title="Déconnexion">
                        <LogOut className="w-4 h-4" />
                        <span className="sr-only">Déconnexion</span>
                    </Button>
                </div>
            </div>
        </aside>
    );
}
