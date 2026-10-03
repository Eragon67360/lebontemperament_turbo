"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useFormConfig,
  useUpdateFormConfig,
} from "@/hooks/useAnniversaryFormConfig";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function FormConfigInlineEditor() {
  const { data: config, isLoading, isError, refetch } = useFormConfig();
  const updateConfig = useUpdateFormConfig();

  const [formData, setFormData] = useState({
    section_title: "",
    section_description: "",
    name_label: "",
    email_label: "",
    message_label: "",
    year_label: "",
    submit_button_text: "",
    success_message: "",
    is_enabled: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        section_title: config.section_title,
        section_description: config.section_description,
        name_label: config.name_label ?? "",
        email_label: config.email_label ?? "",
        message_label: config.message_label ?? "",
        year_label: config.year_label ?? "",
        submit_button_text: config.submit_button_text ?? "",
        success_message: config.success_message ?? "",
        is_enabled: config.is_enabled ?? true,
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateConfig.mutateAsync(formData);
      toast.success("Configuration mise à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error("Update error:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-6 py-6" role="status" aria-busy>
          <span className="sr-only">Chargement de la configuration…</span>
          <Skeleton className="h-10 w-full" aria-hidden />
          <Skeleton className="h-10 w-full" aria-hidden />
          <Skeleton className="h-24 w-full" aria-hidden />
        </CardContent>
      </Card>
    );
  }

  // Same reason as the Hero editor: a failed load must not hand the user an
  // empty form whose "Enregistrer" would blank the live configuration.
  if (isError || !config) {
    return (
      <Card>
        <CardContent className="py-6">
          <ErrorState
            description="La configuration du formulaire n'a pas pu être chargée. Rien n'est modifiable tant qu'elle n'est pas récupérée."
            onRetry={() => refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Configuration du formulaire de partage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section Title */}
          <div className="space-y-2">
            <Label htmlFor="section_title">Titre de la section</Label>
            <Input
              id="section_title"
              value={formData.section_title}
              onChange={(e) =>
                setFormData({ ...formData, section_title: e.target.value })
              }
              placeholder="Partagez Vos Souvenirs"
              required
            />
          </div>

          {/* Section Description */}
          <div className="space-y-2">
            <Label htmlFor="section_description">
              Description de la section
            </Label>
            <Textarea
              id="section_description"
              value={formData.section_description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  section_description: e.target.value,
                })
              }
              placeholder="Vous avez des souvenirs avec Le Bon Tempérament ?..."
              rows={3}
              required
            />
          </div>

          {/* Form Labels */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Labels des champs</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name_label">Label «&nbsp;Nom&nbsp;»</Label>
                <Input
                  id="name_label"
                  value={formData.name_label}
                  onChange={(e) =>
                    setFormData({ ...formData, name_label: e.target.value })
                  }
                  placeholder="Votre nom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_label">Label «&nbsp;Email&nbsp;»</Label>
                <Input
                  id="email_label"
                  value={formData.email_label}
                  onChange={(e) =>
                    setFormData({ ...formData, email_label: e.target.value })
                  }
                  placeholder="Votre email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message_label">
                  Label «&nbsp;Message&nbsp;»
                </Label>
                <Input
                  id="message_label"
                  value={formData.message_label}
                  onChange={(e) =>
                    setFormData({ ...formData, message_label: e.target.value })
                  }
                  placeholder="Votre souvenir"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year_label">Label «&nbsp;Année&nbsp;»</Label>
                <Input
                  id="year_label"
                  value={formData.year_label}
                  onChange={(e) =>
                    setFormData({ ...formData, year_label: e.target.value })
                  }
                  placeholder="Année (optionnel)"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button Text */}
          <div className="space-y-2">
            <Label htmlFor="submit_button_text">
              Texte du bouton de soumission
            </Label>
            <Input
              id="submit_button_text"
              value={formData.submit_button_text}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  submit_button_text: e.target.value,
                })
              }
              placeholder="Partager mon souvenir"
              required
            />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <Label htmlFor="success_message">Message de succès</Label>
            <Textarea
              id="success_message"
              value={formData.success_message}
              onChange={(e) =>
                setFormData({ ...formData, success_message: e.target.value })
              }
              placeholder="Merci pour votre partage !"
              rows={2}
              required
            />
          </div>

          {/* Enable Form */}
          <div className="border-border bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_enabled" className="text-base">
                Formulaire actif
              </Label>
              <p className="text-muted-foreground text-sm">
                Permettre aux visiteurs de soumettre des témoignages
              </p>
            </div>
            <Switch
              id="is_enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_enabled: checked })
              }
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateConfig.isPending}
              className="min-h-11 w-full sm:w-auto sm:min-w-[120px]"
            >
              {updateConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
