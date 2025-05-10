"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Rehearsal } from "@/types/rehearsals";
import { rehearsalAPI } from "@/utils/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Pencil, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type RehearsalFormData = {
  name: string;
  place: string;
  date: Date;
  start_time: string;
  end_time: string;
  group_type: "Orchestre" | "Choeur" | "Tous";
};

export default function RehearsalsList() {
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<Rehearsal | null>(
    null,
  );

  const loadRehearsals = async () => {
    try {
      setLoading(true);
      const data = await rehearsalAPI.getAll();
      setRehearsals(data);
    } catch (err) {
      setError("Failed to load rehearsals");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRehearsals();
  }, []);

  const handleSubmit = async (
    formData: RehearsalFormData,
    isEditing: boolean = false,
  ) => {
    try {
      if (isEditing && editingRehearsal) {
        await rehearsalAPI.update(editingRehearsal.id, {
          ...formData,
          date: format(formData.date, "yyyy-MM-dd"),
        });
        toast.success("Succès", {
          description: "La répétition a été mise à jour",
        });
      } else {
        await rehearsalAPI.create({
          ...formData,
          date: format(formData.date, "yyyy-MM-dd"),
        });
        toast.success("Succès", {
          description: "La répétition a été créée",
        });
      }
      await loadRehearsals();
      setIsAddDialogOpen(false);
      setEditingRehearsal(null);
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de sauvegarder la répétition",
      });
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log(id);

      await rehearsalAPI.delete(id);
      toast.success("Succès", {
        description: "La répétition a été supprimée",
      });
      await loadRehearsals();
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de supprimer la répétition",
      });
      console.error(error);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Répétitions</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Ajouter une répétition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle répétition</DialogTitle>
              <DialogDescription>Ajouter une répétition</DialogDescription>
            </DialogHeader>
            <RehearsalForm onSubmit={handleSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rehearsals.map((rehearsal) => (
          <Card key={rehearsal.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{rehearsal.name}</span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingRehearsal(rehearsal)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(rehearsal.id)}
                  >
                    <Trash className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Lieu :</span>{" "}
                  {rehearsal.place}
                </p>
                <p>
                  <span className="font-semibold">Date :</span>{" "}
                  {new Date(rehearsal.date).toLocaleDateString("fr-FR")}
                </p>
                <p>
                  <span className="font-semibold">Horaires :</span>{" "}
                  {rehearsal.start_time} - {rehearsal.end_time}
                </p>
                <p>
                  <span className="font-semibold">Groupe :</span>{" "}
                  {rehearsal.group_type}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingRehearsal}
        onOpenChange={(open) => !open && setEditingRehearsal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la répétition</DialogTitle>
          </DialogHeader>
          {editingRehearsal && (
            <RehearsalForm
              initialData={editingRehearsal}
              onSubmit={(data) => handleSubmit(data, true)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RehearsalFormProps {
  initialData?: Rehearsal;
  onSubmit: (data: RehearsalFormData) => void;
}

function RehearsalForm({ initialData, onSubmit }: RehearsalFormProps) {
  const [formData, setFormData] = useState<RehearsalFormData>({
    name: initialData?.name || "",
    place: initialData?.place || "",
    date: initialData ? new Date(initialData.date) : new Date(),
    start_time: initialData?.start_time || "",
    end_time: initialData?.end_time || "",
    group_type: initialData?.group_type || "Tous",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="place">Lieu</Label>
        <Input
          id="place"
          value={formData.place}
          onChange={(e) => setFormData({ ...formData, place: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
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
                format(formData.date, "PPP", { locale: fr })
              ) : (
                <span>Choisir une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.date}
              onSelect={(date) => date && setFormData({ ...formData, date })}
              initialFocus
              locale={fr}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Heure de début</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) =>
              setFormData({ ...formData, start_time: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">Heure de fin</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) =>
              setFormData({ ...formData, end_time: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Groupe</Label>
        <Select
          value={formData.group_type}
          onValueChange={(value: "Orchestre" | "Choeur" | "Tous") =>
            setFormData({ ...formData, group_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un groupe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Orchestre">Orchestre</SelectItem>
            <SelectItem value="Choeur">Chœur</SelectItem>
            <SelectItem value="Tous">Tous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Modifier" : "Créer"} la répétition
      </Button>
    </form>
  );
}
