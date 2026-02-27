import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    cancelText?: string;
    confirmText?: string;
}

export function ConfirmDeleteModal({
    isOpen,
    onOpenChange,
    onConfirm,
    title = "Êtes-vous sûr ?",
    description = "Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?",
    cancelText = "Annuler",
    confirmText = "Supprimer"
}: ConfirmDeleteModalProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-card/95 backdrop-blur-xl border border-destructive/20 shadow-2xl shadow-destructive/10 sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl text-foreground font-semibold flex items-center gap-2">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
                    <AlertDialogCancel className="bg-secondary/40 text-foreground hover:bg-secondary/80 border-border/50 transition-colors mt-0">
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className="bg-red-500 text-white hover:bg-red-600 transition-all duration-300 shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)] border-none"
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
