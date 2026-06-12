"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FlaskConical,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ExplorationPhoto {
  id: string;
  url: string;
  angle: string;
}

interface TemplateField {
  key: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  sortOrder: number;
}

interface ExplorationSection {
  id: string;
  title: string;
  fields: TemplateField[];
}

interface TemplateConfig {
  sections: ExplorationSection[];
  widgets?: {
    facialDiagram?: boolean;
    photoCapture?: boolean;
  };
}

interface ExplorationItem {
  id: string;
  date: string;
  skinEvaluation: Record<string, unknown> | null;
  facialAnalysis: Record<string, unknown> | null;
  responses: Record<string, unknown> | null;
  notes: string | null;
  templateId: string | null;
  templateConfig: TemplateConfig | null;
  photos: ExplorationPhoto[];
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ExplorationsTabProps {
  patientId: string;
  onNewExploration?: () => void;
}

// ─── Field value formatter ─────────────────────────────────────────────────────

function formatFieldValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return "—";
  if (type === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

// ─── Photo Grid ────────────────────────────────────────────────────────────────

function PhotoGrid({ photos }: { photos: ExplorationPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium mb-2 flex items-center gap-2">
        <ImageIcon className="size-4" />
        Fotos ({photos.length})
      </p>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square rounded-lg overflow-hidden bg-muted"
          >
            <img
              src={photo.url}
              alt={`Foto ${photo.angle}`}
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── V2 Exploration Detail ─────────────────────────────────────────────────────

function V2ExplorationDetail({
  templateConfig,
  responses,
  facialAnalysis,
}: {
  templateConfig: TemplateConfig;
  responses: Record<string, unknown>;
  facialAnalysis: Record<string, unknown> | null;
}) {
  return (
    <div className="space-y-4">
      {templateConfig.sections.map((section) => {
        const visibleFields = section.fields.filter(
          (f) => f.key in responses,
        );
        if (visibleFields.length === 0) return null;

        return (
          <Card key={section.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {visibleFields
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((field) => (
                    <div
                      key={field.key}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="text-muted-foreground min-w-32 shrink-0">
                        {field.label}
                      </span>
                      <span className="font-medium">
                        {formatFieldValue(responses[field.key], field.type)}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Facial analysis summary */}
      {facialAnalysis && Object.keys(facialAnalysis).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Análisis Facial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.entries(facialAnalysis).map(([area, analysis]) => {
                const a = analysis as Record<string, unknown>;
                return (
                  <div key={area} className="text-sm">
                    <span className="font-medium capitalize">
                      {area.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    {!!a.condition && (
                      <Badge
                        variant="secondary"
                        className="ml-2 text-xs capitalize"
                      >
                        {String(a.condition)}
                      </Badge>
                    )}
                    {!!a.notes && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {String(a.notes)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Legacy Exploration Detail ──────────────────────────────────────────────────

const SKIN_FIELD_LABELS: Record<string, string> = {
  skinType: "Tipo de Piel",
  skinCondition: "Condición",
  concerns: "Preocupaciones",
  elasticity: "Elasticidad",
  hydrationLevel: "Nivel de Hidratación",
  oilLevel: "Nivel de Grasitud",
  sensitivityLevel: "Sensibilidad",
  notes: "Notas",
};

function LegacyExplorationDetail({
  skinEvaluation,
  facialAnalysis,
}: {
  skinEvaluation: Record<string, unknown> | null;
  facialAnalysis: Record<string, unknown> | null;
}) {
  return (
    <div className="space-y-4">
      {skinEvaluation && Object.keys(skinEvaluation).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evaluación de la Piel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.entries(skinEvaluation).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-muted-foreground min-w-32 shrink-0">
                    {SKIN_FIELD_LABELS[key] ?? key}
                  </span>
                  <span className="font-medium">
                    {Array.isArray(value)
                      ? value.join(", ")
                      : String(value ?? "—")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {facialAnalysis && Object.keys(facialAnalysis).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Análisis Facial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {Object.entries(facialAnalysis).map(([area, analysis]) => {
                const a = analysis as Record<string, unknown>;
                return (
                  <div key={area}>
                    <p className="text-sm font-medium capitalize mb-1">
                      {area.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <div className="grid gap-1 text-sm text-muted-foreground">
                      {!!a.condition && (
                        <p>
                          Condición:{" "}
                          <span className="font-medium capitalize">
                            {String(a.condition)}
                          </span>
                        </p>
                      )}
                      {!!a.notes && <p>{String(a.notes)}</p>}
                      {!!a.recommendedTreatments &&
                        Array.isArray(a.recommendedTreatments) &&
                        a.recommendedTreatments.length > 0 && (
                          <p>
                            Tratamientos:{" "}
                            <span className="font-medium">
                              {(a.recommendedTreatments as string[]).join(", ")}
                            </span>
                          </p>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ExplorationsTab({
  patientId,
  onNewExploration,
}: ExplorationsTabProps) {
  const [explorations, setExplorations] = useState<ExplorationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchExplorations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/clinical-history`,
      );
      if (!res.ok) {
        let msg = "Error al cargar exploraciones";
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {
          // use default message
        }
        throw new Error(msg);
      }
      const data = await res.json();
      setExplorations(data.explorations ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar exploraciones",
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchExplorations();
  }, [fetchExplorations]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <AlertCircle className="size-12 text-destructive mb-4" />
          <h3 className="font-medium mb-2">Error al cargar exploraciones</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={fetchExplorations}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (explorations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Stethoscope className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">Sin exploraciones registradas</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          No hay exploraciones físicas registradas para este paciente.
        </p>
        <Button
          onClick={() => {
            if (onNewExploration) onNewExploration();
            else router.push(`/dashboard/exploration?patientId=${patientId}`);
          }}
        >
          <Stethoscope className="size-4 mr-2" />
          Nueva Exploración
        </Button>
      </div>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  const isV2 = (exp: ExplorationItem) =>
    exp.templateId && exp.responses && exp.templateConfig;

  const getPhotoCount = (exp: ExplorationItem) => exp.photos?.length ?? 0;

  const notesPreview = (notes: string | null) => {
    if (!notes) return "";
    return notes.length > 60 ? notes.slice(0, 60) + "..." : notes;
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {explorations.map((exp) => (
          <AccordionItem key={exp.id} value={exp.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-4 text-left">
                <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <FlaskConical className="size-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {format(
                        new Date(exp.date + "T00:00:00"),
                        "MMMM d, yyyy",
                      )}
                    </p>
                    {isV2(exp) ? (
                      <Badge variant="secondary" className="text-xs">
                        Plantilla
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Legacy
                      </Badge>
                    )}
                    {getPhotoCount(exp) > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {getPhotoCount(exp)} foto(s)
                      </Badge>
                    )}
                  </div>
                  {exp.notes && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notesPreview(exp.notes)}
                    </p>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-14 pr-4 pb-2 space-y-4">
                {isV2(exp) ? (
                  <V2ExplorationDetail
                    templateConfig={exp.templateConfig!}
                    responses={exp.responses!}
                    facialAnalysis={exp.facialAnalysis as Record<string, unknown> | null}
                  />
                ) : (
                  <LegacyExplorationDetail
                    skinEvaluation={
                      exp.skinEvaluation as Record<string, unknown> | null
                    }
                    facialAnalysis={
                      exp.facialAnalysis as Record<string, unknown> | null
                    }
                  />
                )}

                {/* Notes */}
                {exp.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="size-4" />
                        Notas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {exp.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Photos */}
                <PhotoGrid photos={exp.photos} />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Navigation button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          onClick={() => {
            if (onNewExploration) onNewExploration();
            else
              router.push(`/dashboard/exploration?patientId=${patientId}`);
          }}
        >
          <Stethoscope className="size-4 mr-2" />
          Nueva Exploración Física
        </Button>
      </div>
    </div>
  );
}
