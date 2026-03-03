'use client';

import { useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Check, X, Pencil, Loader2, ChevronLeft, ChevronRight, Crown, Trophy } from 'lucide-react';
import { csrfHeaders } from '@/lib/csrf';
import { toast } from 'sonner';
import { useGuildEvents, type GuildEvent } from '@/lib/useGuildEvents';

interface User {
    id: number;
    discordId: string;
    guildId: string;
    username: string | null;
    avatarHash: string | null;
    xpTotal: number;
    xpCurrent: number;
    xpNext: number;
    level: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function LeaderboardTable({
    guildId,
    initialUsers,
    initialPagination,
}: {
    guildId: string;
    initialUsers: User[];
    initialPagination: Pagination;
}) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(initialPagination.page);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLevel, setEditLevel] = useState(0);
    const [editXp, setEditXp] = useState(0);
    const [saving, setSaving] = useState(false);

    // ── Real-time updates via SSE ────────────────────────────
    const handleXpUpdate = useCallback((event: GuildEvent) => {
        const data = event.data as User;
        setUsers((prev) =>
            prev.map((u) => (u.discordId === data.discordId ? { ...u, ...data } : u)),
        );
    }, []);

    const handleUserUpdate = useCallback((event: GuildEvent) => {
        const data = event.data as User;
        setUsers((prev) =>
            prev.map((u) => (u.discordId === data.discordId ? { ...u, ...data } : u)),
        );
    }, []);

    const handleLevelUp = useCallback((event: GuildEvent) => {
        const data = event.data as { discordId: string; newLevel: number; username?: string | null };
        toast.info(`🎉 ${data.username || data.discordId} a atteint le niveau ${data.newLevel} !`);
    }, []);

    useGuildEvents({
        guildId,
        onEvent: {
            'xp:update': handleXpUpdate,
            'user:update': handleUserUpdate,
            'level:up': handleLevelUp,
        },
    });

    const fetchPage = async (newPage: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/users?page=${newPage}&limit=25`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setPagination(data.pagination);
                setPage(newPage);
            }
        } catch {
            toast.error('Erreur lors du chargement du classement.');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (user: User) => {
        setEditingId(user.discordId);
        setEditLevel(user.level);
        setEditXp(user.xpTotal);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async (discordId: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/users/${discordId}`, {
                method: 'PUT',
                headers: csrfHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'include',
                body: JSON.stringify({ level: editLevel, xpTotal: editXp }),
            });
            if (res.ok) {
                const updated = await res.json();
                setUsers(users.map((u) => (u.discordId === discordId ? updated : u)));
                setEditingId(null);
            }
        } catch {
            toast.error('Erreur lors de la sauvegarde de l\'utilisateur.');
        } finally {
            setSaving(false);
        }
    };

    if (users.length === 0) {
        return (
            <div className="text-center py-16 bg-card/40 backdrop-blur-md rounded-xl border border-border/50 shadow-lg">
                <Crown className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Aucun utilisateur pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className={`bg-card/40 backdrop-blur-xl rounded-xl border border-border/50 shadow-2xl overflow-hidden transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-secondary/20">
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="w-20 text-center font-semibold text-muted-foreground">Rang</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">Utilisateur</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">Niveau</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">Total XP</TableHead>
                                <TableHead className="font-semibold text-muted-foreground w-48">Progression</TableHead>
                                <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user, index) => {
                                const rank = (page - 1) * 25 + index + 1;
                                const progress = user.xpNext > 0 ? (user.xpCurrent / user.xpNext) * 100 : 100;
                                const isEditing = editingId === user.discordId;

                                return (
                                    <TableRow key={user.id} className="border-border/50 hover:bg-secondary/10 group transition-colors">
                                        <TableCell className="text-center font-medium">
                                            {rank === 1 ? (
                                                <span title="1er"><Trophy className="w-6 h-6 mx-auto text-yellow-500 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" /></span>
                                            ) : rank === 2 ? (
                                                <span title="2ème"><Trophy className="w-6 h-6 mx-auto text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.6)]" /></span>
                                            ) : rank === 3 ? (
                                                <span title="3ème"><Trophy className="w-6 h-6 mx-auto text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" /></span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm font-bold opacity-70">#{rank}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10 border border-primary/20 shadow-[0_0_10px_rgba(34,197,94,0.1)] group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-shadow">
                                                    {user.avatarHash ? (
                                                        <AvatarImage src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatarHash}.png?size=64`} alt={user.username || 'User'} />
                                                    ) : null}
                                                    <AvatarFallback className="bg-secondary text-primary font-bold">
                                                        {(user.username || '?').charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-foreground font-semibold tracking-tight">
                                                    {user.username || user.discordId}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={editLevel}
                                                    onChange={(e) => setEditLevel(Number(e.target.value))}
                                                    className="w-20 bg-background/50 border-primary/50 focus-visible:ring-primary shadow-[0_0_10px_rgba(34,197,94,0.1)] h-8"
                                                />
                                            ) : (
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 py-1 px-3 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                                    Niv. {user.level}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={editXp}
                                                    onChange={(e) => setEditXp(Number(e.target.value))}
                                                    className="w-28 bg-background/50 border-primary/50 focus-visible:ring-primary shadow-[0_0_10px_rgba(34,197,94,0.1)] h-8"
                                                />
                                            ) : (
                                                <span className="text-foreground font-medium font-mono">
                                                    {user.xpTotal.toLocaleString()}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!isEditing && (
                                                <div className="flex flex-col gap-1.5 w-full">
                                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                        <span>{user.xpCurrent} XP</span>
                                                        <span>{user.xpNext} XP</span>
                                                    </div>
                                                    <Progress value={progress} className="h-2 bg-secondary" indicatorClassName="bg-gradient-to-r from-primary/80 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => saveEdit(user.discordId)}
                                                        disabled={saving}
                                                        className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                        title="Sauver"
                                                    >
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={cancelEdit}
                                                        disabled={saving}
                                                        className="h-8 w-8 text-neutral-400 hover:text-red-400 hover:bg-red-400/10"
                                                        title="Annuler"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => startEdit(user)}
                                                    className="text-primary hover:text-primary hover:bg-primary/20 h-8"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                                    Éditer
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => fetchPage(Math.max(1, page - 1))}
                        disabled={page === 1 || loading}
                        className="bg-card/40 backdrop-blur border-border/50 hover:bg-secondary hover:text-foreground h-9 px-4 gap-2 shadow-sm"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                    </Button>
                    <div className="text-sm font-medium text-muted-foreground bg-card/40 backdrop-blur px-4 py-2 rounded-md border border-border/50 shadow-inner">
                        <span className="text-foreground">{page}</span> / {pagination.totalPages}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => fetchPage(Math.min(pagination.totalPages, page + 1))}
                        disabled={page === pagination.totalPages || loading}
                        className="bg-card/40 backdrop-blur border-border/50 hover:bg-secondary hover:text-foreground h-9 px-4 gap-2 shadow-sm"
                    >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
