import { getAuthenticatedUser } from '@/lib/auth';
import { getDiscordAvatarUrl } from '@/lib/avatar';
import Sidebar from '@/app/_components/Sidebar';

export default async function GuildLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ guildId: string }>;
}) {
    const { guildId } = await params;
    const user = await getAuthenticatedUser();
    const avatarUrl = getDiscordAvatarUrl(user);

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
