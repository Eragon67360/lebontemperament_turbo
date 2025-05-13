"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { GROUP_TYPES, GroupType, Rehearsal } from "@/types/rehearsals";
import { rehearsalAPI } from "@/utils/api";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  CalendarX,
  ChevronDown,
  Clock,
  MapPin,
  Plus,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardPageHeader } from "./DashboardPageHeader";

const formatTime = (time: string) => {
  return time.split(":").slice(0, 2).join(":");
};

type RehearsalFormData = {
  name: string;
  place: string;
  date: Date;
  start_time: string;
  end_time: string;
  group_type: GroupType;
};

export default function RehearsalsList() {
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<Rehearsal | null>(
    null
  );
  const [rehearsalToDelete, setRehearsalToDelete] = useState<string | null>(
    null
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

  const groupRehearsalsByMonth = (rehearsals: Rehearsal[]) => {
    return rehearsals
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce(
        (groups, rehearsal) => {
          const month = format(new Date(rehearsal.date), "MMMM", {
            locale: fr,
          });
          if (!groups[month]) {
            groups[month] = [];
          }
          groups[month].push(rehearsal);
          return groups;
        },
        {} as Record<string, Rehearsal[]>
      );
  };

  const handleSubmit = async (
    formData: RehearsalFormData,
    isEditing: boolean = false
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

  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center mb-4 sm:mb-6">
        <DashboardPageHeader
          title="Gestion des répétitions"
          description="Gérez les prochaines répètes."
        />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Ajouter une répétition</span>
              <span className="inline sm:hidden">Ajouter</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Nouvelle répétition
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Ajouter une répétition
              </DialogDescription>
            </DialogHeader>
            <RehearsalForm onSubmit={handleSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        "Chargement..."
      ) : rehearsals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <CalendarX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucune répétition</h3>
          <p className="text-muted-foreground">
            Commencez par ajouter une nouvelle répétition.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupRehearsalsByMonth(rehearsals)).map(
            ([month, monthRehearsals]) => (
              <div key={month} className="space-y-4">
                <h2 className="text-2xl font-semibold capitalize">{month}</h2>
                <div className="space-y-4">
                  {monthRehearsals.map((rehearsal) => {
                    const rehearsalDate = new Date(rehearsal.date);
                    const isToday = isSameDay(rehearsalDate, new Date());

                    return (
                      <Card key={rehearsal.id} className="w-full">
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 gap-4 sm:gap-0">
                          {/* Column 1: Date */}
                          <div
                            className={cn(
                              "text-center min-w-[80px] sm:min-w-[100px]",
                              isToday ? "text-primary" : "text-black"
                            )}
                          >
                            <div className="text-xl sm:text-2xl capitalize">
                              {format(rehearsalDate, "EEE", { locale: fr })}
                            </div>
                            <div className="text-3xl sm:text-5xl font-bold">
                              {format(rehearsalDate, "dd")}
                            </div>
                          </div>

                          {/* Vertical Separator */}
                          <div className="hidden sm:block w-px h-16 bg-border mx-6" />

                          {/* Column 2: Time and Place */}
                          <div className="sm:mr-16 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm sm:text-base">
                                {formatTime(rehearsal.start_time)} -{" "}
                                {formatTime(rehearsal.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm sm:text-base">
                                {rehearsal.place}
                              </span>
                            </div>
                          </div>

                          {/* Column 3: Name and Group */}
                          <div className="flex-1 w-full sm:w-auto">
                            <div className="font-medium text-sm sm:text-base">
                              {rehearsal.name}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm sm:text-base">
                                {rehearsal.group_type}
                              </span>
                            </div>
                          </div>

                          {/* Column 4: Actions */}
                          <div className="self-end sm:self-center w-full sm:w-auto">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full sm:w-auto"
                                >
                                  Éditer
                                  <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setEditingRehearsal(rehearsal)}
                                >
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(rehearsal.id)}
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}

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
      <AlertDialog
        open={!!rehearsalToDelete}
        onOpenChange={(open) => !open && setRehearsalToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rehearsalToDelete) {
                  handleDelete(rehearsalToDelete);
                  setRehearsalToDelete(null);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                !formData.date && "text-muted-foreground"
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
          onValueChange={(value: GroupType) =>
            setFormData({ ...formData, group_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un groupe" />
          </SelectTrigger>
          <SelectContent>
            {GROUP_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Modifier" : "Créer"} la répétition
      </Button>
    </form>
  );
}
