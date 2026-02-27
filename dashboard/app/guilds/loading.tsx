import { Server, Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none -z-10 blur-3xl" />

            {/* Header */}
            <header className="fixed top-0 inset-x-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-50 flex items-center">
                <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                            <Server className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Shark Bot
                        </h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col items-center justify-center w-full min-h-[60vh]">
                <Loader2 className="w-16 h-16 animate-spin text-primary mb-6 animate-out fade-out" />
                <p className="text-muted-foreground text-xl animate-pulse">Chargement en cours...</p>
            </main>
        </div>
    );
}
