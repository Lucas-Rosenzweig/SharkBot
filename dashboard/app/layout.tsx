import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

const firaCode = Fira_Code({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-fira-code',
});

export const metadata: Metadata = {
    title: 'Shark Bot — Dashboard',
    description: "Dashboard d'administration du bot Discord Shark Bot",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={`${inter.variable} ${firaCode.variable} font-sans antialiased bg-background text-foreground`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster position="bottom-right" richColors />
                </ThemeProvider>
            </body>
        </html>
    );
}
