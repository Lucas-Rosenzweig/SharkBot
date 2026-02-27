import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
    name: string;
    color: string;
    className?: string;
}

export function RoleBadge({ name, color, className }: RoleBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "font-medium px-3 py-1.5 border-border/60 shadow-sm gap-2.5 bg-background/60 text-foreground hover:bg-background/80 transition-colors w-40 justify-start",
                className
            )}
        >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: color, color: color }}
                />
                <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ backgroundColor: color }}
                />
            </span>
            <span className="truncate">{name}</span>
        </Badge>
    );
}
