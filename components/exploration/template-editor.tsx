"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { FieldFormDialog } from "@/components/exploration/field-form-dialog";
import type {
  ExplorationSection,
  TemplateField,
  WidgetsConfig,
} from "@/lib/types";

const API_SLUG = "facial-exploration";

function titleToId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

interface TemplateData {
  name: string;
  slug: string;
  description: string;
  sections: ExplorationSection[];
  widgets: WidgetsConfig;
}

export function TemplateEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [localSections, setLocalSections] = useState<ExplorationSection[]>([]);
  const [localWidgets, setLocalWidgets] = useState<WidgetsConfig>({});

  // Section dialog
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<{
    index: number;
    title: string;
  } | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionIdError, setSectionIdError] = useState("");

  // Field dialog
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [fieldSectionIndex, setFieldSectionIndex] = useState(0);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);

  // Delete confirmations
  const [deleteSectionIndex, setDeleteSectionIndex] = useState<number | null>(
    null,
  );
  const [deleteFieldKey, setDeleteFieldKey] = useState<string | null>(null);
  const [deleteFieldSectionIndex, setDeleteFieldSectionIndex] =
    useState<number | null>(null);

  // ─── Fetch on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const res = await fetch(
          `/api/exploration-templates/${API_SLUG}`,
        );
        if (!res.ok) throw new Error("Error al cargar la plantilla");
        const data = await res.json();
        // SLUG route wraps in { template }, LIST route returns flat — handle both
        const tpl = data.template ?? data;
        if (!tpl?.config) throw new Error("Template config not found");

        const config =
          typeof tpl.config === "string"
            ? JSON.parse(tpl.config)
            : tpl.config;

        setTemplate({
          name: tpl.name,
          slug: tpl.slug,
          description: tpl.description,
          sections: config.sections ?? [],
          widgets: config.widgets ?? {},
        });
        setLocalSections(config.sections ?? []);
        setLocalWidgets(config.widgets ?? {});
      } catch (err) {
        toast.error("Error al cargar la plantilla");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, []);

  // ─── Section handlers ────────────────────────────────────────────────────

  const openAddSection = () => {
    setEditingSection(null);
    setSectionTitle("");
    setSectionIdError("");
    setSectionDialogOpen(true);
  };

  const openEditSection = (index: number) => {
    setEditingSection({ index, title: localSections[index].title });
    setSectionTitle(localSections[index].title);
    setSectionIdError("");
    setSectionDialogOpen(true);
  };

  const handleSaveSection = () => {
    const title = sectionTitle.trim();
    if (!title) return;

    const id = titleToId(title);
    const existingIds = localSections.map((s, i) =>
      editingSection ? (i === editingSection.index ? null : s.id) : s.id,
    ).filter(Boolean) as string[];

    if (existingIds.includes(id)) {
      setSectionIdError("Ya existe una sección con esta ID");
      return;
    }

    if (editingSection) {
      setLocalSections((prev) =>
        prev.map((s, i) =>
          i === editingSection.index ? { ...s, title } : s,
        ),
      );
    } else {
      setLocalSections((prev) => [
        ...prev,
        { id, title, fields: [] },
      ]);
    }
    setSectionDialogOpen(false);
  };

  const handleDeleteSection = (index: number) => {
    setLocalSections((prev) => prev.filter((_, i) => i !== index));
    setDeleteSectionIndex(null);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= localSections.length) return;
    setLocalSections((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  // ─── Field handlers ──────────────────────────────────────────────────────

  const openAddField = (sectionIndex: number) => {
    setFieldSectionIndex(sectionIndex);
    setEditingField(null);
    setFieldDialogOpen(true);
  };

  const openEditField = (sectionIndex: number, field: TemplateField) => {
    setFieldSectionIndex(sectionIndex);
    setEditingField(field);
    setFieldDialogOpen(true);
  };

  const handleSaveField = (
    fieldData: Omit<TemplateField, "sortOrder">,
  ) => {
    setLocalSections((prev) =>
      prev.map((section, si) => {
        if (si !== fieldSectionIndex) return section;

        if (editingField) {
          return {
            ...section,
            fields: section.fields.map((f) =>
              f.key === editingField.key
                ? { ...f, ...fieldData, sortOrder: f.sortOrder }
                : f,
            ),
          };
        }

        const maxSort =
          section.fields.length > 0
            ? Math.max(...section.fields.map((f) => f.sortOrder))
            : 0;
        return {
          ...section,
          fields: [
            ...section.fields,
            { ...fieldData, sortOrder: maxSort + 1 },
          ],
        };
      }),
    );
  };

  const handleDeleteField = () => {
    if (deleteFieldKey === null || deleteFieldSectionIndex === null) return;
    setLocalSections((prev) =>
      prev.map((section, si) =>
        si === deleteFieldSectionIndex
          ? {
              ...section,
              fields: section.fields.filter(
                (f) => f.key !== deleteFieldKey,
              ),
            }
          : section,
      ),
    );
    setDeleteFieldKey(null);
    setDeleteFieldSectionIndex(null);
  };

  const moveField = (
    sectionIndex: number,
    fieldIndex: number,
    direction: -1 | 1,
  ) => {
    setLocalSections((prev) => {
      const next = [...prev];
      const section = { ...next[sectionIndex] };
      const fields = [...section.fields];
      const newIndex = fieldIndex + direction;
      if (newIndex < 0 || newIndex >= fields.length) return prev;

      // Swap sortOrder
      const tempSort = fields[fieldIndex].sortOrder;
      fields[fieldIndex] = {
        ...fields[fieldIndex],
        sortOrder: fields[newIndex].sortOrder,
      };
      fields[newIndex] = {
        ...fields[newIndex],
        sortOrder: tempSort,
      };

      // Swap positions
      [fields[fieldIndex], fields[newIndex]] = [
        fields[newIndex],
        fields[fieldIndex],
      ];
      section.fields = fields;
      next[sectionIndex] = section;
      return next;
    });
  };

  const toggleFieldActive = (
    sectionIndex: number,
    fieldKey: string,
  ) => {
    setLocalSections((prev) =>
      prev.map((section, si) =>
        si === sectionIndex
          ? {
              ...section,
              fields: section.fields.map((f) =>
                f.key === fieldKey
                  ? { ...f, isActive: !(f.isActive ?? true) }
                  : f,
              ),
            }
          : section,
      ),
    );
  };

  // ─── Widget handlers ─────────────────────────────────────────────────────

  const toggleWidget = (widget: keyof WidgetsConfig) => {
    setLocalWidgets((prev) => ({
      ...prev,
      [widget]: !prev[widget],
    }));
  };

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      const body = {
        name: template.name,
        slug: template.slug,
        description: template.description,
        config: {
          sections: localSections,
          widgets: localWidgets,
        },
      };

      const res = await fetch(
        `/api/exploration-templates/${template.slug}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Plantilla guardada correctamente");
    } catch {
      toast.error("Error al guardar la plantilla");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No se pudo cargar la plantilla
        </CardContent>
      </Card>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Sections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Secciones</CardTitle>
          <Button size="sm" onClick={openAddSection}>
            <Plus className="mr-1 size-4" />
            Agregar sección
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {localSections.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay secciones. Agregá una para empezar.
            </p>
          )}

          {localSections.map((section, si) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base font-medium">
                  {section.title}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditSection(si)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={si === 0}
                    onClick={() => moveSection(si, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={si === localSections.length - 1}
                    onClick={() => moveSection(si, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteSectionIndex(si)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-2">
                {section.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Sin campos
                  </p>
                )}

                {[...section.fields]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((field, fi) => {
                    const isActive = field.isActive ?? true;
                    return (
                      <div
                        key={field.key}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-2.5",
                          !isActive && "opacity-50",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() =>
                              toggleFieldActive(si, field.key)
                            }
                            className="shrink-0"
                          />
                          <span className="text-sm truncate">
                            {field.label}
                          </span>
                          <Badge variant="secondary" className="shrink-0">
                            {field.type}
                          </Badge>
                          {field.system && (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-muted-foreground"
                            >
                              Sistema
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => openEditField(si, field)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={fi === 0}
                            onClick={() => moveField(si, fi, -1)}
                          >
                            <ChevronUp className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={fi === section.fields.length - 1}
                            onClick={() => moveField(si, fi, 1)}
                          >
                            <ChevronDown className="size-3.5" />
                          </Button>
                          {!field.system && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => {
                                setDeleteFieldSectionIndex(si);
                                setDeleteFieldKey(field.key);
                              }}
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => openAddField(si)}
                >
                  <Plus className="mr-1 size-4" />
                  Agregar campo
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Widgets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Widgets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="widget-facial">Diagrama Facial</Label>
            <Switch
              id="widget-facial"
              checked={localWidgets.facialDiagram ?? false}
              onCheckedChange={() => toggleWidget("facialDiagram")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="widget-photo">Captura de Fotos</Label>
            <Switch
              id="widget-photo"
              checked={localWidgets.photoCapture ?? false}
              onCheckedChange={() => toggleWidget("photoCapture")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Spinner className="mr-2" />}
          Guardar
        </Button>
      </div>

      {/* ─── Section Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSection ? "Editar sección" : "Agregar sección"}
            </DialogTitle>
            <DialogDescription>
              {editingSection
                ? "Modificá el nombre de la sección"
                : "Ingresá el nombre de la nueva sección"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="section-title"
                value={sectionTitle}
                onChange={(e) => {
                  setSectionTitle(e.target.value);
                  setSectionIdError("");
                }}
                placeholder="Ej: Biotipo Cutáneo"
              />
            </div>
            {!editingSection && sectionTitle && (
              <p className="text-xs text-muted-foreground">
                ID: {titleToId(sectionTitle)}
              </p>
            )}
            {sectionIdError && (
              <p className="text-sm text-destructive">{sectionIdError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSectionDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveSection} disabled={!sectionTitle.trim()}>
              {editingSection ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Field Dialog ──────────────────────────────────────────────── */}
      <FieldFormDialog
        open={fieldDialogOpen}
        onOpenChange={setFieldDialogOpen}
        field={editingField}
        existingKeys={
          localSections[fieldSectionIndex]?.fields.map((f) => f.key) ?? []
        }
        onSave={handleSaveField}
      />

      {/* ─── Delete Section Confirm ────────────────────────────────────── */}
      <AlertDialog
        open={deleteSectionIndex !== null}
        onOpenChange={(open) => !open && setDeleteSectionIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sección</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás segura de que querés eliminar esta sección y todos sus
              campos? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteSectionIndex !== null &&
                handleDeleteSection(deleteSectionIndex)
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Field Confirm ──────────────────────────────────────── */}
      <AlertDialog
        open={deleteFieldKey !== null}
        onOpenChange={(open) => !open && setDeleteFieldKey(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar campo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás segura de que querés eliminar este campo? Los datos
              históricos se preservan, pero el campo dejará de mostrarse en
              nuevas exploraciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteField}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
