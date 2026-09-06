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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCreateRehearsal,
  useDeleteRehearsal,
  useRehearsals,
  useUpdateRehearsal,
} from "@/hooks/useRehearsals";
import { cn } from "@/lib/utils";
import {
  GROUP_TYPES,
  GroupType,
  Rehearsal,
} from "@repo/domain/types/rehearsals";
import { addWeeks, format, isAfter, isBefore, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Mic2,
  Music,
  Pencil,
  Repeat,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// --- Types & Utilities ---

type RehearsalFormData = {
  name: string;
  place: string;
  date: Date;
  start_time: string;
  end_time: string;
  group_type: GroupType;
  repeat?: {
    enabled: boolean;
    interval: number;
    endDate: Date | null;
  };
};

const formatTime = (time: string) => time.split(":").slice(0, 2).join(":");

const getBadgeStyle = (type: string) => {
  // Simple deterministic styling based on group type content
  const lower = type.toLowerCase();
  if (lower.includes("tutti"))
    return "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20";
  if (lower.includes("soprano") || lower.includes("alto"))
    return "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 border-pink-500/20";
  if (lower.includes("tenor") || lower.includes("basse"))
    return "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20";
  return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
};

// --- Components ---

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-muted/40 h-[200px] w-full animate-pulse rounded-2xl border"
      />
    ))}
  </div>
);

const EmptyState = ({
  filter,
  onClear,
}: {
  filter: string;
  onClear: () => void;
}) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center">
    <div className="bg-muted ring-muted/50 flex h-20 w-20 items-center justify-center rounded-full ring-8">
      <Music className="text-muted-foreground h-10 w-10" />
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-semibold tracking-tight">
        Aucune répétition trouvée
      </h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        {filter === "all"
          ? "Votre calendrier de répétitions est vide pour le moment."
          : `Aucune répétition prévue pour le groupe "${filter}".`}
      </p>
    </div>
    {filter !== "all" && (
      <Button variant="outline" onClick={onClear}>
        Voir toutes les répétitions
      </Button>
    )}
  </div>
);

interface RehearsalsListProps {
  isAddDialogOpen?: boolean;
  onAddDialogChange?: (open: boolean) => void;
}

