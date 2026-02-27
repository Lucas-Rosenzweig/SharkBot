import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Sidebar from '@/app/_components/Sidebar';

interface AuthResponse {
    authenticated: boolean;
    user?: {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
    };
}

export default async function GuildLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ guildId: string }>;
}) {
    const { guildId } = await params;

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
        // Fallback to default avatar
        // New system: (userId >> 22) % 6
        // Old system: discriminator % 5
        const isPomelo = user.discriminator === '0' || user.discriminator === '0000';
        if (isPomelo) {
            const defaultAvatarIndex = Number((BigInt(user.id) >> 22n) % 6n);
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        } else {
            const defaultAvatarIndex = Number(user.discriminator) % 5;
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            <Sidebar guildId={guildId} username={user.username} avatarUrl={avatarUrl} />
            <main className="flex-1 p-8 overflow-y-auto relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
                <div className="relative z-10 mx-auto max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
