// components/modals/project-modal.tsx
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Project } from "@/types/projects";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

  const [uploading, setUploading] = useState<string | null>(null);
  const [files, setFiles] = useState<{
    image?: File | null;
    banniere?: File | null;
    image2?: File | null;
    image3?: File | null;
  }>({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        sub_name: project.sub_name || "",
        slug: project.slug || "",
        date: project.date ? new Date(project.date) : null,
        image: project.image || null,
        explanation: project.explanation || "",
        banniere: project.banniere || null,
        banniere_photographer_name: project.banniere_photographer_name || null,
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
        display_order: project.display_order,
      });
    } else {
      fetchDisplayOrder();
    }
  }, [project]);

  const fetchDisplayOrder = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const projects = await response.json();
      const maxOrder =
        projects.length > 0
          ? Math.max(...projects.map((p: Project) => p.display_order || 0))
          : -1;
      const newDisplayOrder = maxOrder + 1;
      setFormData((prev) => ({ ...prev, display_order: newDisplayOrder }));
    } catch (error) {
      console.error(error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const uploadToCloudinary = async (
    file: File,
    folder: string,
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/cloudinary-upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    // The API returns { url: public_id, secure_url: secure_url }
    // We need the public_id (url field) to store in the database
    return data.url || data.public_id || ""; // Returns Cloudinary public_id (path)
  };

  const handleImageUpload = async (
    file: File | null,
    field: "image" | "banniere" | "image2" | "image3",
  ): Promise<string | null> => {
    if (!file) return null;

    setUploading(field);
    try {
      const folder = `Site/concerts/${formData.slug || "projects"}`;
      const cloudinaryPath = await uploadToCloudinary(file, folder);
      setFormData((prev) => ({ ...prev, [field]: cloudinaryPath }));
      toast.success("Image uploadée avec succès");
      return cloudinaryPath;
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'upload de l'image");
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Le nom du projet est requis");
      return;
    }

    if (!formData.slug) {
      toast.error("Le slug est requis");
      return;
    }

    if (!formData.date) {
      toast.error("La date est requise");
      return;
    }

    // Upload any pending files and wait for them to complete
    const uploadResults: Record<string, string | null> = {};

    if (files.image) {
      uploadResults.image = await handleImageUpload(files.image, "image");
    }
    if (files.banniere) {
      uploadResults.banniere = await handleImageUpload(
        files.banniere,
        "banniere",
      );
    }
    if (files.image2) {
      uploadResults.image2 = await handleImageUpload(files.image2, "image2");
    }
    if (files.image3) {
      uploadResults.image3 = await handleImageUpload(files.image3, "image3");
    }

    try {
      // Merge upload results into formData, using uploaded paths or existing formData values
      const submitData: Partial<Project> = {
        ...formData,
        date: formData.date ? formData.date.toISOString().split("T")[0] : "",
        image: uploadResults.image ?? formData.image,
        banniere: uploadResults.banniere ?? formData.banniere,
        image2: uploadResults.image2 ?? formData.image2,
        image3: uploadResults.image3 ?? formData.image3,
      };
      await onSubmit(submitData);

      // Clear form if creating new project
      if (!project) {
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
        // Fetch new display order for next project
        fetchDisplayOrder();
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde du projet");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden lg:max-w-7xl xl:max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>
            {project ? "Modifier le projet" : "Créer un projet"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({
                        ...formData,
                        name: newName,
                        slug: generateSlug(newName),
                      });
                    }}
                    placeholder="Nom du projet"
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
                    placeholder="Sous-titre du projet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="slug-du-projet"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover modal>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? (
                          format(formData.date, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date || undefined}
                        onSelect={(date) =>
                          setFormData({ ...formData, date: date || null })
                        }
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Description</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
                  placeholder="Description du projet"
                  rows={3}
                />
              </div>

              {/* Text content */}
              <div className="space-y-2">
                <Label htmlFor="text1">Texte 1</Label>
                <Textarea
                  id="text1"
                  value={formData.text1}
                  onChange={(e) =>
                    setFormData({ ...formData, text1: e.target.value })
                  }
                  placeholder="Premier paragraphe"
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text2">Texte 2</Label>
                <Textarea
                  id="text2"
                  value={formData.text2}
                  onChange={(e) =>
                    setFormData({ ...formData, text2: e.target.value })
                  }
                  placeholder="Second paragraphe"
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_name">Auteur</Label>
                <Input
                  id="author_name"
                  value={formData.author_name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      author_name: e.target.value || null,
                    })
                  }
                  placeholder="Nom de l'auteur"
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Images section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Image principale</Label>
                  <FileUpload
                    onFileSelect={(file) => setFiles({ ...files, image: file })}
                    onFileClear={() => setFiles({ ...files, image: null })}
                    value={files.image}
                    currentImageUrl={
                      formData.image
                        ? `https://res.cloudinary.com/dlt2j3dld/image/upload/${formData.image}`
                        : null
                    }
                    mode="image"
                  />
                  {uploading === "image" && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upload en cours...
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Bannière</Label>
                  <FileUpload
                    onFileSelect={(file) =>
                      setFiles({ ...files, banniere: file })
                    }
                    onFileClear={() => setFiles({ ...files, banniere: null })}
                    value={files.banniere}
                    currentImageUrl={
                      formData.banniere
                        ? `https://res.cloudinary.com/dlt2j3dld/image/upload/${formData.banniere}`
                        : null
                    }
                    mode="image"
                  />
                  {uploading === "banniere" && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upload en cours...
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      placeholder="Nom du photographe"
                      value={formData.banniere_photographer_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          banniere_photographer_name: e.target.value || null,
                        })
                      }
                    />
                    <Input
                      placeholder="URL du photographe"
                      value={formData.banniere_photographer_url || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          banniere_photographer_url: e.target.value || null,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Image 2</Label>
                  <FileUpload
                    onFileSelect={(file) =>
                      setFiles({ ...files, image2: file })
                    }
                    onFileClear={() => setFiles({ ...files, image2: null })}
                    value={files.image2}
                    currentImageUrl={
                      formData.image2
                        ? `https://res.cloudinary.com/dlt2j3dld/image/upload/${formData.image2}`
                        : null
                    }
                    mode="image"
                  />
                  {uploading === "image2" && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upload en cours...
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      placeholder="Nom du photographe"
                      value={formData.image2_photographer_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          image2_photographer_name: e.target.value || null,
                        })
                      }
                    />
                    <Input
                      placeholder="URL du photographe"
                      value={formData.image2_photographer_url || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          image2_photographer_url: e.target.value || null,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Image 3</Label>
                  <FileUpload
                    onFileSelect={(file) =>
                      setFiles({ ...files, image3: file })
                    }
                    onFileClear={() => setFiles({ ...files, image3: null })}
                    value={files.image3}
                    currentImageUrl={
                      formData.image3
                        ? `https://res.cloudinary.com/dlt2j3dld/image/upload/${formData.image3}`
                        : null
                    }
                    mode="image"
                  />
                  {uploading === "image3" && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upload en cours...
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      placeholder="Nom du photographe"
                      value={formData.image3_photographer_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          image3_photographer_name: e.target.value || null,
                        })
                      }
                    />
                    <Input
                      placeholder="URL du photographe"
                      value={formData.image3_photographer_url || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          image3_photographer_url: e.target.value || null,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={uploading !== null}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload...
                </>
              ) : project ? (
                "Mettre à jour"
              ) : (
                "Créer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
