'use client';

import { useState, useMemo } from 'react';
import type { Config, Channel } from '@/lib/types';
import { DEFAULT_LEVEL_UP_MESSAGE } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, Timer, MessageSquare, Mic, Bell, MicOff, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { csrfHeaders } from '@/lib/csrf';


export default function ConfigForm({
    guildId,
    initialConfig,
    channels,
}: {
    guildId: string;
    initialConfig: Config;
    channels: Channel[];
}) {
    const [config, setConfig] = useState<Config>(initialConfig);
    const [saving, setSaving] = useState(false);


    const previewLevelUpMessage = useMemo(() => {
        return (template: string | null | undefined): string => {
            const raw = template === null || template === undefined
                ? DEFAULT_LEVEL_UP_MESSAGE
                : template === ''
                    ? ''
                    : template;

            if (!raw) return '(Message désactivé)';

            const replacements: Record<string, string> = {
                user: 'Utilisateur',
                level: '5',
                lvl: '5',
                mention: '@Utilisateur',
                server: 'Mon Serveur',
            };

            return raw.replace(/\{(\w+)\}/g, (match, key: string) => {
                const lower = key.toLowerCase();
                return replacements[lower] !== undefined ? replacements[lower] : match;
            });
        };
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/config`, {
                method: 'PUT',
                headers: csrfHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'include',
                body: JSON.stringify(config),
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                toast.success('Configuration sauvegardée avec succès !');
            } else {
                toast.error('Erreur lors de la sauvegarde de la configuration.');
            }
        } catch {
            toast.error('Une erreur inattendue est survenue.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* XP Cooldown */}
                <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-lg hover:shadow-primary/5 transition-all">
                    <CardContent className="pt-6">
                        <Label htmlFor="xpCooldown" className="text-base flex items-center gap-2 mb-1 text-foreground">
                            <Timer className="text-primary w-5 h-5" /> Cooldown XP (secondes)
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                            Temps minimum entre deux gains d'XP par message.
                        </p>
                        <Input
                            id="xpCooldown"
                            type="number"
                            min={1}
                            value={config.xpCooldown}
                            onChange={(e) => setConfig({ ...config, xpCooldown: Number(e.target.value) })}
                            className="bg-background/50 border-border/50 focus-visible:ring-primary shadow-inner"
                        />
                    </CardContent>
                </Card>

                {/* XP per message */}
                <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-lg hover:shadow-primary/5 transition-all">
                    <CardContent className="pt-6">
                        <Label htmlFor="xpPerMessage" className="text-base flex items-center gap-2 mb-1 text-foreground">
                            <MessageSquare className="text-primary w-5 h-5" /> XP par message
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                            Nombre d'XP gagnés par message envoyé.
                        </p>
                        <Input
                            id="xpPerMessage"
                            type="number"
                            min={1}
                            value={config.xpPerMessage}
                            onChange={(e) => setConfig({ ...config, xpPerMessage: Number(e.target.value) })}
                            className="bg-background/50 border-border/50 focus-visible:ring-primary shadow-inner"
                        />
                    </CardContent>
                </Card>

                {/* XP per minute vocal */}
                <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-lg hover:shadow-primary/5 transition-all">
                    <CardContent className="pt-6">
                        <Label htmlFor="xpPerMinute" className="text-base flex items-center gap-2 mb-1 text-foreground">
                            <Mic className="text-primary w-5 h-5" /> XP par minute (vocal)
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                            Nombre d'XP gagnés par minute en salon vocal.
                        </p>
                        <Input
                            id="xpPerMinute"
                            type="number"
                            min={1}
                            value={config.xpPerMinute}
                            onChange={(e) => setConfig({ ...config, xpPerMinute: Number(e.target.value) })}
                            className="bg-background/50 border-border/50 focus-visible:ring-primary shadow-inner"
                        />
                    </CardContent>
                </Card>

                {/* XP Channel */}
                <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-lg hover:shadow-primary/5 transition-all">
                    <CardContent className="pt-6">
                        <Label htmlFor="xpChannel" className="text-base flex items-center gap-2 mb-1 text-foreground">
                            <Bell className="text-primary w-5 h-5" /> Salon de notifications
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                            Salon pour les messages de level up.
                        </p>
                        <Select
                            value={config.xpChannelId || "none"}
                            onValueChange={(val) => setConfig({ ...config, xpChannelId: val === "none" ? undefined : val })}
                        >
                            <SelectTrigger id="xpChannel" className="bg-background/50 border-border/50 focus:ring-primary shadow-inner text-foreground">
                                <SelectValue placeholder="Sélectionnez un salon..." />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border shadow-xl">
                                <SelectItem value="none">Désactivé</SelectItem>
                                {channels.map((ch) => (
                                    <SelectItem key={ch.id} value={ch.id}>
                                        #{ch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Voice XP require unmuted */}
                <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-lg hover:shadow-primary/5 transition-all md:col-span-2">
                    <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <Label htmlFor="voiceMute" className="text-base flex items-center gap-2 mb-1 text-foreground">
                                <MicOff className="text-primary w-5 h-5" /> XP vocal requiert non-mute serveur
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Si activé, les utilisateurs mute/deaf serveur ne gagnent pas d'XP vocal.
                            </p>
                        </div>
                        <Switch
                            id="voiceMute"
                            checked={config.voiceXpRequireUnmuted}
                            onCheckedChange={(checked) => setConfig({ ...config, voiceXpRequireUnmuted: checked })}
                            className="data-[state=checked]:bg-primary shrink-0"
                        />
                    </CardContent>
                </Card>

                {/* Level Up Message */}
                <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-lg hover:shadow-primary/5 transition-all md:col-span-2">
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <Label htmlFor="levelUpMessage" className="text-base flex items-center gap-2 mb-1 text-foreground">
                                <PartyPopper className="text-primary w-5 h-5" /> Level message
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Le message envoyé quand un membre monte de niveau.{' '}
                                <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-foreground/80">{'{user}'}</code>{' '}
                                <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-foreground/80">{'{lvl}'}</code>{' '}
                                <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-foreground/80">{'{mention}'}</code>{' '}
                                ainsi que la plupart du TagScript sont supportés.
                            </p>
                        </div>
                        <Textarea
                            id="levelUpMessage"
                            value={config.levelUpMessage ?? ''}
                            onChange={(e) => setConfig({
                                ...config,
                                levelUpMessage: e.target.value === '' ? null : e.target.value,
                            })}
                            placeholder="🎉 {mention} a atteint le niveau {level} ! Félicitations !"
                            rows={3}
                            maxLength={2000}
                            className="bg-background/50 border-border/50 focus-visible:ring-primary shadow-inner resize-none font-mono text-sm"
                        />

                        {/* Discord-style preview */}
                        <div className="rounded-lg bg-[#2b2d31] border border-[#1e1f22] p-4 space-y-1">
                            <p className="text-[#dbdee1] text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {previewLevelUpMessage(config.levelUpMessage)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Save button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="lg"
                    className="min-w-[150px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.23)] hover:-translate-y-0.5 transition-all duration-300"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Sauvegarde...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Sauvegarder
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
