// components/FileExplorer/DeleteAlertDialog.tsx
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
import { Folder, FileRecord } from "@/types/files"

interface DeleteAlertDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: (Folder | FileRecord) | null
    onConfirm: () => Promise<void>
}

export function DeleteAlertDialog({
    open,
    onOpenChange,
    item,
    onConfirm,
}: DeleteAlertDialogProps) {
    if (!item) return null

    const isFolder = 'parent_folder_id' in item
    const itemType = isFolder ? 'dossier' : 'fichier'

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-[400px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Êtes-vous sûr de vouloir supprimer {itemType === 'dossier' ? 'ce' : 'le'} {itemType} ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isFolder ? (
                            <>
                                Cette action supprimera définitivement le dossier &quot;{item.name}&quot; et tout son contenu.
                                <br />
                                <span className="font-medium text-destructive">
                                    Cette action est irréversible.
                                </span>
                            </>
                        ) : (
                            <>
                                Cette action supprimera définitivement le fichier &quot;{item.name}&quot;.
                                <br />
                                <span className="font-medium text-destructive">
                                    Cette action est irréversible.
                                </span>
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Supprimer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
