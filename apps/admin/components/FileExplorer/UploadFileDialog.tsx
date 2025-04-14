// components/FileExplorer/UploadFileDialog.tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

interface UploadFileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (file: File) => Promise<void>;
}

export function UploadFileDialog({
    open,
    onOpenChange,
    onSubmit,
}: UploadFileDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            await onSubmit(selectedFile);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            onOpenChange(false);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Téléverser un fichier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="mb-2"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Sélectionner un fichier
                        </Button>
                        {selectedFile && (
                            <p className="text-sm text-muted-foreground">
                                {selectedFile.name}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedFile(null);
                                onOpenChange(false);
                            }}
                            disabled={uploading}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedFile || uploading}
                        >
                            {uploading ? (
                                <>
                                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                                    Téléversement...
                                </>
                            ) : (
                                'Téléverser'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
