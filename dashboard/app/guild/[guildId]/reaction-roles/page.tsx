import { apiFetch } from '@/lib/api';
import ReactionRolesManager from '@/app/_components/ReactionRolesManager';

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

export default async function ReactionRolesPage({
    params,
}: {
    params: Promise<{ guildId: string }>;
}) {
    const { guildId } = await params;

    const [reactionRoles, roles] = await Promise.all([
        apiFetch<ReactionRole[]>(`/guilds/${guildId}/reaction-roles`),
        apiFetch<Role[]>(`/guilds/${guildId}/roles`),
    ]);

    return (
        <div className="max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                    Rôles de réaction
                </h1>
                <p className="text-muted-foreground text-lg">
                    Configurez les rôles attribués quand un utilisateur réagit à un message. Le bot réagira automatiquement au message spécifié.
                </p>
            </div>
            <ReactionRolesManager
                guildId={guildId}
                initialReactionRoles={reactionRoles}
                roles={roles}
            />
        </div>
    );
}
