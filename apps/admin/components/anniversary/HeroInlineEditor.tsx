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
  useAnniversaryHero,
  useUpdateAnniversaryHero,
} from "@/hooks/useAnniversaryHero";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function HeroInlineEditor() {
  const { data: hero, isLoading, isError, refetch } = useAnniversaryHero();
  const updateHero = useUpdateAnniversaryHero();

  const [formData, setFormData] = useState({
    hero_number: "",
    hero_subtitle: "",
    description: "",
    cta_text: "",
    cta_target_section: "",
    enable_intro_animation: true,
    skip_button_text: "",
  });

  useEffect(() => {
    if (hero) {
      setFormData({
        hero_number: hero.hero_number,
        hero_subtitle: hero.hero_subtitle,
        description: hero.description || "",
        cta_text: hero.cta_text ?? "",
        cta_target_section: hero.cta_target_section ?? "",
        enable_intro_animation: hero.enable_intro_animation ?? true,
        skip_button_text: hero.skip_button_text ?? "",
      });
    }
  }, [hero]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateHero.mutateAsync(formData);
      toast.success("Section Hero mise à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error("Update error:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-6 py-6" role="status" aria-busy>
          <span className="sr-only">Chargement du contenu…</span>
          <Skeleton className="h-10 w-full" aria-hidden />
          <Skeleton className="h-10 w-full" aria-hidden />
          <Skeleton className="h-24 w-full" aria-hidden />
        </CardContent>
      </Card>
    );
  }

  // Without this branch a failed load left every field empty and enabled: one
  // "Enregistrer" would have overwritten the live hero content with blanks.
  if (isError || !hero) {
    return (
      <Card>
        <CardContent className="py-6">
          <ErrorState
            description="Le contenu de la section Hero n'a pas pu être chargé. Rien n'est modifiable tant qu'il n'est pas récupéré."
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
          <CardTitle>Contenu de la section Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Number */}
          <div className="space-y-2">
            <Label htmlFor="hero_number">Numéro principal</Label>
            <Input
              id="hero_number"
              value={formData.hero_number}
              onChange={(e) =>
                setFormData({ ...formData, hero_number: e.target.value })
              }
              placeholder="40"
              required
            />
            <p className="text-muted-foreground text-xs">
              Le nombre affiché en grand (ex.&nbsp;: «&nbsp;40&nbsp;»)
            </p>
          </div>

          {/* Hero Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="hero_subtitle">Sous-titre</Label>
            <Input
              id="hero_subtitle"
              value={formData.hero_subtitle}
              onChange={(e) =>
                setFormData({ ...formData, hero_subtitle: e.target.value })
              }
              placeholder="Années de Passion Musicale"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Célébrons quatre décennies d'excellence..."
              rows={3}
            />
          </div>

          {/* CTA Text */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cta_text">Texte du bouton</Label>
              <Input
                id="cta_text"
                value={formData.cta_text}
                onChange={(e) =>
                  setFormData({ ...formData, cta_text: e.target.value })
                }
                placeholder="Découvrir Notre Histoire"
                required
              />
            </div>

            {/* CTA Target */}
            <div className="space-y-2">
              <Label htmlFor="cta_target_section">Section cible</Label>
              <Input
                id="cta_target_section"
                value={formData.cta_target_section}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cta_target_section: e.target.value,
                  })
                }
                placeholder="anniversary-navigation"
                required
              />
            </div>
          </div>

          {/* Skip Button Text */}
          <div className="space-y-2">
            <Label htmlFor="skip_button_text">
              Texte du bouton «&nbsp;Passer l&apos;animation&nbsp;»
            </Label>
            <Input
              id="skip_button_text"
              value={formData.skip_button_text}
              onChange={(e) =>
                setFormData({ ...formData, skip_button_text: e.target.value })
              }
              placeholder="Passer l'animation"
              required
            />
          </div>

          {/* Enable Intro Animation */}
          <div className="border-border bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable_intro_animation" className="text-base">
                Animation d&apos;introduction
              </Label>
              <p className="text-muted-foreground text-sm">
                Activer l&apos;animation GSAP au chargement de la page
              </p>
            </div>
            <Switch
              id="enable_intro_animation"
              checked={formData.enable_intro_animation}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enable_intro_animation: checked })
              }
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateHero.isPending}
              className="min-h-11 w-full sm:w-auto sm:min-w-[120px]"
            >
              {updateHero.isPending ? (
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
