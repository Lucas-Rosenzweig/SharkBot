import Image from 'next/image';
import { cn } from "@/lib/utils";

interface SharkIconProps {
    className?: string;
}

export function SharkIcon({ className }: SharkIconProps) {
    return (
        <div className={cn("relative shrink-0", className)}>
            <Image
                src="/logo/shark-logo.webp"
                alt="Shark Bot Logo"
                fill
                className="object-contain scale-95 translate-y-[-1px] translate-x-[-3px]"
                priority
                unoptimized
            />
        </div>
    );
}