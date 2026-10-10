// components/users/AddUserDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addUserFormSchema, type AddUserFormValues } from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, ShieldCheck, UserIcon } from "lucide-react";
import { useForm } from "react-hook-form";

export type { AddUserFormValues };

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddUserFormValues) => Promise<void>;
  isProcessing: boolean;
}

export function AddUserDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isProcessing,
}: AddUserDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un nouveau compte utilisateur avec les permissions
            appropriées.
          </DialogDescription>
        </DialogHeader>
        <AddUserForm
          onSubmit={onSubmit}
          isProcessing={isProcessing}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Mounted with the dialog content, so the form resets each time it opens.
function AddUserForm({
  onSubmit,
  isProcessing,
  onCancel,
}: {
  onSubmit: (values: AddUserFormValues) => Promise<void>;
  isProcessing: boolean;
  onCancel: () => void;
}) {
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      display_name: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="display_name">
                  Nom d&apos;affichage
                  <span className="text-muted-foreground ml-2 text-xs">
                    (Optionnel)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="display_name"
                    placeholder="Lucie BERNARD"
                    className="col-span-3"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    placeholder="utilisateur@exemple.com"
                    aria-required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="password">Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    aria-required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="role">Rôle</FormLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger id="role" ref={field.ref} aria-required>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
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
    </Form>
  );
}
