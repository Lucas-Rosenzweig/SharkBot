import { apiFetch } from '@/lib/api';
import type { LevelRole, Role } from '@/lib/types';
import LevelRolesManager from '@/app/_components/LevelRolesManager';

export default async function LevelRolesPage({
    params,
}: {
    params: Promise<{ guildId: string }>;
}) {
    const { guildId } = await params;

    const [levelRoles, roles] = await Promise.all([
        apiFetch<LevelRole[]>(`/guilds/${guildId}/level-roles`),
        apiFetch<Role[]>(`/guilds/${guildId}/roles`),
    ]);

    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                    Rôles de niveau
                </h1>
                <p className="text-muted-foreground text-lg">
                    Configurez les rôles attribués automatiquement quand un utilisateur atteint un certain niveau.
                </p>
            </div>
            <LevelRolesManager guildId={guildId} initialLevelRoles={levelRoles} roles={roles} />
        </div>
    );
}