export default function RehearsalsList({
  isAddDialogOpen: externalIsAddDialogOpen,
  onAddDialogChange,
}: RehearsalsListProps = {}) {
  // Queries
  const { data: rehearsals = [], isLoading: loading } = useRehearsals();

  // Mutations
  const createRehearsal = useCreateRehearsal();
  const updateRehearsal = useUpdateRehearsal();
  const deleteRehearsal = useDeleteRehearsal();

  // State
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

  // Sync external/internal state
  const isAddDialogOpen = externalIsAddDialogOpen ?? internalIsAddDialogOpen;
  const setIsAddDialogOpen = onAddDialogChange ?? setInternalIsAddDialogOpen;

  // Logic
  const generateRehearsalDates = (
    startDate: Date,
    intervalWeeks: number,
    endDate: Date,
  ): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
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
      const commonData = {
        name: formData.name,
        place: formData.place,
        start_time: formData.start_time,
        end_time: formData.end_time,
        group_type: formData.group_type,
      };

      if (isEditing && editingRehearsal) {
        await updateRehearsal.mutateAsync({
          id: editingRehearsal.id,
          date: format(formData.date, "yyyy-MM-dd"),
          ...commonData,
        });
        toast.success("Répétition mise à jour");
      } else {
        if (formData.repeat?.enabled && formData.repeat.endDate) {
          const dates = generateRehearsalDates(
            formData.date,
            formData.repeat.interval,
            formData.repeat.endDate,
          );
          const bulkData = dates.map((date) => ({
            ...commonData,
            date: format(date, "yyyy-MM-dd"),
          }));
          await createRehearsal.mutateAsync(bulkData);
          toast.success(`${bulkData.length} répétitions créées`);
        } else {
          await createRehearsal.mutateAsync({
            ...commonData,
            date: format(formData.date, "yyyy-MM-dd"),
          });
          toast.success("Répétition créée");
        }
      }
      setIsAddDialogOpen(false);
      setEditingRehearsal(null);
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!rehearsalToDelete) return;
    try {
      await deleteRehearsal.mutateAsync(rehearsalToDelete);
      toast.success("Répétition supprimée");
    } catch (error) {
      toast.error("Impossible de supprimer");
      console.error(error);
    } finally {
      setRehearsalToDelete(null);
    }
  };

  // Memoized Filters
  const filteredRehearsals = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const upcoming = rehearsals
      .filter((r) => r.date >= todayStr)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (selectedGroupFilter === "all") return upcoming;
    return upcoming.filter((r) => r.group_type === selectedGroupFilter);
  }, [rehearsals, selectedGroupFilter]);

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={selectedGroupFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGroupFilter("all")}
            className="h-8 rounded-full"
          >
            Tous
          </Button>
          <div className="bg-border h-4 w-px" />
          {GROUP_TYPES.map((type) => (
            <Button
              key={type}
              variant={selectedGroupFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGroupFilter(type)}
              className="h-8 rounded-full whitespace-nowrap"
            >
              {type}
            </Button>
          ))}
        </div>
        <div className="text-muted-foreground text-xs">
          {filteredRehearsals.length} à venir
        </div>
      </div>

      <ScrollArea className="h-full w-full pr-4">
        {loading ? (
          <LoadingSkeleton />
        ) : filteredRehearsals.length === 0 ? (
          <EmptyState
            filter={selectedGroupFilter}
            onClear={() => setSelectedGroupFilter("all")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 px-1 pt-2 pb-12 md:grid-cols-2 xl:grid-cols-3">
            {filteredRehearsals.map((rehearsal) => (
              <RehearsalCard
                key={rehearsal.id}
                rehearsal={rehearsal}
                onEdit={setEditingRehearsal}
                onDelete={setRehearsalToDelete}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Dialogs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle répétition</DialogTitle>
            <DialogDescription>
              Ajoutez une séance au calendrier.
            </DialogDescription>
          </DialogHeader>
          <RehearsalForm onSubmit={(data) => handleSubmit(data, false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingRehearsal}
        onOpenChange={(open) => !open && setEditingRehearsal(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la répétition</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la séance.
            </DialogDescription>
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette répétition ? Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Sub-Components ---

function RehearsalCard({
  rehearsal,
  onEdit,
  onDelete,
}: {
  rehearsal: Rehearsal;
  onEdit: (r: Rehearsal) => void;
  onDelete: (id: string) => void;
}) {
  const date = new Date(rehearsal.date);
  const dayNumber = format(date, "dd");
  const monthName = format(date, "MMM", { locale: fr });
  const dayName = format(date, "EEEE", { locale: fr });

  return (
    <Card className="group bg-card text-card-foreground hover:border-primary/50 relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
      <div className="flex h-full flex-col p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex gap-4">
            {/* Date Tile */}
            <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex flex-col items-center justify-center rounded-xl px-3 py-2 shadow-sm transition-colors duration-300">
              <span className="text-xs font-bold tracking-wider uppercase">
                {monthName}
              </span>
              <span className="text-2xl leading-none font-black">
                {dayNumber}
              </span>
            </div>
            <div>
              <h3 className="line-clamp-1 text-lg leading-tight font-bold">
                {rehearsal.name}
              </h3>
              <div className="text-muted-foreground text-sm capitalize">
                {dayName}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn(
                "whitespace-nowrap",
                getBadgeStyle(rehearsal.group_type),
              )}
            >
              {rehearsal.group_type === "Tous" ? (
                <Users className="mr-1 h-3 w-3" />
              ) : (
                <Mic2 className="mr-1 h-3 w-3" />
              )}
              {rehearsal.group_type}
            </Badge>
            {rehearsal.event_id && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                    >
                      Synchronisé
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-64">
                    Synchronisé avec Google Calendar. Les modifications
                    manuelles peuvent être écrasées au prochain sync.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className="text-muted-foreground space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="text-primary/60 h-4 w-4" />
            <span>
              {formatTime(rehearsal.start_time)} -{" "}
              {formatTime(rehearsal.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="text-primary/60 h-4 w-4" />
            <span className="truncate">{rehearsal.place}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-end gap-2 pt-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 hover:text-primary h-8 w-8"
            onClick={() => onEdit(rehearsal)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
            onClick={() => onDelete(rehearsal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RehearsalForm({
  initialData,
  onSubmit,
}: {
  initialData?: Rehearsal;
  onSubmit: (data: RehearsalFormData) => void;
}) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.repeat?.enabled &&
      (!formData.repeat.endDate ||
        isBefore(formData.repeat.endDate, formData.date))
    ) {
      toast.error(
        "Veuillez vérifier la date de fin de la répétition périodique",
      );
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Intitulé</Label>
          <Input
            id="name"
            placeholder="Ex: Répétition Générale"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="group">Groupe concerné</Label>
          <Select
            value={formData.group_type}
            onValueChange={(val: GroupType) =>
              setFormData({ ...formData, group_type: val })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  format(formData.date, "dd MMMM yyyy", { locale: fr })
                ) : (
                  <span>Choisir...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(d) => d && setFormData({ ...formData, date: d })}
                autoFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="place">Lieu</Label>
          <Input
            id="place"
            value={formData.place}
            onChange={(e) =>
              setFormData({ ...formData, place: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start">Début</Label>
          <Input
            id="start"
            type="time"
            value={formData.start_time}
            onChange={(e) =>
              setFormData({ ...formData, start_time: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end">Fin</Label>
          <Input
            id="end"
            type="time"
            value={formData.end_time}
            onChange={(e) =>
              setFormData({ ...formData, end_time: e.target.value })
            }
            required
          />
        </div>
      </div>

      {!isEditing && (
        <div className="bg-muted/40 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="text-muted-foreground h-4 w-4" />
              <Label htmlFor="repeat-switch" className="cursor-pointer">
                Répétition périodique
              </Label>
            </div>
            <Switch
              id="repeat-switch"
              checked={formData.repeat?.enabled}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  repeat: {
                    enabled: checked,
                    interval: formData.repeat?.interval || 1,
                    endDate: formData.repeat?.endDate || null,
                  },
                })
              }
            />
          </div>

          {formData.repeat?.enabled && (
            <div className="animate-in fade-in slide-in-from-top-2 mt-4 space-y-4">
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fréquence</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      Toutes les
                    </span>
                    <Input
                      type="number"
                      min="1"
                      className="w-16 text-center"
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
                    />
                    <span className="text-muted-foreground text-sm">
                      semaines
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Jusqu'au</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "bg-background w-full justify-start text-left font-normal",
                          !formData.repeat.endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.repeat.endDate ? (
                          format(formData.repeat.endDate, "dd MMM yyyy", {
                            locale: fr,
                          })
                        ) : (
                          <span>Date de fin...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.repeat.endDate || undefined}
                        onSelect={(d) =>
                          d &&
                          setFormData({
                            ...formData,
                            repeat: { ...formData.repeat!, endDate: d },
                          })
                        }
                        disabled={(d) => isAfter(formData.date, d)}
                        autoFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Button type="submit" className="w-full">
        {initialData ? "Enregistrer les modifications" : "Créer la répétition"}
      </Button>
    </form>
  );
}
