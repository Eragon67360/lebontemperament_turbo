"use client";

import { useDensity } from "@/components/DensityProvider";
import { PageHeader } from "@/components/layouts/PageHeader";
import { PageShell } from "@/components/layouts/PageShell";
import { AttentionDot, CountBadge } from "@/components/shell/NavBadge";
import { SidebarNav } from "@/components/shell/SidebarNav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorSummary } from "@/components/ui/error-summary";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label, OptionalMark, RequiredMark } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ProvenanceNote } from "@/components/ui/provenance-note";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Stepper } from "@/components/ui/stepper";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DENSITIES, type Density } from "@/lib/density";
import { buildNavSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  Info,
  Loader2,
  Mail,
  MoreHorizontal,
  Music2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore, type ReactNode } from "react";

const MEMBERS = [
  {
    name: "Lucie Bernard",
    email: "lucie.bernard@example.org",
    voice: "Soprane",
    status: "Actif",
    tone: "success" as StatusTone,
    selected: false,
  },
  {
    name: "Hugo Lefèvre",
    email: "hugo.lefevre@example.org",
    voice: "Ténor",
    status: "Invitation expirée",
    tone: "warning" as StatusTone,
    selected: true,
  },
  {
    name: "Camille Martin",
    email: "camille.martin@example.org",
    voice: "Alto",
    status: "Désactivé",
    tone: "neutral" as StatusTone,
    selected: false,
  },
];

const DENSITY_LABEL: Record<Density, string> = {
  comfortable: "Aérées",
  compact: "Compactes",
};

