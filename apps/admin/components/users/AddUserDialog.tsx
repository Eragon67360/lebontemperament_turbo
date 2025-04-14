import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserIcon, ShieldCheck, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// components/users/AddUserDialog.tsx
interface AddUserDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    isProcessing: boolean;
    newUserEmail: string;
    setNewUserEmail: (email: string) => void;
    newUserPassword: string;
    setNewUserPassword: (password: string) => void;
    newUserRole: 'user' | 'admin';
    setNewUserRole: (role: 'user' | 'admin') => void;
    newUserDisplayName: string;
    setNewUserDisplayName: (name: string) => void;
}

export function AddUserDialog({
    isOpen,
    onOpenChange,
    onSubmit,
    isProcessing,
    newUserEmail,
    setNewUserEmail,
    newUserPassword,
    setNewUserPassword,
    newUserRole,
    setNewUserRole,
    newUserDisplayName,
    setNewUserDisplayName,
}: AddUserDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
                    <DialogDescription>
                        Créez un nouveau compte utilisateur avec les permissions appropriées.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="display_name">
                                Nom d&apos;affichage
                                <span className="text-xs text-muted-foreground ml-2">(Optionnel)</span>
                            </Label>
                            <Input
                                id="display_name"
                                value={newUserDisplayName}
                                onChange={(e) => setNewUserDisplayName(e.target.value)}
                                placeholder="John Doe"
                                className="col-span-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="required">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="utilisateur@exemple.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="required">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role" className="required">Rôle</Label>
                            <Select
                                value={newUserRole}
                                onValueChange={(value: 'user' | 'admin') => setNewUserRole(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">
                                        <div className="flex items-center">
                                            <UserIcon className="mr-2 h-4 w-4" />
                                            Utilisateur
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div className="flex items-center">
                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                            Administrateur
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Créer l&apos;utilisateur
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
