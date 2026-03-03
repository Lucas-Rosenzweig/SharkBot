'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Plus, Trash2, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { csrfHeaders } from '@/lib/csrf';

interface LevelRole {
    id: string;
    guildId: string;
    roleId: string;
    levelReq: number;
}

interface Role {
    id: string;
    name: string;
    color: string;
}

export default function LevelRolesManager({
    guildId,
    initialLevelRoles,
    roles,
}: {
    guildId: string;
    initialLevelRoles: LevelRole[];
    roles: Role[];
}) {
    const [levelRoles, setLevelRoles] = useState<LevelRole[]>(initialLevelRoles);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [levelReq, setLevelReq] = useState(1);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleEdit = (lr: LevelRole) => {
        setEditingId(lr.id);
        setSelectedRoleId(lr.roleId);
        setLevelReq(lr.levelReq);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setSelectedRoleId('');
        setLevelReq(1);
    };

    const handleAdd = async () => {
        if (!selectedRoleId) return;
        setAdding(true);
        try {
            if (editingId) {
                await fetch(`/api/guilds/${guildId}/level-roles/${editingId}`, {
                    method: 'DELETE',
                    headers: csrfHeaders(),
                    credentials: 'include',
                });
            }

            const res = await fetch(`/api/guilds/${guildId}/level-roles`, {
                method: 'POST',
                headers: csrfHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'include',
                body: JSON.stringify({ roleId: selectedRoleId, levelReq }),
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Erreur lors de l'enregistrement");
                return;
            }
            const data = await res.json();
            if (editingId) {
                setLevelRoles([...levelRoles.filter((lr) => lr.id !== editingId), data]);
                toast.success('Rôle de niveau modifié avec succès');
            } else {
                setLevelRoles([...levelRoles, data]);
                toast.success('Rôle de niveau ajouté avec succès');
            }
            setSelectedRoleId('');
            setLevelReq(1);
            setEditingId(null);
        } catch {
            toast.error("Erreur inattendue lors de l'enregistrement");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/guilds/${guildId}/level-roles/${id}`, {
                method: 'DELETE',
                headers: csrfHeaders(),
                credentials: 'include',
            });
            setLevelRoles(levelRoles.filter((lr) => lr.id !== id));
            toast.success('Rôle de niveau supprimé avec succès');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || roleId;
    const getRoleColor = (roleId: string) => roles.find((r) => r.id === roleId)?.color || '#99AAB5';

    return (
        <div className="space-y-8">
            {/* Add form */}
            <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-emerald-400"></div>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        {editingId ? "Modifier le rôle de niveau" : "Nouveau rôle de niveau"}
                    </CardTitle>
                    <CardDescription>
                        Sélectionnez un rôle et le niveau minimum requis pour l'obtenir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="roleSelect" className="text-foreground">Rôle</Label>
                            <Select
                                value={selectedRoleId || "none"}
                                onValueChange={(val) => setSelectedRoleId(val === "none" ? "" : val)}
                            >
                                <SelectTrigger id="roleSelect" className="bg-background/50 border-border/50 focus:ring-primary shadow-inner">
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
                        <div className="w-full sm:w-32 space-y-2">
                            <Label htmlFor="levelReq" className="text-foreground">Niveau requis</Label>
                            <Input
                                id="levelReq"
                                type="number"
                                min={1}
                                value={levelReq}
                                onChange={(e) => setLevelReq(Number(e.target.value))}
                                className="bg-background/50 border-border/50 focus-visible:ring-primary shadow-inner"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                onClick={handleAdd}
                                disabled={adding || !selectedRoleId}
                                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.23)] transition-all duration-300 gap-2"
                            >
                                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                {adding ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Ajouter')}
                            </Button>

                            {editingId && (
                                <Button
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={adding}
                                    className="w-full sm:w-auto"
                                >
                                    Annuler
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            {levelRoles.length === 0 ? (
                <div className="text-center py-16 bg-card/40 backdrop-blur-md rounded-xl border border-border/50 shadow-lg">
                    <p className="text-muted-foreground text-lg">Aucun rôle de niveau n'est configuré.</p>
                </div>
            ) : (
                <div className="bg-card/40 backdrop-blur-xl rounded-xl border border-border/50 shadow-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-secondary/30">
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="font-semibold text-muted-foreground py-4">Niveau requis</TableHead>
                                <TableHead className="font-semibold text-muted-foreground py-4">Rôle attribué</TableHead>
                                <TableHead className="text-right font-semibold text-muted-foreground py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {levelRoles
                                .sort((a, b) => a.levelReq - b.levelReq)
                                .map((lr) => {
                                    const roleColor = getRoleColor(lr.roleId);

                                    return (
                                        <TableRow key={lr.id} className="border-border/50 hover:bg-secondary/20 transition-all duration-300 group">
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                                                        {lr.levelReq}
                                                    </div>
                                                    <span className="font-semibold text-foreground">Niveau {lr.levelReq}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <RoleBadge name={getRoleName(lr.roleId)} color={roleColor} />
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(lr)}
                                                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setItemToDelete(lr.id)}
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
                description="Êtes-vous sûr de vouloir supprimer ce rôle de niveau ? Cette action est irréversible et annulera la règle sur Discord."
            />
        </div>
    );
}
