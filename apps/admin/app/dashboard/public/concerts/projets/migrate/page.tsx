"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MigrateProjectsPage() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    migrated: number;
    skipped: number;
    errors?: string[];
  } | null>(null);

  const handleMigrate = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir migrer les projets depuis le fichier JSON ? Cette action est irréversible.",
      )
    ) {
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const response = await fetch("/api/projects/migrate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Migration failed");
      }

      setResult(data);
      toast.success(
        `Migration réussie: ${data.migrated} projet(s) migré(s), ${data.skipped} ignoré(s)`,
      );
    } catch (error) {
      console.error("Migration error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Échec de la migration: ${errorMessage}`);
      setResult({
        message: "Migration failed",
        migrated: 0,
        skipped: 0,
        errors: [errorMessage],
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <PageShell
      theme="public"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Migration des projets"
      description="Importez les projets depuis le fichier JSON vers la base de données. Les projets existants seront ignorés."
    >
      <Card className="border-border/50 overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-black">
        <CardHeader className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-full p-3">
              <Database className="text-primary h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                Migration depuis projects.json
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1 text-sm">
                Cette action va importer tous les projets du fichier{" "}
                <code className="bg-muted rounded px-1">
                  public/json/projects.json
                </code>{" "}
                dans la base de données. Les images existent déjà dans
                Cloudinary.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4">
            <Button
              onClick={handleMigrate}
              disabled={migrating}
              className="w-full sm:w-auto"
              size="lg"
            >
              {migrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migration en cours...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Lancer la migration
                </>
              )}
            </Button>

            {result && (
              <div className="mt-6">
                <div
                  className={`flex items-start gap-3 rounded-xl border p-4 ${
                    result.errors && result.errors.length > 0
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                      : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                  }`}
                >
                  {result.errors && result.errors.length > 0 ? (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p
                      className={`font-medium ${
                        result.errors && result.errors.length > 0
                          ? "text-red-900 dark:text-red-100"
                          : "text-green-900 dark:text-green-100"
                      }`}
                    >
                      {result.message}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p
                        className={
                          result.errors && result.errors.length > 0
                            ? "text-red-700 dark:text-red-300"
                            : "text-green-700 dark:text-green-300"
                        }
                      >
                        <strong>{result.migrated}</strong> projet(s) migré(s)
                      </p>
                      <p
                        className={
                          result.errors && result.errors.length > 0
                            ? "text-red-700 dark:text-red-300"
                            : "text-green-700 dark:text-green-300"
                        }
                      >
                        <strong>{result.skipped}</strong> projet(s) ignoré(s)
                        (déjà existants)
                      </p>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-3 rounded-lg border border-red-300 bg-red-100 p-3 dark:border-red-800 dark:bg-red-950/40">
                          <p className="mb-2 font-medium text-red-800 dark:text-red-200">
                            Erreurs:
                          </p>
                          <ul className="list-disc space-y-1 pl-5">
                            {result.errors.map((error, index) => (
                              <li
                                key={index}
                                className="text-sm text-red-700 dark:text-red-300"
                              >
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
