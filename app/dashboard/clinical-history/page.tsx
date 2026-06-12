"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PatientList } from "@/components/patients/patient-list";
import { MedicalHistoryTab } from "@/components/patients/medical-history-tab";
import { TreatmentHistoryTab } from "@/components/patients/treatment-history-tab";
import type { Patient, ClinicalHistoryResponse } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, History, Loader2, AlertCircle, FolderOpen, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── API response types ────────────────────────────────────────────────────────

interface PatientRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  totalVisits: number;
  lastVisit: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar ?? undefined,
    dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
    gender: row.gender as Patient["gender"],
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    totalVisits: row.totalVisits,
    lastVisit: row.lastVisit ? new Date(row.lastVisit) : undefined,
    createdAt: new Date(row.createdAt),
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClinicalHistoryPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch state
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Clinical history state
  const [clinicalData, setClinicalData] = useState<ClinicalHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("medical");

  // ── Fetch patients on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/patients");
        if (!res.ok) throw new Error("Failed to load patients");
        const data = await res.json();
        if (!cancelled) {
          setPatients((data.patients ?? []).map(toPatient));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load patients");
        }
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch clinical history when patient changes ──────────────────────────
  const loadClinicalHistory = useCallback(async (patient: Patient) => {
    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patient.id)}/clinical-history`,
      );

      let errorMessage = "Failed to load clinical history";
      if (!res.ok) {
        try {
          const errBody = await res.json();
          errorMessage = errBody.error || `${errorMessage} (${res.status})`;
        } catch {
          errorMessage = `${errorMessage} (${res.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setClinicalData(data);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Failed to load clinical history",
      );
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      setClinicalData(null);
      return;
    }
    loadClinicalHistory(selectedPatient);
    setActiveTab("medical");
  }, [selectedPatient, loadClinicalHistory]);

  // ── Build TreatmentRecords from completed appointments ─────────────────────
  const treatmentRecords = clinicalData?.completedAppointments.map((apt) => ({
    id: apt.id,
    date: new Date(apt.date + "T" + (apt.startTime || "00:00")),
    treatment: apt.treatmentType,
    notes: apt.notes || "",
    professional: apt.professionalName || "Professional",
  })) ?? [];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingPatients) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <AlertCircle className="size-16 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Error al cargar</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
              <Button
                variant="outline"
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
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* ── Transition banner ───────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-4 pb-0">
        <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <Info className="size-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Historial Clínico se está migrando a Pacientes
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Toda la información clínica ahora está centralizada en{" "}
              <Link
                href="/dashboard/patients"
                className="font-medium text-accent hover:underline"
              >
                Pacientes
              </Link>
              . Seleccioná un paciente para ver su historial completo en un solo
              lugar.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/dashboard/patients">Ir a Pacientes</Link>
          </Button>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-6 min-h-0 px-6 pb-6 pt-4">
        {/* ── Patient List ─────────────────────────────────────────────────── */}
        <div className="w-96 shrink-0">
          <PatientList
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            onNewPatient={() => router.push("/dashboard/patients")}
          />
        </div>

        {/* ── Clinical History Detail ──────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          {!selectedPatient ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <FolderOpen className="size-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-serif font-semibold mb-2">
                Historial Clínico
              </h2>
              <p className="text-muted-foreground max-w-md">
                Seleccioná un paciente de la lista para ver su historial
                clínico completo, incluyendo registros médicos y tratamientos.
              </p>
            </CardContent>
          </Card>
        ) : loadingHistory ? (
          /* ── Loading history ──────────────────────────────────────────── */
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-center py-16">
              <Loader2 className="size-10 animate-spin text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Cargando historial clínico</h3>
              <p className="text-sm text-muted-foreground">
                Obteniendo datos de {selectedPatient.name}...
              </p>
            </CardContent>
          </Card>
        ) : historyError ? (
          /* ── History error ────────────────────────────────────────────── */
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-center py-16">
              <AlertCircle className="size-16 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Error al cargar historial</h3>
              <p className="text-muted-foreground mb-4">{historyError}</p>
              <Button
                variant="outline"
                onClick={() => selectedPatient && loadClinicalHistory(selectedPatient)}
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ── Clinical History Tabs ────────────────────────────────────── */
          <div className="space-y-6">
            {/* Patient header */}
            <div>
              <h1 className="text-2xl font-serif font-semibold text-foreground">
                {selectedPatient.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Historial clínico y registros médicos
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="medical">
                  <Stethoscope className="size-4 mr-2" />
                  Historial Médico
                </TabsTrigger>
                <TabsTrigger value="treatments">
                  <History className="size-4 mr-2" />
                  Tratamientos ({treatmentRecords.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="medical" className="mt-6">
                {/* Medical History Tab — reuses existing component */}
                {clinicalData && (
                  <MedicalHistoryTab
                    patient={{
                      ...selectedPatient,
                      medicalHistory: clinicalData.medicalHistory ?? undefined,
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="treatments" className="mt-6">
                {/* Treatment History Tab — built from completed appointments */}
                {treatmentRecords.length > 0 ? (
                  <TreatmentHistoryTab treatments={treatmentRecords} />
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <History className="size-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">Sin Historial de Tratamientos</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Todavía no se registraron tratamientos completados para este paciente.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Explorations summary */}
            {clinicalData && clinicalData.explorations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Exploraciones Físicas</CardTitle>
                  <CardDescription>
                    {clinicalData.explorations.length} exploración(es) registradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {clinicalData.explorations.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                      >
                        <span className="font-medium">
                          {new Date(exp.date + "T00:00:00").toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-muted-foreground">
                          {exp.photos.length} photo(s)
                          {exp.skinEvaluation ? " · Skin eval" : ""}
                          {exp.facialAnalysis ? " · Facial analysis" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