export function DesignSystemLab() {
  return (
    <PageShell
      title="Système de design"
      description="Chaque brique de l’atelier guidé, dans tous ses états, en clair et en sombre. Page de revue : elle n’existe pas en production."
      headerAction={<Switches />}
    >
      <div className="flex flex-col gap-10 pb-10">
        <Section
          id="couleurs"
          title="Couleurs"
          intro="Une seule couleur d’accent, des surfaces neutres, les couleurs sémantiques réservées au sens."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Swatch name="background" className="bg-background" />
            <Swatch name="card" className="bg-card" />
            <Swatch name="surface-sunken" className="bg-surface-sunken" />
            <Swatch name="border" className="bg-border" />
            <Swatch name="border-strong" className="bg-border-strong" />
            <Swatch name="muted-foreground" className="bg-muted-foreground" />
            <Swatch name="primary" className="bg-primary" />
            <Swatch name="primary-strong" className="bg-primary-strong" />
            <Swatch name="primary-soft" className="bg-primary-soft" />
            <Swatch
              name="success / soft"
              className="bg-success-soft text-success-foreground"
              label="Succès"
            />
            <Swatch
              name="warning / soft"
              className="bg-warning-soft text-warning-foreground"
              label="Attention"
            />
            <Swatch
              name="danger / soft"
              className="bg-danger-soft text-danger-foreground"
              label="Danger"
            />
            <Swatch
              name="info / soft"
              className="bg-info-soft text-info-foreground"
              label="Information"
            />
            <Swatch
              name="destructive"
              className="bg-destructive text-destructive-foreground"
              label="Supprimer"
            />
          </div>
        </Section>

        <Section
          id="typographie"
          title="Typographie"
          intro="Inter, cinq tailles : Titre, Section, Corps, Détail, Repère."
        >
          <div className="flex flex-col gap-3">
            <p className="text-title">Titre — Nouveau concert</p>
            <p className="text-section">Section — Le concert</p>
            <p className="text-body">
              Corps — Dès que vous l’enregistrez, le concert apparaît sur le
              site public dans « Prochains concerts ».
            </p>
            <p className="text-detail text-muted-foreground">
              Détail — Tel qu’il s’affichera sur le site, par exemple « Concert
              de Noël ».
            </p>
            <p className="text-note text-muted-foreground">
              Repère — Dernière connexion il y a 3 jours
            </p>
          </div>
        </Section>

        <Section
          id="boutons"
          title="Boutons"
          intro="Un seul bouton plein par écran. Le rouge plein n’apparaît que pour confirmer dans une boîte de dialogue."
        >
          <div className="flex flex-col gap-6">
            <Row label="Variantes">
              <Button>Créer le concert</Button>
              <Button variant="outline">Inviter</Button>
              <Button variant="secondary">Secondaire</Button>
              <Button variant="ghost">Annuler</Button>
              <Button variant="link">Voir le site public</Button>
              <Button variant="destructive-outline">
                <Trash2 /> Désactiver
              </Button>
              <Button variant="destructive">Supprimer définitivement</Button>
            </Row>
            <Row label="Avec icône et tailles">
              <Button size="lg">
                <Plus /> Grand
              </Button>
              <Button>
                <RefreshCw /> Synchroniser avec la liste
              </Button>
              <Button size="sm" variant="outline">
                <UserPlus /> Petit
              </Button>
              <Button size="icon" variant="outline" aria-label="Modifier">
                <Pencil />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Plus d’actions"
              >
                <MoreHorizontal />
              </Button>
            </Row>
            <Row label="États">
              <Button data-lab-focus>Focus (clavier)</Button>
              <Button disabled>Désactivé</Button>
              <Button variant="outline" disabled>
                Désactivé
              </Button>
              <Button aria-busy disabled>
                <Loader2 className="animate-spin motion-reduce:animate-none" />
                Enregistrement…
              </Button>
            </Row>
          </div>
        </Section>

        <Section
          id="champs"
          title="Champs"
          intro="Même hauteur, même rayon (10 px), même bordure pour les champs, les zones de texte et les listes déroulantes. L’erreur se lit sous le champ et dans le résumé en haut du formulaire."
        >
          <FieldsDemo />
        </Section>

        <Section
          id="badges"
          title="Badges et statuts"
          intro="Le mot porte le sens ; la couleur le renforce. Le point évite de reposer sur la couleur seule."
        >
          <div className="flex flex-col gap-4">
            <Row label="Badge">
              <Badge>4</Badge>
              <Badge variant="secondary">Soprane</Badge>
              <Badge variant="outline">vous</Badge>
              <Badge variant="accent">Programme</Badge>
              <Badge variant="success">Publié</Badge>
              <Badge variant="warning">Diffère de la liste</Badge>
              <Badge variant="danger">À régler</Badge>
              <Badge variant="info">Brouillon</Badge>
              <Badge variant="destructive">Supprimé</Badge>
            </Row>
            <Row label="StatusBadge">
              <StatusBadge tone="success">Actif</StatusBadge>
              <StatusBadge tone="warning">Invitation expirée</StatusBadge>
              <StatusBadge tone="danger">Compte bloqué</StatusBadge>
              <StatusBadge tone="info">Invitation envoyée</StatusBadge>
              <StatusBadge tone="neutral">Désactivé</StatusBadge>
              <StatusBadge tone="accent">Administratrice</StatusBadge>
            </Row>
          </div>
        </Section>

        <Section
          id="cartes"
          title="Cartes"
          intro="Rayon 14 px, bordure, ombre légère, pas de dégradé ni de liseré coloré."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Synchronisation avec la liste des membres</CardTitle>
                <CardDescription>
                  Dernière vérification il y a 6 jours · 4 changements à
                  vérifier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Stepper
                  aria-label="Les trois étapes de la synchronisation"
                  current={1}
                  steps={[
                    {
                      label: "Vérifier",
                      description:
                        "Nous comparons la liste aux comptes. Rien n’est modifié.",
                    },
                    {
                      label: "Choisir",
                      description:
                        "Vous cochez ce qui doit changer, ligne par ligne.",
                    },
                    {
                      label: "Appliquer",
                      description:
                        "Invitations, mises à jour et désactivations, en une fois.",
                    },
                  ]}
                />
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline">Revenir</Button>
                <Button>Continuer</Button>
              </CardFooter>
            </Card>
            <Card className="border-danger/40">
              <CardHeader>
                <CardTitle>Actions sensibles</CardTitle>
                <CardDescription>
                  Chaque action est confirmée et nomme la personne concernée.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Désactiver le compte</p>
                    <p className="text-note text-muted-foreground">
                      Lucie ne pourra plus se connecter ; réversible.
                    </p>
                  </div>
                  <DestructiveDialogDemo />
                </div>
                <Separator />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Supprimer définitivement</p>
                    <p className="text-note text-muted-foreground">
                      Réservé au superadmin : la suppression est irréversible.
                    </p>
                  </div>
                  <Button variant="destructive-outline" disabled>
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          id="overlays"
          title="Boîtes de dialogue, panneaux, menus"
          intro="Rayon 20 px pour les dialogues ; Annuler à gauche, l’action principale à droite."
        >
          <Row label="Ouvrir">
            <DialogDemo />
            <DestructiveDialogDemo label="Boîte de confirmation" />
            <FormDialogDemo />
            <SheetDemo />
            <DropdownDemo />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Informations"
                  >
                    <Info />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Infobulle : une précision courte
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Row>
        </Section>

        <Section
          id="onglets"
          title="Onglets"
          intro="Un contrôle segmenté ; l’onglet actif en teal doux."
        >
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">À venir</TabsTrigger>
              <TabsTrigger value="past">Passés</TabsTrigger>
              <TabsTrigger value="drafts" disabled>
                Brouillons
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="upcoming"
              className="text-detail text-muted-foreground"
            >
              3 concerts à venir.
            </TabsContent>
            <TabsContent
              value="past"
              className="text-detail text-muted-foreground"
            >
              41 concerts passés.
            </TabsContent>
          </Tabs>
        </Section>

        <Section
          id="table"
          title="Tableau"
          intro="En-tête en creux, lignes à la hauteur de la densité choisie (56 ou 44 px), ligne sélectionnée teintée."
        >
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-11">
                    <Checkbox
                      checked="indeterminate"
                      aria-label="Sélectionner les 3 membres affichés"
                    />
                  </TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Voix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MEMBERS.map((member) => (
                  <TableRow
                    key={member.email}
                    data-state={member.selected ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={member.selected}
                        aria-label={`Sélectionner ${member.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="text-note">
                            {initials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{member.name}</p>
                          <p className="text-note text-muted-foreground truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.voice}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={member.tone}>
                        {member.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions pour ${member.name}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Section>

        <Section
          id="messages"
          title="Messages"
          intro="Alerte en ligne, encadré avec actions, résumé d’erreurs."
        >
          <div className="flex flex-col gap-4">
            <Alert>
              <Info />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                La liste est relue chaque nuit ; vous pouvez aussi la vérifier
                maintenant.
              </AlertDescription>
            </Alert>
            <Alert variant="success">
              <Info />
              <AlertTitle>Concert publié</AlertTitle>
              <AlertDescription>
                Il apparaît dans « Prochains concerts » sur le site public.
              </AlertDescription>
            </Alert>
            <Alert variant="warning">
              <Info />
              <AlertTitle>Lieu manquant</AlertTitle>
              <AlertDescription>
                Le public lira le titre sans savoir où aller.
              </AlertDescription>
            </Alert>
            <Alert variant="danger">
              <Info />
              <AlertTitle>La synchronisation a échoué</AlertTitle>
              <AlertDescription>
                La liste n’a pas pu être lue. Vérifiez le partage du fichier,
                puis réessayez.
              </AlertDescription>
            </Alert>
            <Callout
              tone="warning"
              title="1 différence avec la liste des membres"
              actions={
                <>
                  <Button>Appliquer la valeur de la liste : Alto</Button>
                  <Button variant="outline">
                    Garder « Soprane » et ignorer
                  </Button>
                </>
              }
            >
              <p>
                La liste de l’association indique une autre voix que le compte
                de Lucie. Choisissez la valeur à garder ; rien ne change avant.
              </p>
            </Callout>
            <Callout tone="info" title="Comment fonctionne l’invitation ?">
              <p>
                La personne reçoit un e-mail avec un lien valable 7 jours. Passé
                ce délai, renvoyez l’invitation depuis sa fiche.
              </p>
            </Callout>
            <Callout tone="success" title="4 changements appliqués">
              <p>
                2 invitations envoyées, 1 voix mise à jour, 1 compte désactivé.
              </p>
            </Callout>
            <Callout tone="danger" title="Impossible de joindre le serveur">
              <p>
                Vos modifications ne sont pas enregistrées. Vérifiez votre
                connexion, puis réessayez.
              </p>
            </Callout>
            <ErrorSummary
              autoFocus={false}
              title="3 champs à corriger avant de créer le concert"
              errors={[
                {
                  fieldId: "lab-date",
                  label: "Date",
                  message: "la date est passée.",
                },
                {
                  fieldId: "lab-place",
                  label: "Lieu",
                  message: "indiquez le nom de la salle ou de l’église.",
                },
                {
                  fieldId: "lab-ticket",
                  label: "Lien de billetterie",
                  message: "le lien doit commencer par https://.",
                },
              ]}
            />
          </div>
        </Section>

        <Section
          id="etats"
          title="États de données"
          intro="Vide : quoi, pourquoi, première action. Erreur : ce qui a échoué, quoi faire, réessayer."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <EmptyState
                icon={Music2}
                title="Aucun concert à venir"
                description="Les concerts que vous créez ici apparaissent sur le site public."
                action={
                  <Button>
                    <Plus /> Créer le premier concert
                  </Button>
                }
              />
            </Card>
            <Card>
              <ErrorState
                description="La liste des membres n’a pas pu être chargée. Vérifiez votre connexion, puis réessayez."
                onRetry={() => {}}
              />
            </Card>
            <Card className="p-4">
              <ListSkeleton rows={3} />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          </div>
        </Section>

        <Section
          id="divers"
          title="Divers"
          intro="Avatar, progression, provenance, fil d’Ariane."
        >
          <div className="flex flex-col gap-5">
            <Row label="Avatar">
              <Avatar>
                <AvatarFallback>LB</AvatarFallback>
              </Avatar>
              <Avatar className="size-9">
                <AvatarFallback className="text-note">CM</AvatarFallback>
              </Avatar>
            </Row>
            <Row label="Progression">
              <div className="w-64">
                <Progress value={62} aria-label="Synchronisation : 62 %" />
              </div>
              <span className="text-note text-muted-foreground">
                62 % · 79 fiches sur 127
              </span>
            </Row>
            <Row label="Provenance">
              <div>
                <p className="text-[15px]">
                  12 rue des Fleurs, 67000 Strasbourg
                </p>
                <ProvenanceNote>
                  Mis à jour depuis la liste des membres le 2 septembre ·
                  lecture seule ici
                </ProvenanceNote>
              </div>
              <div>
                <p className="text-[15px]">06 00 00 00 00</p>
                <ProvenanceNote icon={User}>
                  Modifiable par Lucie depuis son profil
                </ProvenanceNote>
              </div>
            </Row>
            <Row label="Fil d’Ariane">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Tableau de bord</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Membres et accès</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Membres</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </Row>
          </div>
        </Section>

        <Section
          id="entete"
          title="En-tête de page"
          intro="Vous êtes ici, titre, une phrase, l’action principale et l’aide repliée."
        >
          <Card className="p-4 sm:p-6">
            <PageHeader
              as="h2"
              trail={[
                { label: "Membres et accès", href: "#" },
                { label: "Membres", href: "#" },
                { label: "Lucie Bernard" },
              ]}
              title="Membres"
              intro="127 membres ont un compte. La liste des membres de l’association fait référence : synchronisez-la pour inviter les nouveaux arrivants."
              actions={
                <>
                  <Button variant="outline">
                    <UserPlus /> Inviter
                  </Button>
                  <Button>
                    <RefreshCw /> Synchroniser avec la liste{" "}
                    <Badge className="bg-primary-foreground/20 min-h-5 px-1.5 text-xs">
                      4
                    </Badge>
                  </Button>
                </>
              }
              help={
                <ol>
                  <li>
                    <strong>Vérifier</strong> : nous lisons la liste et la
                    comparons aux comptes. Rien n’est écrit.
                  </li>
                  <li>
                    <strong>Choisir</strong> : vous cochez les changements à
                    appliquer, ligne par ligne.
                  </li>
                  <li>
                    <strong>Appliquer</strong> : les invitations partent, les
                    fiches sont mises à jour.
                  </li>
                </ol>
              }
            />
          </Card>
        </Section>

        <Section
          id="navigation"
          title="Navigation"
          intro="La barre latérale du shell : six sections avec leur phrase, une seule ouverte à la fois, l’entrée courante marquée, les compteurs."
        >
          <div className="flex flex-wrap items-start gap-6">
            <Card className="bg-sidebar w-[280px] max-w-full p-3">
              <SidebarNav
                label="Aperçu de la navigation"
                sections={buildNavSections({
                  isSuperAdmin: true,
                  unreadBugReports: 1,
                })}
              />
            </Card>
            <Row label="Compteurs">
              <div className="flex items-center gap-4">
                <CountBadge count={2} />
                <CountBadge count={120} />
                <CountBadge count={3} size="sm" />
                <AttentionDot />
              </div>
            </Row>
          </div>
        </Section>

        <Section
          id="barre"
          title="Barre d’actions collante"
          intro="En bas du formulaire : l’action principale ne quitte jamais l’écran."
        >
          <Card className="h-64 overflow-y-auto">
            <div className="space-y-3 p-4 sm:p-6">
              {Array.from({ length: 6 }, (_, index) => (
                <p key={index} className="text-detail text-muted-foreground">
                  Faites défiler : la barre reste visible au bas de cette zone,
                  comme au bas d’une page.
                </p>
              ))}
            </div>
            <StickyActionBar
              note="Rien n’est publié avant ce bouton."
              secondary={
                <Button variant="ghost">Annuler et revenir aux concerts</Button>
              }
            >
              <Button>Créer le concert</Button>
            </StickyActionBar>
          </Card>
        </Section>
      </div>
    </PageShell>
  );
}

function Switches() {
  const { theme, setTheme } = useTheme();
  const { density, setDensity } = useDensity();
  // next-themes only knows the stored theme after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const current = mounted ? (theme ?? "light") : "light";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Segmented label="Thème">
        {(["light", "dark"] as const).map((value) => (
          <SegmentedButton
            key={value}
            pressed={current === value}
            onClick={() => setTheme(value)}
          >
            {value === "light" ? "Clair" : "Sombre"}
          </SegmentedButton>
        ))}
      </Segmented>
      <Segmented label="Listes">
        {DENSITIES.map((value) => (
          <SegmentedButton
            key={value}
            pressed={density === value}
            onClick={() => setDensity(value)}
          >
            {DENSITY_LABEL[value]}
          </SegmentedButton>
        ))}
      </Segmented>
    </div>
  );
}

function Segmented({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-detail text-muted-foreground">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="border-input bg-card inline-flex gap-0.5 rounded-sm border p-0.5"
      >
        {children}
      </div>
    </div>
  );
}

function SegmentedButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "text-note text-muted-foreground hover:text-foreground min-h-9 rounded-[4px] px-2.5 font-medium transition-colors motion-reduce:transition-none",
        pressed && "bg-primary-soft text-primary-text",
      )}
    >
      {children}
    </button>
  );
}

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="flex flex-col gap-4"
    >
      <div className="max-w-[64ch]">
        <h2 id={`${id}-h`} className="text-section">
          {title}
        </h2>
        <p className="text-detail text-muted-foreground mt-1">{intro}</p>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-note text-muted-foreground font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Swatch({
  name,
  className,
  label,
}: {
  name: string;
  className: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "border-border text-note grid h-14 place-items-center rounded-md border font-medium",
          className,
        )}
      >
        {label}
      </div>
      <p className="text-note text-muted-foreground">{name}</p>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function FieldsDemo() {
  const [agree, setAgree] = useState(true);
  const [notify, setNotify] = useState(false);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="lab-title">
          Titre
          <RequiredMark />
        </Label>
        <Input
          id="lab-title"
          defaultValue="Entre terre et ciel"
          aria-describedby="lab-title-hint"
        />
        <p id="lab-title-hint" className="text-detail text-muted-foreground">
          Tel qu’il s’affichera sur le site.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="lab-place">
          Lieu
          <RequiredMark />
        </Label>
        <Input
          id="lab-place"
          placeholder="Église Saint-Paul"
          aria-invalid
          aria-describedby="lab-place-err"
        />
        <p
          id="lab-place-err"
          className="text-detail text-danger-foreground font-medium"
        >
          Indiquez le lieu : le nom de la salle ou de l’église.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="lab-date">
          Date
          <RequiredMark />
        </Label>
        <Input id="lab-date" defaultValue="15/09/2026" aria-invalid />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="lab-disabled">Référence</Label>
        <Input id="lab-disabled" value="CONC-2026-014" disabled readOnly />
        <p className="text-detail text-muted-foreground">
          Attribuée automatiquement.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="lab-tour">
          Tournée
          <OptionalMark />
        </Label>
        <Select defaultValue="none">
          <SelectTrigger id="lab-tour">
            <SelectValue placeholder="Choisir une tournée" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune</SelectItem>
            <SelectItem value="autumn">Tournée d’automne 2026</SelectItem>
            <SelectItem value="spring" disabled>
              Tournée de printemps (terminée)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="lab-ticket">
          Lien de billetterie
          <OptionalMark />
        </Label>
        <Input
          id="lab-ticket"
          type="url"
          defaultValue="billetterie.example.org/concert"
          aria-invalid
        />
        <p className="text-detail text-danger-foreground font-medium">
          Le lien doit commencer par https://
        </p>
      </div>
      <div className="grid gap-1.5 md:col-span-2">
        <Label htmlFor="lab-infos">
          Informations complémentaires
          <OptionalMark />
        </Label>
        <Textarea
          id="lab-infos"
          defaultValue="Entrée libre, plateau au profit de l’association."
        />
        <p className="text-detail text-muted-foreground">
          Tarifs, entrée libre, programme… Quelques lignes suffisent.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
          <Checkbox
            checked={agree}
            onCheckedChange={(value) => setAgree(value === true)}
          />
          Publier sur le site public
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
          <Checkbox checked="indeterminate" aria-label="Sélection partielle" />
          Sélection partielle
        </label>
        <label className="text-muted-foreground flex min-h-11 items-center gap-3 text-[15px]">
          <Checkbox disabled checked />
          Désactivé
        </label>
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
          <Switch checked={notify} onCheckedChange={setNotify} />
          Prévenir les membres par e-mail
        </label>
        <label className="text-muted-foreground flex min-h-11 items-center gap-3 text-[15px]">
          <Switch disabled checked />
          Désactivé
        </label>
      </div>
    </div>
  );
}

function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Boîte de dialogue</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le rôle de Lucie Bernard</DialogTitle>
          <DialogDescription>
            Une administratrice peut gérer les concerts, les membres et les
            documents.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="lab-role">Nouveau rôle</Label>
          <Select defaultValue="member">
            <SelectTrigger id="lab-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Membre</SelectItem>
              <SelectItem value="admin">Administratrice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button>Enregistrer le rôle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A form in a dialog: closing it with a changed field asks first. */
function FormDialogDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Formulaire en dialogue
      </Button>
      <FormDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setValue("");
        }}
        title="Ajouter un chiffre clé"
        description="Modifiez le champ, puis fermez : la boîte demande avant d’abandonner."
        formId="lab-form-dialog"
        isDirty={value !== ""}
        submitLabel="Ajouter"
      >
        <form
          id="lab-form-dialog"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            setValue("");
          }}
          className="grid gap-1.5"
        >
          <Label htmlFor="lab-form-dialog-number">Chiffre</Label>
          <Input
            id="lab-form-dialog-number"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="40"
          />
        </form>
      </FormDialog>
    </>
  );
}

function DestructiveDialogDemo({ label = "Désactiver" }: { label?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive-outline">{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Désactiver le compte de Lucie Bernard ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Lucie ne pourra plus se connecter au site ni à l’application et
            disparaîtra de l’annuaire. Ses documents restent. Vous pourrez
            réactiver le compte à tout moment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Désactiver le compte
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Panneau latéral</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Lucie Bernard</SheetTitle>
          <SheetDescription>
            Soprane · Jeune · membre depuis janvier 2026
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 text-[15px]">
          <p className="flex items-center gap-2">
            <Mail className="text-muted-foreground size-4" aria-hidden />{" "}
            lucie.bernard@example.org
          </p>
          <p className="flex items-center gap-2">
            <Users className="text-muted-foreground size-4" aria-hidden />{" "}
            Chœur, pupitre des sopranes
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DropdownDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Menu <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Lucie Bernard</DropdownMenuLabel>
        <DropdownMenuItem>
          <Mail /> Renvoyer l’invitation
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Pencil /> Modifier la fiche
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-danger-foreground focus:text-danger-foreground [&>svg]:text-danger">
          <Trash2 /> Désactiver
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
