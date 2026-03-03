'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { csrfHeaders } from '@/lib/csrf';
import { toast } from 'sonner';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', headers: csrfHeaders(), credentials: 'include' });
            window.location.href = '/login';
        } catch {
            toast.error('Erreur lors de la déconnexion.');
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
        >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
        </Button>
    );
}
