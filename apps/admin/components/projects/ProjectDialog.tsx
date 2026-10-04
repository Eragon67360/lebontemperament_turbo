"use client";

import {
  DateField,
  TextareaField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { Label, OptionalMark } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { cloudinaryUrl } from "@/utils/anniversary/media";
import { parseIsoDate } from "@/utils/concerts/schedule";
import {
  projectFormSchema,
  slugify,
  type ProjectFormValues,
} from "@/utils/formSchemas";
import {
  firstTabWithError,
  STORY_FIELD_LABELS as LABELS,
  STORY_TAB_OF as TAB_OF,
  tabOfFieldId,
  uploadProgressLabel,
  type StoryFieldName as FieldName,
  type StoryTabId as TabId,
} from "@/utils/projects/form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Project } from "@repo/domain/types/projects";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";

const FORM_ID = "story-form";

const IMAGE_FIELDS = ["image", "banniere", "image2", "image3"] as const;
type ImageField = (typeof IMAGE_FIELDS)[number];
type FileState = Partial<Record<ImageField, File | null>>;

const defaults = (project?: Project): ProjectFormValues => ({
  name: project?.name ?? "",
  sub_name: project?.sub_name ?? "",
  slug: project?.slug ?? "",
  date:
    (project?.date ? parseIsoDate(project.date) : null) ?? (undefined as never),
  author_name: project?.author_name ?? "",
  explanation: project?.explanation ?? "",
  text1: project?.text1 ?? "",
  text2: project?.text2 ?? "",
  banniere_photographer_name: project?.banniere_photographer_name ?? "",
  banniere_photographer_url: project?.banniere_photographer_url ?? "",
  image2_photographer_name: project?.image2_photographer_name ?? "",
  image2_photographer_url: project?.image2_photographer_url ?? "",
  image3_photographer_name: project?.image3_photographer_name ?? "",
  image3_photographer_url: project?.image3_photographer_url ?? "",
});

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  const response = await fetch("/api/cloudinary-upload", {
    method: "POST",
    body,
  });
  if (!response.ok) throw new Error("L'image n'a pas pu être envoyée.");
  const data = (await response.json()) as { url?: string; public_id?: string };
  const path = data.url || data.public_id;
  if (!path) throw new Error("L'image n'a pas pu être envoyée.");
  return path;
}

export interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  /** The display order a new story gets. */
  nextOrder: number;
  /** Writes the story; throws when the server refuses. */
  onSubmit: (data: Partial<Project>) => Promise<void>;
  isPending: boolean;
}

/**
 * « Ajouter une histoire » / « Modifier « … » » in direction B: three
 * tabs (Général, Contenu, Images) on react-hook-form + zod, inline errors
 * with the summary (its links open the right tab), the unsaved-changes
 * guard, and the chosen images sent one by one on save with a progress
 * label.
 */
