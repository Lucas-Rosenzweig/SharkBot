'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/app/_components/RoleBadge';
import { ConfirmDeleteModal } from '@/app/_components/ConfirmDeleteModal';
import { Plus, Trash2, Loader2, AlertCircle, ShieldAlert, Sparkles, Check, X, Search } from 'lucide-react';
import { toast } from 'sonner';

const STANDARD_EMOJIS = [
    // Smileys & Émotions
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🫡", "🤫", "🫠", "🤥", "😶", "🫥", "😐", "🫤", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😮‍💨", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖",
    // Gestes & Corps
    "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🫀", "🫁", "🧠", "🦷", "🦴", "👀", "👁", "👅", "👄", "🫦",
    // Animaux
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷", "🕸", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🪶", "🐓", "🦃", "🦤", "🦚", "🦜", "🦢", "🦩", "🕊", "🐇", "🦝", "🦨", "🦡", "🦫", "🦦", "🦥", "🐁", "🐀", "🐿", "🦔",
    // Objets & Symboles
    "⭐", "🌟", "✨", "🔥", "💧", "🌊", "🎈", "🎉", "🎊", "🎁", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫", "⬛", "⬜", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "✅", "❌", "⛔", "🚫", "💯", "💢", "💥", "💫", "💦", "💨", "🕳", "💣", "💬", "👁️‍🗨️", "🗨", "🗯", "💭", "💤"
];

interface ReactionRole {
    id: string;
    guildId: string;
    messageId: string;
    emoji: string;
    roleId: string;
    removeOnUnreact: boolean;
}

interface Role {
    id: string;
    name: string;
    color: string;
}

interface Channel {
    id: string;
    name: string;
}

interface CustomEmoji {
    id: string;
    name: string;
    url: string;
    animated: boolean;
    formatted: string;
}

interface Message {
    id: string;
    content: string;
    author: {
        username: string;
        avatar: string | null;
    };
    timestamp: number;
}

