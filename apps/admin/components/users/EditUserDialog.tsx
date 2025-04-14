import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface EditUserDialogProps {
    editingUser: { id: string; display_name: string } | null;
    onClose: () => void;
    onSubmit: (userId: string, newDisplayName: string) => Promise<void>;
}

export function EditUserDialog({ editingUser, onClose, onSubmit }: EditUserDialogProps) {
    const [displayName, setDisplayName] = useState(editingUser?.display_name || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSubmitting(true);
        try {
            await onSubmit(editingUser.id, displayName);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le nom d&apos;affichage</DialogTitle>
                    <DialogDescription>
                        Changez le nom d&apos;affichage de l&apos;utilisateur
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="display_name">Nom d&apos;affichage</Label>
                        <Input
                            id="display_name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Nom d'affichage"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                'Enregistrer'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
