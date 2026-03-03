import { apiFetch } from '@/lib/api';
import type { UsersResponse } from '@/lib/types';
import LeaderboardTable from '@/app/_components/LeaderboardTable';

export default async function LeaderboardPage({
    params,
    searchParams,
}: {
    params: Promise<{ guildId: string }>;
    searchParams: Promise<{ page?: string }>;
}) {
    const { guildId } = await params;
    const { page: pageStr } = await searchParams;
    const page = Number(pageStr) || 1;

    const data = await apiFetch<UsersResponse>(`/guilds/${guildId}/users?page=${page}&limit=25`);

    return (
        <div className="max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                    Leaderboard
                </h1>
                <p className="text-muted-foreground text-lg">
                    Classement des utilisateurs par XP.
                    {data.pagination && <span className="text-primary/80 ml-2 font-medium">{data.pagination.total} utilisateur(s) au total.</span>}
                </p>
            </div>

            <LeaderboardTable
                guildId={guildId}
                initialUsers={data.users}
                initialPagination={data.pagination}
            />
        </div>
    );
}
