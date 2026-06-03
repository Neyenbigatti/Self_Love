"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Stethoscope, History, Loader2, AlertCircle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  useEffect(() => {
    if (!selectedPatient) {
      setClinicalData(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadingHistory(true);
      setHistoryError(null);

      try {
        const res = await fetch(
          `/api/patients/${encodeURIComponent(selectedPatient.id)}/clinical-history`,
        );
        if (!res.ok) throw new Error("Failed to load clinical history");
        const data = await res.json();
        if (!cancelled) setClinicalData(data);
      } catch (err) {
        if (!cancelled) {
          setHistoryError(
            err instanceof Error ? err.message : "Failed to load clinical history",
          );
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    load();
    setActiveTab("medical");
    return () => { cancelled = true; };
  }, [selectedPatient]);

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
          <p className="text-muted-foreground">Loading patients...</p>
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
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6">
      {/* ── Patient List ─────────────────────────────────────────────────── */}
      <div className="w-96 shrink-0">
        <PatientList
          patients={patients}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          onNewPatient={() => {}}
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
                Clinical History
              </h2>
              <p className="text-muted-foreground max-w-md">
                Select a patient from the list to view their complete clinical
                history, including medical records and treatment history.
              </p>
            </CardContent>
          </Card>
        ) : loadingHistory ? (
          /* ── Loading history ──────────────────────────────────────────── */
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-center py-16">
              <Loader2 className="size-10 animate-spin text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Loading clinical history</h3>
              <p className="text-sm text-muted-foreground">
                Retrieving data for {selectedPatient.name}...
              </p>
            </CardContent>
          </Card>
        ) : historyError ? (
          /* ── History error ────────────────────────────────────────────── */
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-center py-16">
              <AlertCircle className="size-16 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Error loading history</h3>
              <p className="text-muted-foreground mb-4">{historyError}</p>
              <Button
                variant="outline"
                onClick={() => setSelectedPatient(selectedPatient)}
              >
                Retry
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
                Clinical history and medical records
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="medical">
                  <Stethoscope className="size-4 mr-2" />
                  Medical History
                </TabsTrigger>
                <TabsTrigger value="treatments">
                  <History className="size-4 mr-2" />
                  Treatments ({treatmentRecords.length})
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
                      <h3 className="font-medium mb-1">No Treatment History</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        No completed treatments have been recorded for this patient yet.
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
                  <CardTitle className="text-lg">Physical Explorations</CardTitle>
                  <CardDescription>
                    {clinicalData.explorations.length} exploration(s) on record
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
  );
}