export default function ReactionRolesManager({
    guildId,
    initialReactionRoles,
    roles,
}: {
    guildId: string;
    initialReactionRoles: ReactionRole[];
    roles: Role[];
}) {
    const [reactionRoles, setReactionRoles] = useState<ReactionRole[]>(initialReactionRoles);
    const [messageId, setMessageId] = useState('');
    const [emoji, setEmoji] = useState('');
    const [roleId, setRoleId] = useState('');
    const [removeOnUnreact, setRemoveOnUnreact] = useState(true);
    const [adding, setAdding] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [serverEmojis, setServerEmojis] = useState<CustomEmoji[]>([]);
    const [loadingEmojis, setLoadingEmojis] = useState(false);
    const [emojiType, setEmojiType] = useState<'serveur' | 'standard'>('serveur');
    const [searchEmoji, setSearchEmoji] = useState('');

    const filteredStandardEmojis = STANDARD_EMOJIS.filter(e =>
        e.toLowerCase().includes(searchEmoji.toLowerCase()) ||
        searchEmoji === '' // Basic filter, usually standard emojis don't have text names in this simple array but user might type
    );

    useEffect(() => {
        const fetchChannels = async () => {
            setLoadingChannels(true);
            try {
                const res = await fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' });
                if (res.ok) {
                    setChannels(await res.json());
                }
            } catch (err) {
                console.error('Failed to fetch channels', err);
            } finally {
                setLoadingChannels(false);
            }
        };
        fetchChannels();
    }, [guildId]);

    useEffect(() => {
        if (!selectedChannelId || selectedChannelId === 'none') {
            setMessages([]);
            setMessageId('');
            return;
        }

        const fetchMessages = async () => {
            setLoadingMessages(true);
            setMessageId(''); // Reset selection
            try {
                const res = await fetch(`/api/guilds/${guildId}/channels/${selectedChannelId}/messages`, { credentials: 'include' });
                if (res.ok) {
                    setMessages(await res.json());
                }
            } catch (err) {
                console.error('Failed to fetch messages', err);
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [guildId, selectedChannelId]);

    useEffect(() => {
        const fetchEmojis = async () => {
            setLoadingEmojis(true);
            try {
                const res = await fetch(`/api/guilds/${guildId}/emojis`, { credentials: 'include' });
                if (res.ok) {
                    setServerEmojis(await res.json());
                }
            } catch (err) {
                console.error('Failed to fetch emojis', err);
            } finally {
                setLoadingEmojis(false);
            }
        };
        fetchEmojis();
    }, [guildId]);



    const handleAdd = async () => {
        if (!messageId || !emoji || !roleId) {
            toast.error('Tous les champs sont requis');
            return;
        }
        setAdding(true);
        try {

            const res = await fetch(`/api/guilds/${guildId}/reaction-roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ messageId, emoji, roleId, removeOnUnreact }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Erreur lors de l'ajout");
                return;
            }
            // Reload list
            const listRes = await fetch(`/api/guilds/${guildId}/reaction-roles`, { credentials: 'include' });
            if (listRes.ok) {
                setReactionRoles(await listRes.json());
            }
            setMessageId('');
            setEmoji('');
            setRoleId('');
            toast.success('Rôle de réaction ajouté ! Le bot a réagi au message.');
        } catch {
            toast.error("Erreur inattendue lors de l'ajout");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/guilds/${guildId}/reaction-roles/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            setReactionRoles(reactionRoles.filter((rr) => rr.id !== id));
            toast.success('Rôle de réaction supprimé et réaction retirée.');
        } catch (err) {
            console.error('Error deleting reaction role:', err);
            toast.error('Erreur lors de la suppression');
        }
    };

    const getRoleName = (rId: string) => roles.find((r) => r.id === rId)?.name || rId;
    const getRoleColor = (rId: string) => roles.find((r) => r.id === rId)?.color || '#99AAB5';

    return (
        <div className="space-y-8">
            {/* Add form */}
            <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-emerald-400"></div>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Nouveau rôle de réaction
                    </CardTitle>
                    <CardDescription>
                        Liez un rôle à une réaction sur un message spécifique.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="channelId" className="text-foreground">Salon du message</Label>
                                <Select
                                    value={selectedChannelId || "none"}
                                    onValueChange={(val) => setSelectedChannelId(val === "none" ? "" : val)}
                                    disabled={loadingChannels}
                                >
                                    <SelectTrigger id="channelId" className="bg-background/50 border-border/50 focus:ring-primary shadow-inner">
                                        <SelectValue placeholder={loadingChannels ? "Chargement..." : "Sélectionner un salon"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] bg-card border-border shadow-2xl">
                                        <SelectItem value="none">Sélectionner un salon</SelectItem>
                                        {channels.map((channel) => (
                                            <SelectItem key={channel.id} value={channel.id}>
                                                # {channel.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="messageId" className="text-foreground">Message</Label>
                                <Select
                                    value={messageId || "none"}
                                    onValueChange={(val) => setMessageId(val === "none" ? "" : val)}
                                    disabled={!selectedChannelId || loadingMessages || messages.length === 0}
                                >
                                    <SelectTrigger id="messageId" className="bg-background/50 border-border/50 focus:ring-primary shadow-inner h-auto min-h-[40px] py-2">
                                        <SelectValue placeholder={
                                            !selectedChannelId ? "Sélectionnez d'abord un salon" :
                                                loadingMessages ? "Chargement..." :
                                                    messages.length === 0 ? "Aucun message récent" : "Sélectionner un message"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] max-w-[calc(100vw-2rem)] sm:max-w-md bg-card border-border shadow-2xl">
                                        <SelectItem value="none">Sélectionner un message</SelectItem>
                                        {messages.map((msg) => (
                                            <SelectItem key={msg.id} value={msg.id} className="cursor-pointer">
                                                <div className="flex gap-3 py-1 items-start max-w-full overflow-hidden">
                                                    {msg.author.avatar ? (
                                                        <img src={msg.author.avatar} alt="avatar" className="w-8 h-8 rounded-full shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-secondary shrink-0" />
                                                    )}
                                                    <div className="flex flex-col text-left overflow-hidden w-full">
                                                        <span className="font-semibold text-xs text-primary truncate max-w-[250px]">{msg.author.username}</span>
                                                        <span className="text-sm text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                                                            {msg.content}
                                                        </span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-foreground">Émoji</Label>
                            <Tabs
                                value={emojiType}
                                onValueChange={(val) => {
                                    setEmojiType(val as 'serveur' | 'standard');
                                    setEmoji(''); // Reset emoji selection when switching type
                                }}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-border/50">
                                    <TabsTrigger value="serveur">Serveur</TabsTrigger>
                                    <TabsTrigger value="standard">Standard</TabsTrigger>
                                </TabsList>
                                <TabsContent value="serveur" className="mt-2 text-sm">
                                    <Select
                                        value={emojiType === 'serveur' ? emoji : "none"}
                                        onValueChange={(val) => setEmoji(val === "none" ? "" : val)}
                                        disabled={loadingEmojis || serverEmojis.length === 0}
                                    >
                                        <SelectTrigger id="custom-emoji" className="bg-background/50 border-border/50 focus:ring-primary shadow-inner">
                                            <SelectValue placeholder={
                                                loadingEmojis ? "Chargement..." :
                                                    serverEmojis.length === 0 ? "Aucun émoji trouvé" : "Sélectionner un émoji du serveur"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px] bg-card border-border shadow-2xl">
                                            <SelectItem value="none">Sélectionner un émoji</SelectItem>
                                            {serverEmojis.map((e) => (
                                                <SelectItem key={e.id} value={e.formatted}>
                                                    <div className="flex items-center gap-2">
                                                        <img src={e.url} alt={e.name} className="w-5 h-5 object-contain" />
                                                        <span>:{e.name}:</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TabsContent>
                                <TabsContent value="standard" className="mt-2 text-sm flex flex-col gap-3">
                                    <Input
                                        id="emoji-standard"
                                        type="text"
                                        value={emojiType === 'standard' ? emoji : ''}
                                        onChange={(e) => setEmoji(e.target.value)}
                                        placeholder="Ex: 👍, 🎉... (ou cliquez ci-dessous)"
                                        className="bg-background/50 border-border/50 focus-visible:ring-primary shadow-inner"
                                    />
                                    <div className="border border-border/50 rounded-md bg-background/30 p-2 h-48 overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-11 gap-2">
                                            {STANDARD_EMOJIS.map((e, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setEmojiType('standard');
                                                        setEmoji(e);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-primary/20 hover:scale-110 rounded-md transition-all duration-200"
                                                    title={e}
                                                >
                                                    {e}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="roleId" className="text-foreground">Rôle</Label>
                            <Select
                                value={roleId || "none"}
                                onValueChange={(val) => setRoleId(val === "none" ? "" : val)}
                            >
                                <SelectTrigger id="roleId" className="bg-background/50 border-border/50 focus:ring-primary shadow-inner">
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] bg-card border-border shadow-2xl">
                                    <SelectItem value="none">Sélectionner un rôle</SelectItem>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: role.color }}
                                                />
                                                {role.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-lg bg-background/30 border border-border/50">
                        <div>
                            <Label htmlFor="removeOnUnreact" className="text-foreground text-sm font-medium">
                                Retrait automatique
                            </Label>
                            <p className="text-muted-foreground text-xs mt-1">
                                Retirer le rôle quand l'utilisateur retire sa réaction
                            </p>
                        </div>
                        <Switch
                            id="removeOnUnreact"
                            checked={removeOnUnreact}
                            onCheckedChange={setRemoveOnUnreact}
                            className="data-[state=checked]:bg-primary shrink-0"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <Button
                            onClick={handleAdd}
                            disabled={adding || !messageId || !emoji || !roleId}
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.23)] transition-all duration-300 gap-2"
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {adding ? 'Enregistrement...' : 'Ajouter et réagir'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            {reactionRoles.length === 0 ? (
                <div className="text-center py-16 bg-card/40 backdrop-blur-md rounded-xl border border-border/50 shadow-lg">
                    <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">Aucun rôle de réaction n'est configuré.</p>
                </div>
            ) : (
                <div className="bg-card/40 backdrop-blur-xl rounded-xl border border-border/50 shadow-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-secondary/20">
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="font-semibold text-muted-foreground">Message ID</TableHead>
                                <TableHead className="font-semibold text-muted-foreground text-center">Émoji</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">Rôle</TableHead>
                                <TableHead className="font-semibold text-muted-foreground text-center">Retrait auto.</TableHead>
                                <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reactionRoles.map((rr) => {
                                const roleColor = getRoleColor(rr.roleId);

                                return (
                                    <TableRow key={rr.id} className="border-border/50 hover:bg-secondary/10 transition-colors group">
                                        <TableCell className="font-mono text-sm text-muted-foreground">
                                            {rr.messageId}
                                        </TableCell>
                                        <TableCell className="text-center text-xl">
                                            {rr.emoji}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <RoleBadge name={getRoleName(rr.roleId)} color={roleColor} />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {rr.removeOnUnreact ? (
                                                <Check className="w-4 h-4 text-emerald-500 mx-auto" strokeWidth={3} />
                                            ) : (
                                                <X className="w-4 h-4 text-muted-foreground mx-auto" strokeWidth={3} />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setItemToDelete(rr.id)}
                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={() => {
                    if (itemToDelete) {
                        handleDelete(itemToDelete);
                        setItemToDelete(null);
                    }
                }}
                description="Êtes-vous sûr de vouloir supprimer ce rôle de réaction ? Cette action retirera la réaction du bot sur le message."
            />
        </div>
    );
}
