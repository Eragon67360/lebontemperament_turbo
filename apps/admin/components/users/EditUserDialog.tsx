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
  editUserFormSchema,
  type EditUserFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

interface EditUserDialogProps {
  editingUser: { id: string; display_name: string } | null;
  onClose: () => void;
  onSubmit: (userId: string, newDisplayName: string) => Promise<void>;
}

export function EditUserDialog({
  editingUser,
  onClose,
  onSubmit,
}: EditUserDialogProps) {
  return (
    <Dialog open={!!editingUser} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le nom d&apos;affichage</DialogTitle>
          <DialogDescription>
            Changez le nom d&apos;affichage de l&apos;utilisateur
          </DialogDescription>
        </DialogHeader>
        {editingUser && (
          <EditUserForm
            key={editingUser.id}
            editingUser={editingUser}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditUserForm({
  editingUser,
  onClose,
  onSubmit,
}: {
  editingUser: { id: string; display_name: string };
  onClose: () => void;
  onSubmit: (userId: string, newDisplayName: string) => Promise<void>;
}) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: { display_name: editingUser.display_name || "" },
  });
  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = async (values: EditUserFormValues) => {
    await onSubmit(editingUser.id, values.display_name);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="display_name">Nom d&apos;affichage</FormLabel>
              <FormControl>
                <Input
                  id="display_name"
                  placeholder="Lucie BERNARD"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