export function ProjectDialog({
  open,
  onOpenChange,
  project,
  nextOrder,
  onSubmit,
  isPending,
}: ProjectDialogProps) {
  const [tab, setTab] = useState<TabId>("general");
  const [files, setFiles] = useState<FileState>({});
  const [upload, setUpload] = useState<{ index: number; total: number } | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  // Images already sent during this opening: a retry after a failed upload
  // or save reuses them instead of sending the same file again.
  const [uploaded] = useState(
    () => new Map<ImageField, { file: File; path: string }>(),
  );

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: defaults(project),
    shouldFocusError: false,
  });

  useResetOnChange([open], () => {
    setSaveError(null);
    setFiles({});
    uploaded.clear();
    setTab("general");
  });
  useEffect(() => {
    if (open) form.reset(defaults(project));
  }, [open, project, form]);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const storedUrl = (field: ImageField) =>
    cloudinaryUrl(project?.[field], "image", cloudName);

  const hasFiles = Object.values(files).some(Boolean);
  const pendingLabel = upload
    ? uploadProgressLabel(upload.index, upload.total)
    : "Enregistrement…";

  const submit = async (values: ProjectFormValues) => {
    setSaveError(null);
    try {
      const chosen = IMAGE_FIELDS.filter((field) => files[field]);
      const paths: Partial<Record<ImageField, string>> = {};
      const toSend = chosen.filter(
        (field) => uploaded.get(field)?.file !== files[field],
      );
      for (const [i, field] of toSend.entries()) {
        setUpload({ index: i + 1, total: toSend.length });
        const file = files[field]!;
        const path = await uploadToCloudinary(
          file,
          `Site/concerts/${values.slug}`,
        );
        uploaded.set(field, { file, path });
      }
      for (const field of chosen) {
        paths[field] = uploaded.get(field)!.path;
      }
      setUpload(null);
      const data: Partial<Project> = {
        ...values,
        date: format(values.date, "yyyy-MM-dd"),
        sub_name: values.sub_name || null,
        author_name: values.author_name || null,
        explanation: values.explanation || null,
        text1: values.text1 || null,
        text2: values.text2 || null,
        banniere_photographer_name: values.banniere_photographer_name || null,
        banniere_photographer_url: values.banniere_photographer_url || null,
        image2_photographer_name: values.image2_photographer_name || null,
        image2_photographer_url: values.image2_photographer_url || null,
        image3_photographer_name: values.image3_photographer_name || null,
        image3_photographer_url: values.image3_photographer_url || null,
        ...paths,
      };
      if (!project) data.display_order = nextOrder;
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      setUpload(null);
      setSaveError(saveErrorMessage(error));
    }
  };

  const onInvalid = (errors: FieldErrors<ProjectFormValues>) => {
    const target = firstTabWithError(errors);
    if (target) setTab(target);
  };

  const errorCount = (id: TabId) =>
    (Object.keys(LABELS) as FieldName[]).filter(
      (name) => TAB_OF[name] === id && form.formState.errors[name],
    ).length;

  const tabLabel = (id: TabId, label: string) => {
    const count = form.formState.submitCount > 0 ? errorCount(id) : 0;
    return (
      <>
        {label}
        {count > 0 && (
          <span className="bg-danger-soft text-danger-foreground text-note ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 font-semibold">
            {count}
            <span className="sr-only">
              {" "}
              champ{count > 1 ? "s" : ""} à corriger
            </span>
          </span>
        )}
      </>
    );
  };

  const imageField = (
    field: ImageField,
    label: string,
    hint: string,
    photographer?: {
      name: Extract<FieldName, `${string}_photographer_name`>;
      url: Extract<FieldName, `${string}_photographer_url`>;
    },
  ) => (
    <div className="border-border space-y-4 rounded-md border p-4">
      <div className="space-y-2">
        <Label asChild>
          <span>
            {label}
            <OptionalMark />
          </span>
        </Label>
        <FileUpload
          onFileSelect={(file) =>
            setFiles((current) => ({ ...current, [field]: file }))
          }
          onFileClear={() =>
            setFiles((current) => ({ ...current, [field]: null }))
          }
          value={files[field]}
          currentImageUrl={storedUrl(field)}
          mode="image"
        />
        <p className="text-detail text-muted-foreground">{hint}</p>
      </div>
      {photographer && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name={photographer.name}
            id={LABELS[photographer.name].id}
            label="Photographe"
            placeholder="Prénom Nom"
            hint="Crédité sous l'image."
          />
          <TextField
            control={form.control}
            name={photographer.url}
            id={LABELS[photographer.url].id}
            label="Site du photographe"
            type="url"
            inputMode="url"
            placeholder="https://"
            hint="Le crédit n'apparaît sur le site qu'avec le nom et le site."
          />
        </div>
      )}
    </div>
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={project ? `Modifier « ${project.name} »` : "Ajouter une histoire"}
      description="Une histoire est la page d'un concert passé sur le site public : son récit, ses images et leurs crédits."
      formId={FORM_ID}
      isDirty={form.formState.isDirty || hasFiles}
      isPending={isPending || upload !== null}
      pendingLabel={pendingLabel}
      submitLabel={project ? "Enregistrer" : "Créer l'histoire"}
      className="lg:max-w-[880px]"
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(submit, onInvalid)}
          noValidate
          className="space-y-5"
        >
          <FormFeedback
            errors={form.formState.errors}
            labels={LABELS}
            submitCount={form.formState.submitCount}
            saveError={saveError}
            onSelect={(fieldId) => {
              const target = tabOfFieldId(fieldId);
              if (target) setTab(target);
            }}
          />

          <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)}>
            <TabsList
              className="w-full sm:w-auto"
              aria-label="Parties de l'histoire"
            >
              <TabsTrigger value="general" className="flex-1">
                {tabLabel("general", "Général")}
              </TabsTrigger>
              <TabsTrigger value="content" className="flex-1">
                {tabLabel("content", "Contenu")}
              </TabsTrigger>
              <TabsTrigger value="media" className="flex-1">
                {tabLabel("media", "Images")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="name"
                  id={LABELS.name.id}
                  label={LABELS.name.label}
                  required
                  placeholder="Concert de Noël"
                  hint="Le titre de la page sur le site."
                />
                <TextField
                  control={form.control}
                  name="sub_name"
                  id={LABELS.sub_name.id}
                  label={LABELS.sub_name.label}
                  placeholder="Édition 2024"
                  hint="Sous le titre, en plus petit."
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <TextField
                    control={form.control}
                    name="slug"
                    id={LABELS.slug.id}
                    label={LABELS.slug.label}
                    required
                    placeholder="concert-de-noel-2024"
                    hint={
                      project
                        ? "La fin de l'adresse lebontemperament.com/concerts/… Changer l'adresse casse les liens déjà partagés."
                        : "La fin de l'adresse lebontemperament.com/concerts/… Proposée depuis le nom."
                    }
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    onClick={() =>
                      form.setValue("slug", slugify(form.getValues("name")), {
                        shouldDirty: true,
                        shouldValidate: form.formState.submitCount > 0,
                      })
                    }
                  >
                    Proposer une adresse depuis le nom
                  </Button>
                </div>
                <DateField
                  control={form.control}
                  name="date"
                  id={LABELS.date.id}
                  label={LABELS.date.label}
                  required
                  hint="Le site classe les histoires par date."
                />
              </div>
              <TextField
                control={form.control}
                name="author_name"
                id={LABELS.author_name.id}
                label={LABELS.author_name.label}
                placeholder="Prénom Nom"
                hint="La personne qui a rédigé cette page."
              />
            </TabsContent>

            <TabsContent value="content" className="mt-5 space-y-5">
              <TextareaField
                control={form.control}
                name="explanation"
                id={LABELS.explanation.id}
                label={LABELS.explanation.label}
                rows={4}
                placeholder="Ce concert a réuni…"
                hint="En haut de la page, sous la bannière."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextareaField
                  control={form.control}
                  name="text1"
                  id={LABELS.text1.id}
                  label={LABELS.text1.label}
                  rows={8}
                  hint="À côté de la deuxième image."
                />
                <TextareaField
                  control={form.control}
                  name="text2"
                  id={LABELS.text2.id}
                  label={LABELS.text2.label}
                  rows={8}
                  hint="À côté de la troisième image."
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-5 space-y-5">
              <p className="text-detail text-muted-foreground">
                Les images sont envoyées à l&apos;enregistrement, une par une.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {imageField(
                  "image",
                  "Vignette",
                  "Dans la liste des histoires du site.",
                )}
                {imageField(
                  "banniere",
                  "Bannière",
                  "En haut de la page, en grand.",
                  {
                    name: "banniere_photographer_name",
                    url: "banniere_photographer_url",
                  },
                )}
                {imageField(
                  "image2",
                  "Deuxième image",
                  "À côté du premier texte.",
                  {
                    name: "image2_photographer_name",
                    url: "image2_photographer_url",
                  },
                )}
                {imageField(
                  "image3",
                  "Troisième image",
                  "À côté du second texte.",
                  {
                    name: "image3_photographer_name",
                    url: "image3_photographer_url",
                  },
                )}
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </FormDialog>
  );
}
