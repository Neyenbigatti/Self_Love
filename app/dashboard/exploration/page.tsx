"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FacialAnalysisForm } from "@/components/exploration/facial-diagram";
import { SkinEvaluationForm } from "@/components/exploration/skin-evaluation";
import { PhotoCapture } from "@/components/exploration/photo-capture";
import { DynamicForm } from "@/components/exploration/dynamic-form";
import { toast } from "sonner";
import type { FacialAnalysis, ExplorationPhoto, SkinEvaluationData, TemplateConfig } from "@/lib/types";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientOption {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  dateOfBirth: string | null;
  totalVisits: number;
}

interface ExplorationResponse {
  id: string;
  patientId: string;
  professionalId: string;
  templateId: string | null;
  skinEvaluation: SkinEvaluationData | null;
  facialAnalysis: Partial<FacialAnalysis> | null;
  responses: Record<string, any> | null;
  notes: string | null;
  date: string;
  photos: ExplorationPhoto[];
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─── Notes Card (shared between v2 and legacy) ──────────────────────────────────

function NotesCard({ notes, onChange }: { notes: string; onChange: (v: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notas Clínicas</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ingresá notas clínicas..."
          rows={4}
        />
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PhysicalExplorationPage() {
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  // ── Patient state ──────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // ── Exploration state ──────────────────────────────────────────────────────
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    preselectedPatientId || "",
  );
  const [explorationId, setExplorationId] = useState<string | null>(null);
  const [explorationKey, setExplorationKey] = useState(0);
  const [isLoadingExploration, setIsLoadingExploration] = useState(false);
  const [explorationError, setExplorationError] = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("skin");
  const [facialAnalysis, setFacialAnalysis] = useState<Partial<FacialAnalysis>>({});
  const [skinEvaluation, setSkinEvaluation] = useState<SkinEvaluationData | object>({});
  const [photos, setPhotos] = useState<ExplorationPhoto[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Template / v2 state ────────────────────────────────────────────────────
  const [template, setTemplate] = useState<{ id: string; config: TemplateConfig } | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});

  const isV2Mode = template !== null;

  // ── Fetch patients on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/patients");
        if (!res.ok) throw new Error("Error al cargar pacientes");
        const data = await res.json();
        if (!cancelled) setPatients(data.patients ?? []);
      } catch (err) {
        if (!cancelled) {
          setPatientsError(
            err instanceof Error ? err.message : "Error al cargar pacientes",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingPatients(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch exploration + template when patient changes ──────────────────────
  useEffect(() => {
    if (!selectedPatientId) {
      resetForm();
      setIsLoadingExploration(false);
      setExplorationError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoadingExploration(true);
      setExplorationError(null);

      try {
        // Fetch exploration and templates in parallel
        const [expRes, templatesRes] = await Promise.all([
          fetch(
            `/api/explorations?patientId=${encodeURIComponent(selectedPatientId)}`,
          ),
          fetch("/api/exploration-templates").catch(() => null),
        ]);

        if (cancelled) return;

        if (!expRes.ok) throw new Error("Error al cargar exploración");
        const data = await expRes.json();

        const templates =
          templatesRes?.ok ? (await templatesRes.json()).templates ?? [] : [];

        if (data.explorations && data.explorations.length > 0) {
          const exp: ExplorationResponse = data.explorations[0];
          setExplorationId(exp.id);

          // v2 mode detection
          if (exp.templateId && exp.responses) {
            const activeTemplate = templates.find(
              (t: any) => t.id === exp.templateId,
            );
            if (activeTemplate) {
              setTemplate({
                id: activeTemplate.id,
                config: activeTemplate.config as TemplateConfig,
              });
            } else {
              setTemplate(null);
            }
            setResponses(exp.responses);
            setSkinEvaluation({});
            setFacialAnalysis(exp.facialAnalysis ?? {});
            setPhotos(exp.photos ?? []);
            setNotes(exp.notes ?? "");
          } else {
            // legacy mode
            setTemplate(null);
            setResponses({});
            setSkinEvaluation(exp.skinEvaluation ?? {});
            setFacialAnalysis(exp.facialAnalysis ?? {});
            setPhotos(exp.photos ?? []);
            setNotes(exp.notes ?? "");
          }
        } else {
          // No existing exploration — use default template for new explorations
          const defaultTemplate =
            templates.find((t: any) => t.slug === "facial-exploration") ??
            templates[0] ??
            null;
          if (defaultTemplate) {
            setTemplate({
              id: defaultTemplate.id,
              config: defaultTemplate.config as TemplateConfig,
            });
            setResponses({});
          } else {
            setTemplate(null);
            setResponses({});
          }
          setSkinEvaluation({});
          setFacialAnalysis({});
          setPhotos([]);
          setNotes("");
          setExplorationId(null);
        }
      } catch (err) {
        if (!cancelled) {
          setExplorationError(
            err instanceof Error ? err.message : "Error al cargar exploración",
          );
          // Allow create even on fetch error (lazy-create)
          resetForm();
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExploration(false);
          // Force form remount with fresh initialData
          setExplorationKey((k) => k + 1);
        }
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  // ── Reset form ─────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setExplorationId(null);
    setTemplate(null);
    setResponses({});
    setSkinEvaluation({});
    setFacialAnalysis({});
    setPhotos([]);
    setNotes("");
  }, []);

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedPatientId) return;

    setIsSaving(true);

    let body: Record<string, any>;

    if (isV2Mode && template) {
      // v2 save: merge responses with existing DB data to preserve orphans
      let existingResponses: Record<string, any> = {};

      if (explorationId) {
        try {
          const getRes = await fetch(`/api/explorations/${explorationId}`);
          if (getRes.ok) {
            const getData = await getRes.json();
            existingResponses = getData.exploration?.responses ?? {};
          }
        } catch {
          // If fetch fails, use current responses as-is
        }
      }

      const mergedResponses = { ...existingResponses, ...responses };

      body = {
        patientId: selectedPatientId,
        date: todayStr(),
        templateId: template.id,
        responses: mergedResponses,
        facialAnalysis,
        notes,
        photos,
      };
    } else {
      // legacy save
      body = {
        patientId: selectedPatientId,
        date: todayStr(),
        skinEvaluation,
        facialAnalysis,
        notes,
        photos,
      };
    }

    try {
      let res: Response;

      if (explorationId) {
        // ── Update existing ────────────────────────────────────────────────
        res = await fetch(`/api/explorations/${explorationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // ── Create new (lazy-create) ────────────────────────────────────────
        res = await fetch("/api/explorations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al guardar exploración");
      }

      const result = await res.json();

      // Store the returned exploration ID for subsequent updates
      if (!explorationId && result.exploration) {
        setExplorationId(result.exploration.id);
      }

      toast.success("Exploración guardada correctamente");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar exploración";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoadingPatients) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="h-24 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (patientsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Exploración Física
          </h1>
          <p className="text-muted-foreground mt-1">
            No se pudieron cargar los pacientes
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="size-16 text-destructive mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium">Error</h3>
            <p className="text-muted-foreground mt-1 max-w-md">{patientsError}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Exploración Física
          </h1>
          <p className="text-muted-foreground mt-1">
            Documentá el análisis completo de piel y evaluación facial
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!selectedPatientId || isSaving || isLoadingExploration}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin size-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {explorationId ? "Actualizar Exploración" : "Guardar Exploración"}
            </>
          )}
        </Button>
      </div>

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selección de Paciente</CardTitle>
          <CardDescription>Seleccioná un paciente para comenzar la exploración física</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={selectedPatientId}
              onValueChange={(value) => {
                setSelectedPatientId(value);
                setActiveTab("skin");
              }}
            >
              <SelectTrigger className="md:w-80">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarImage src={patient.avatar ?? undefined} alt={patient.name} />
                        <AvatarFallback className="text-xs">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{patient.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPatient && (
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg flex-1">
                <Avatar className="size-12">
                  <AvatarImage src={selectedPatient.avatar ?? undefined} alt={selectedPatient.name} />
                  <AvatarFallback>{getInitials(selectedPatient.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedPatient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.dateOfBirth && (
                      <>FN: {format(selectedPatient.dateOfBirth, "d MMM yyyy")} &bull; </>
                    )}
                    {selectedPatient.totalVisits} visitas
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {selectedPatientId ? (
        isLoadingExploration ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="animate-spin size-10 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <h3 className="text-lg font-medium">Cargando Exploración</h3>
              <p className="text-muted-foreground mt-1">
                Cargando datos existentes...
              </p>
            </CardContent>
          </Card>
        ) : explorationError && !explorationId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="size-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium">No se pudieron cargar datos existentes</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                Podés crear una nueva exploración igualmente.
              </p>
            </CardContent>
          </Card>
        ) : isV2Mode && template ? (
          <>
            <DynamicForm
              config={template.config}
              responses={responses}
              onResponsesChange={setResponses}
              facialAnalysis={facialAnalysis}
              onFacialAnalysisChange={setFacialAnalysis}
              photos={photos}
              onPhotosChange={setPhotos}
            />
            {/* Notes — always visible */}
            <NotesCard notes={notes} onChange={setNotes} />
          </>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="skin">Evaluación de Piel</TabsTrigger>
                <TabsTrigger value="facial">Análisis Facial</TabsTrigger>
                <TabsTrigger value="photos">Documentación Fotográfica</TabsTrigger>
              </TabsList>

              <TabsContent value="skin" className="mt-6">
                <SkinEvaluationForm
                  key={explorationKey}
                  initialData={skinEvaluation as Partial<SkinEvaluationData>}
                  onChange={(data) => setSkinEvaluation(data)}
                />
              </TabsContent>

              <TabsContent value="facial" className="mt-6">
                <FacialAnalysisForm
                  key={explorationKey}
                  initialData={facialAnalysis}
                  onChange={setFacialAnalysis}
                />
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                <PhotoCapture
                  key={explorationKey}
                  photos={photos}
                  onPhotosChange={setPhotos}
                />
              </TabsContent>
            </Tabs>
            {/* Notes — always visible */}
            <NotesCard notes={notes} onChange={setNotes} />
          </>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="size-16 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-medium">Ningún Paciente Seleccionado</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Seleccioná un paciente del menú desplegable para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
