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
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateRehearsal,
  useDeleteRehearsal,
  useRehearsals,
  useUpdateRehearsal,
} from "@/hooks/useRehearsals";
import { cn } from "@/lib/utils";
import { GROUP_TYPES, GroupType, Rehearsal } from "@/types/rehearsals";
import { addWeeks, format, isAfter, isBefore, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  CalendarX,
  ChevronDown,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  repeat?: {
    enabled: boolean;
    interval: number; // weeks
    endDate: Date | null;
  };
};

interface RehearsalsListProps {
  isAddDialogOpen?: boolean;
  onAddDialogChange?: (open: boolean) => void;
}

export default function RehearsalsList({
  isAddDialogOpen: externalIsAddDialogOpen,
  onAddDialogChange,
}: RehearsalsListProps = {}) {
  // Queries
  const { data: rehearsals = [], isLoading: loading, error } = useRehearsals();

  // Mutations
  const createRehearsal = useCreateRehearsal();
  const updateRehearsal = useUpdateRehearsal();
  const deleteRehearsal = useDeleteRehearsal();

  const [internalIsAddDialogOpen, setInternalIsAddDialogOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<Rehearsal | null>(
    null,
  );
  const [rehearsalToDelete, setRehearsalToDelete] = useState<string | null>(
    null,
  );
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<
    GroupType | "all"
  >("all");

  // Use external state if provided, otherwise use internal state
  const isAddDialogOpen = externalIsAddDialogOpen ?? internalIsAddDialogOpen;
  const setIsAddDialogOpen = onAddDialogChange ?? setInternalIsAddDialogOpen;

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
        {} as Record<string, Rehearsal[]>,
      );
  };

  const generateRehearsalDates = (
    startDate: Date,
    intervalWeeks: number,
    endDate: Date,
  ): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    // Include dates from startDate up to and including endDate
    while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
      dates.push(new Date(currentDate));
      currentDate = addWeeks(currentDate, intervalWeeks);
    }

    return dates;
  };

  const handleSubmit = async (
    formData: RehearsalFormData,
    isEditing: boolean = false,
  ) => {
    try {
      if (isEditing && editingRehearsal) {
        await updateRehearsal.mutateAsync({
          id: editingRehearsal.id,
          name: formData.name,
          place: formData.place,
          date: format(formData.date, "yyyy-MM-dd"),
          start_time: formData.start_time,
          end_time: formData.end_time,
          group_type: formData.group_type,
        });
        toast.success("Succès", {
          description: "La répétition a été mise à jour",
        });
      } else {
        // Check if repeat is enabled
        if (formData.repeat?.enabled && formData.repeat.endDate) {
          // Generate all dates
          const dates = generateRehearsalDates(
            formData.date,
            formData.repeat.interval,
            formData.repeat.endDate,
          );

          // Create all rehearsals
          const rehearsalsToCreate = dates.map((date) => ({
            name: formData.name,
            place: formData.place,
            date: format(date, "yyyy-MM-dd"),
            start_time: formData.start_time,
            end_time: formData.end_time,
            group_type: formData.group_type,
          }));

          // Use bulk create
          await createRehearsal.mutateAsync(rehearsalsToCreate);
          toast.success("Succès", {
            description: `${rehearsalsToCreate.length} répétition(s) ont été créée(s)`,
          });
        } else {
          // Single rehearsal creation
          await createRehearsal.mutateAsync({
            name: formData.name,
            place: formData.place,
            date: format(formData.date, "yyyy-MM-dd"),
            start_time: formData.start_time,
            end_time: formData.end_time,
            group_type: formData.group_type,
          });
          toast.success("Succès", {
            description: "La répétition a été créée",
          });
        }
      }
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
      await deleteRehearsal.mutateAsync(id);
      toast.success("Succès", {
        description: "La répétition a été supprimée",
      });
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de supprimer la répétition",
      });
      console.error(error);
    }
  };

  if (error) return <div>Erreur: {error.message}</div>;

  // Filter rehearsals by selected group
  const filteredRehearsals =
    selectedGroupFilter === "all"
      ? rehearsals
      : rehearsals.filter(
          (rehearsal) => rehearsal.group_type === selectedGroupFilter,
        );

  return (
    <div className="flex max-h-screen flex-col overflow-hidden">
      {/* Filter Section */}
      <div className="bg-background border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            Filtrer par groupe:
          </span>
          <Button
            variant={selectedGroupFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGroupFilter("all")}
            className="h-8"
          >
            Tous
          </Button>
          {GROUP_TYPES.map((groupType) => (
            <Button
              key={groupType}
              variant={
                selectedGroupFilter === groupType ? "default" : "outline"
              }
              size="sm"
              onClick={() => setSelectedGroupFilter(groupType)}
              className="h-8"
            >
              {groupType}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2 md:pr-2">
        {loading ? (
          "Chargement..."
        ) : filteredRehearsals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CalendarX className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">Aucune répétition</h3>
            <p className="text-muted-foreground">
              {selectedGroupFilter === "all"
                ? "Commencez par ajouter une nouvelle répétition."
                : `Aucune répétition trouvée pour le groupe "${selectedGroupFilter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupRehearsalsByMonth(filteredRehearsals)).map(
              ([month, monthRehearsals]) => (
                <div key={month} className="space-y-2">
                  <h2 className="px-1 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    {month}
                  </h2>
                  <div className="space-y-2 px-1">
                    {monthRehearsals.map((rehearsal) => {
                      const rehearsalDate = new Date(rehearsal.date);
                      const isToday = isSameDay(rehearsalDate, new Date());

                      return (
                        <Card
                          key={rehearsal.id}
                          className={cn(
                            "w-full transition-all",
                            isToday && "border-primary/50 bg-primary/5",
                          )}
                        >
                          <CardContent className="p-3 md:p-4">
                            <div className="flex items-center gap-3 md:gap-4">
                              {/* Compact Date Display */}
                              <div
                                className={cn(
                                  "flex w-12 flex-shrink-0 flex-col items-center justify-center md:w-14",
                                  isToday ? "text-primary" : "text-gray-700",
                                )}
                              >
                                <div className="text-xs font-medium uppercase">
                                  {format(rehearsalDate, "EEE", { locale: fr })}
                                </div>
                                <div className="text-2xl leading-none font-bold md:text-3xl">
                                  {format(rehearsalDate, "dd")}
                                </div>
                              </div>

                              {/* Divider */}
                              <div className="h-12 w-px bg-gray-200" />

                              {/* Main Content */}
                              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-3">
                                {/* Name & Group */}
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-gray-900">
                                    {rehearsal.name}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    <User className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                    <span className="truncate text-xs text-gray-500">
                                      {rehearsal.group_type}
                                    </span>
                                  </div>
                                </div>

                                {/* Time */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                    <span className="text-xs text-gray-600">
                                      {formatTime(rehearsal.start_time)} -{" "}
                                      {formatTime(rehearsal.end_time)}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                    <span className="truncate text-xs text-gray-500">
                                      {rehearsal.place}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions - Hidden on small screens, shown on md+ */}
                                <div className="hidden items-center justify-end md:flex">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2"
                                      >
                                        Éditer
                                        <ChevronDown className="ml-1 h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setEditingRehearsal(rehearsal)
                                        }
                                      >
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() =>
                                          handleDelete(rehearsal.id)
                                        }
                                      >
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Mobile Actions Button */}
                              <div className="flex-shrink-0 md:hidden">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setEditingRehearsal(rehearsal)
                                      }
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
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </ScrollArea>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une répétition</DialogTitle>
          </DialogHeader>
          <RehearsalForm onSubmit={(data) => handleSubmit(data, false)} />
        </DialogContent>
      </Dialog>

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
  const isEditing = !!initialData;
  const [formData, setFormData] = useState<RehearsalFormData>({
    name: initialData?.name || "",
    place: initialData?.place || "",
    date: initialData ? new Date(initialData.date) : new Date(),
    start_time: initialData?.start_time || "",
    end_time: initialData?.end_time || "",
    group_type: initialData?.group_type || "Tous",
    repeat: {
      enabled: false,
      interval: 1,
      endDate: null,
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate repeat options if enabled
    if (formData.repeat?.enabled && !formData.repeat.endDate) {
      toast.error("Erreur", {
        description: "Veuillez sélectionner une date de fin pour la répétition",
      });
      return;
    }

    if (
      formData.repeat?.enabled &&
      formData.repeat.endDate &&
      isBefore(formData.repeat.endDate, formData.date)
    ) {
      toast.error("Erreur", {
        description:
          "La date de fin doit être postérieure ou égale à la date de début",
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
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

      {/* Repeat options - only show when creating (not editing) */}
      {!isEditing && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="repeat-enabled"
              checked={formData.repeat?.enabled || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  repeat: {
                    enabled: e.target.checked,
                    interval: formData.repeat?.interval || 1,
                    endDate: formData.repeat?.endDate || null,
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="repeat-enabled" className="cursor-pointer">
              Répéter cette répétition
            </Label>
          </div>

          {formData.repeat?.enabled && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="repeat-interval">Répéter tous les</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="repeat-interval"
                    type="number"
                    min="1"
                    value={formData.repeat.interval}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        repeat: {
                          ...formData.repeat!,
                          interval: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-20"
                    required={formData.repeat.enabled}
                  />
                  <Label className="whitespace-nowrap">semaine(s)</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date de fin de répétition</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.repeat.endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.repeat.endDate ? (
                        format(formData.repeat.endDate, "PPP", { locale: fr })
                      ) : (
                        <span>Choisir une date de fin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.repeat.endDate || undefined}
                      onSelect={(date) =>
                        date &&
                        setFormData({
                          ...formData,
                          repeat: {
                            ...formData.repeat!,
                            endDate: date,
                          },
                        })
                      }
                      disabled={(date) => isAfter(formData.date, date)}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      )}

      <Button type="submit" className="w-full">
        {initialData ? "Modifier" : "Créer"} la répétition
      </Button>
    </form>
  );
}
