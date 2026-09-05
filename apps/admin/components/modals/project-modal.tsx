"use client";

import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Project } from "@repo/domain/types/projects";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlignLeft,
  Calendar as CalendarIcon,
  Globe,
  ImageIcon,
  Info,
  Layers,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// --- Types ---

interface ProjectFormData {
  name: string;
  sub_name: string;
  slug: string;
  date: Date | null;
  image: string | null;
  explanation: string;
  banniere: string | null;
  banniere_photographer_name: string | null;
  banniere_photographer_url: string | null;
  image2: string | null;
  image2_photographer_name: string | null;
  image2_photographer_url: string | null;
  image3: string | null;
  image3_photographer_name: string | null;
  image3_photographer_url: string | null;
  text1: string;
  text2: string;
  author_name: string | null;
  display_order: number;
}

type FileState = {
  image?: File | null;
  banniere?: File | null;
  image2?: File | null;
  image3?: File | null;
};

// --- Helper Functions ---

const getCloudinaryUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://res.cloudinary.com/dlt2j3dld/image/upload/${path}`;
};

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

// --- Reusable Sub-Component: Image Field ---

const ProjectImageField = ({
  label,
  fileKey,
  currentPath,
  fileValue,
  onFileSelect,
  photographerName,
  photographerUrl,
  onPhotographerChange,
  showPhotographerFields = false,
}: {
  label: string;
  fileKey: keyof FileState;
  currentPath: string | null;
  fileValue: File | null | undefined;
  onFileSelect: (file: File | null) => void;
  photographerName?: string | null;
  photographerUrl?: string | null;
  onPhotographerChange?: (field: "name" | "url", value: string) => void;
  showPhotographerFields?: boolean;
}) => (
  <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
    <div className="mb-2 flex items-center gap-2">
      <ImageIcon className="text-muted-foreground h-4 w-4" />
      <Label className="font-semibold">{label}</Label>
    </div>

    <FileUpload
      onFileSelect={onFileSelect}
      onFileClear={() => onFileSelect(null)}
      value={fileValue}
      currentImageUrl={getCloudinaryUrl(currentPath)}
      mode="image"
    />

    {showPhotographerFields && onPhotographerChange && (
      <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">
            Photographe (Nom)
          </Label>
          <div className="relative">
            <User className="text-muted-foreground absolute top-2.5 left-2.5 h-3.5 w-3.5" />
            <Input
              className="h-9 pl-8 text-sm"
              placeholder="ex: Jean Dupont"
              value={photographerName || ""}
              onChange={(e) => onPhotographerChange("name", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">
            Photographe (URL)
          </Label>
          <div className="relative">
            <LinkIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-3.5 w-3.5" />
            <Input
              className="h-9 pl-8 text-sm"
              placeholder="https://..."
              value={photographerUrl || ""}
              onChange={(e) => onPhotographerChange("url", e.target.value)}
            />
          </div>
        </div>
      </div>
    )}
  </div>
);

// --- Main Component ---

export function ProjectModal({
  project,
  isOpen,
  onClose,
  onSubmit,
}: {
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Project>) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState("general");
  const [uploading, setUploading] = useState<string | null>(null);
  const [files, setFiles] = useState<FileState>({});
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    sub_name: "",
    slug: "",
    date: null,
    image: null,
    explanation: "",
    banniere: null,
    banniere_photographer_name: null,
    banniere_photographer_url: null,
    image2: null,
    image2_photographer_name: null,
    image2_photographer_url: null,
    image3: null,
    image3_photographer_name: null,
    image3_photographer_url: null,
    text1: "",
    text2: "",
    author_name: null,
    display_order: 0,
  });

  // Initialization
  useEffect(() => {
    if (isOpen) {
      if (project) {
        setFormData({
          name: project.name || "",
          sub_name: project.sub_name || "",
          slug: project.slug || "",
          date: project.date ? new Date(project.date) : null,
          image: project.image || null,
          explanation: project.explanation || "",
          banniere: project.banniere || null,
          banniere_photographer_name:
            project.banniere_photographer_name || null,
          banniere_photographer_url: project.banniere_photographer_url || null,
          image2: project.image2 || null,
          image2_photographer_name: project.image2_photographer_name || null,
          image2_photographer_url: project.image2_photographer_url || null,
          image3: project.image3 || null,
          image3_photographer_name: project.image3_photographer_name || null,
          image3_photographer_url: project.image3_photographer_url || null,
          text1: project.text1 || "",
          text2: project.text2 || "",
          author_name: project.author_name || null,
          display_order: project.display_order ?? 0,
        });
      } else {
        // Reset form for new entry
        setFormData({
          name: "",
          sub_name: "",
          slug: "",
          date: null,
          image: null,
          explanation: "",
          banniere: null,
          banniere_photographer_name: null,
          banniere_photographer_url: null,
          image2: null,
          image2_photographer_name: null,
          image2_photographer_url: null,
          image3: null,
          image3_photographer_name: null,
          image3_photographer_url: null,
          text1: "",
          text2: "",
          author_name: null,
          display_order: 0,
        });
        setFiles({});
        fetchDisplayOrder();
      }
      setActiveTab("general");
    }
  }, [project, isOpen]);

  const fetchDisplayOrder = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) return;
      const projects = await response.json();
      const maxOrder =
        projects.length > 0
          ? Math.max(...projects.map((p: Project) => p.display_order || 0))
          : -1;
      setFormData((prev) => ({ ...prev, display_order: maxOrder + 1 }));
    } catch (error) {
      console.error(error);
    }
  };

  const uploadToCloudinary = async (
    file: File,
    folder: string,
  ): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);

    const res = await fetch("/api/cloudinary-upload", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url || data.public_id || "";
  };

  const handleImageUpload = async (
    file: File | null,
    field: keyof FileState,
  ): Promise<string | null> => {
    if (!file) return null;
    setUploading(field);
    try {
      const folder = `Site/concerts/${formData.slug || "projects"}`;
      const path = await uploadToCloudinary(file, folder);
      setFormData((prev) => ({ ...prev, [field]: path }));
      return path;
    } catch (error) {
      console.error(error);
      toast.error(`Erreur upload ${field}`);
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.date) {
      toast.error("Veuillez remplir les champs obligatoires (Nom, Slug, Date)");
      return;
    }

    try {
      // Process uploads sequentially to avoid overwriting states incorrectly
      const newPaths: Partial<ProjectFormData> = {};

      if (files.image)
        newPaths.image = await handleImageUpload(files.image, "image");
      if (files.banniere)
        newPaths.banniere = await handleImageUpload(files.banniere, "banniere");
      if (files.image2)
        newPaths.image2 = await handleImageUpload(files.image2, "image2");
      if (files.image3)
        newPaths.image3 = await handleImageUpload(files.image3, "image3");

      const submitData: Partial<Project> = {
        ...formData,
        ...newPaths,
        date: formData.date ? format(formData.date, "yyyy-MM-dd") : "",
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {project ? (
              <>
                <RefreshCw className="text-muted-foreground h-5 w-5" />
                Modifier le projet
              </>
            ) : (
              <>
                <Layers className="text-muted-foreground h-5 w-5" />
                Créer un nouveau projet
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous. Utilisez les onglets pour
            naviguer entre les sections.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="px-1">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general" className="gap-2">
                  <Info className="h-4 w-4" />
                  Général
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                  <AlignLeft className="h-4 w-4" />
                  Contenu
                </TabsTrigger>
                <TabsTrigger value="media" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Médias
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-1 py-4">
              {/* --- TAB: GENERAL --- */}
              <TabsContent value="general" className="mt-0 space-y-4 px-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Nom du projet *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          name: val,
                          // Only auto-generate slug if creating new
                          slug: !project ? generateSlug(val) : prev.slug,
                        }));
                      }}
                      placeholder="Ex: Concert de Printemps"
                      className="font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sub_name">Sous-titre</Label>
                    <Input
                      id="sub_name"
                      value={formData.sub_name}
                      onChange={(e) =>
                        setFormData({ ...formData, sub_name: e.target.value })
                      }
                      placeholder="Ex: Édition 2024"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="slug">Slug (URL) *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-5 text-[10px]"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            slug: generateSlug(prev.name),
                          }))
                        }
                      >
                        Générer
                      </Button>
                    </div>
                    <div className="relative">
                      <Globe className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        className="pl-9 font-mono text-sm"
                        placeholder="concert-printemps-2024"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date de l'événement *</Label>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? (
                            format(formData.date, "dd MMMM yyyy", {
                              locale: fr,
                            })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date || undefined}
                          onSelect={(date) =>
                            setFormData({ ...formData, date: date || null })
                          }
                          autoFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="author">Auteur de la fiche</Label>
                    <div className="relative">
                      <User className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                      <Input
                        id="author"
                        value={formData.author_name || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            author_name: e.target.value,
                          })
                        }
                        className="pl-9"
                        placeholder="Nom de l'administrateur"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order">Ordre d'affichage</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              {/* --- TAB: CONTENT --- */}
              <TabsContent value="content" className="mt-0 space-y-5 px-2">
                <div className="space-y-2">
                  <Label htmlFor="explanation" className="text-base">
                    Description principale (Introduction)
                  </Label>
                  <Textarea
                    id="explanation"
                    value={formData.explanation}
                    onChange={(e) =>
                      setFormData({ ...formData, explanation: e.target.value })
                    }
                    placeholder="Ce texte apparaîtra en haut de la page du projet..."
                    className="min-h-[100px] resize-y"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="text1">Bloc de texte #1</Label>
                    <Textarea
                      id="text1"
                      value={formData.text1}
                      onChange={(e) =>
                        setFormData({ ...formData, text1: e.target.value })
                      }
                      placeholder="Contenu détaillé..."
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="text2">Bloc de texte #2</Label>
                    <Textarea
                      id="text2"
                      value={formData.text2}
                      onChange={(e) =>
                        setFormData({ ...formData, text2: e.target.value })
                      }
                      placeholder="Contenu additionnel..."
                      className="min-h-[200px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* --- TAB: MEDIA --- */}
              <TabsContent value="media" className="mt-0 space-y-6 px-2">
                <div className="grid gap-6 md:grid-cols-2">
                  <ProjectImageField
                    label="Image Principale (Miniature)"
                    fileKey="image"
                    currentPath={formData.image}
                    fileValue={files.image}
                    onFileSelect={(f) => setFiles({ ...files, image: f })}
                  />

                  <ProjectImageField
                    label="Bannière (Haut de page)"
                    fileKey="banniere"
                    currentPath={formData.banniere}
                    fileValue={files.banniere}
                    onFileSelect={(f) => setFiles({ ...files, banniere: f })}
                    showPhotographerFields
                    photographerName={formData.banniere_photographer_name}
                    photographerUrl={formData.banniere_photographer_url}
                    onPhotographerChange={(field, val) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field === "name"
                          ? "banniere_photographer_name"
                          : "banniere_photographer_url"]: val,
                      }))
                    }
                  />

                  <ProjectImageField
                    label="Image Secondaire"
                    fileKey="image2"
                    currentPath={formData.image2}
                    fileValue={files.image2}
                    onFileSelect={(f) => setFiles({ ...files, image2: f })}
                    showPhotographerFields
                    photographerName={formData.image2_photographer_name}
                    photographerUrl={formData.image2_photographer_url}
                    onPhotographerChange={(field, val) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field === "name"
                          ? "image2_photographer_name"
                          : "image2_photographer_url"]: val,
                      }))
                    }
                  />

                  <ProjectImageField
                    label="Image Tertiaire"
                    fileKey="image3"
                    currentPath={formData.image3}
                    fileValue={files.image3}
                    onFileSelect={(f) => setFiles({ ...files, image3: f })}
                    showPhotographerFields
                    photographerName={formData.image3_photographer_name}
                    photographerUrl={formData.image3_photographer_url}
                    onPhotographerChange={(field, val) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field === "name"
                          ? "image3_photographer_name"
                          : "image3_photographer_url"]: val,
                      }))
                    }
                  />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading !== null}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={uploading !== null}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload en cours ({uploading})...
                </>
              ) : project ? (
                "Enregistrer les modifications"
              ) : (
                "Créer le projet"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
