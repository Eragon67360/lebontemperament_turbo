// components/FileExplorer/CreateFolderDialog.tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface CreateFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (name: string) => void;
}

export function CreateFolderDialog({
    open,
    onOpenChange,
    onSubmit,
}: CreateFolderDialogProps) {
    const [name, setName] = useState("");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau dossier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 ">
                    <Input
                        placeholder="Nom du dossier"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => {
                                onSubmit(name);
                                setName("");
                            }}
                            disabled={!name.trim()}
                        >
                            Créer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
