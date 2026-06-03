"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCircle, Loader2 } from "lucide-react";
import { PatientList } from "@/components/patients/patient-list";
import { PatientDetail } from "@/components/patients/patient-detail";
import { PatientDialog } from "@/components/patients/patient-dialog";
import type { Patient } from "@/lib/types";

// ─── API response type ───────────────────────────────────────────────────────

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

// ─── Convert API patient row to component Patient type ───────────────────────

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Fetch state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch patients from API ───────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to load patients");

      const data = await res.json();
      const mapped = (data.patients ?? []).map(toPatient);
      setPatients(mapped);

      // Re-select patient if they still exist in updated list
      if (selectedPatient) {
        const stillExists = mapped.find((p: Patient) => p.id === selectedPatient.id);
        if (!stillExists) {
          setSelectedPatient(null);
        }
      }
    } catch (err) {
      console.error("[patients] Failed to fetch:", err);
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [selectedPatient?.id]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNewPatient = () => {
    setEditingPatient(null);
    setDialogOpen(true);
  };

  const handleEditPatient = () => {
    if (selectedPatient) {
      setEditingPatient(selectedPatient);
      setDialogOpen(true);
    }
  };

  const handleSavePatient = (savedPatient: Patient) => {
    // savedPatient comes from the dialog after successful API call
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === savedPatient.id);
      if (idx >= 0) {
        // Update existing
        const updated = [...prev];
        updated[idx] = savedPatient;
        return updated;
      }
      // Add new
      return [savedPatient, ...prev];
    });
    setSelectedPatient(savedPatient);
  };

  const handleNewExploration = () => {
    alert("Physical exploration feature coming soon!");
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex gap-6">
        <div className="w-96 shrink-0">
          <div className="rounded-xl border border-border bg-card h-full flex flex-col animate-pulse">
            <div className="p-6 pb-4">
              <div className="h-5 w-24 bg-muted rounded mb-3" />
              <div className="h-3 w-20 bg-muted rounded mb-4" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border-b border-border">
                <div className="size-12 rounded-full bg-muted shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-muted rounded mb-2" />
                  <div className="h-3 w-36 bg-muted rounded mb-1" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center max-w-md">
          <Loader2 className="mx-auto size-8 text-destructive mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Could not load patients
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchPatients()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Loader2 className="size-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6">
      <div className="w-96 shrink-0">
        <PatientList
          patients={patients}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          onNewPatient={handleNewPatient}
        />
      </div>

      <div className="flex-1">
        {selectedPatient ? (
          <PatientDetail
            patient={selectedPatient}
            onEdit={handleEditPatient}
            onNewExploration={handleNewExploration}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center bg-card rounded-xl border">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserCircle className="size-10 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl mb-2">Select a Patient</h3>
            <p className="text-muted-foreground max-w-sm">
              Choose a patient from the list to view their profile, medical
              history, and treatment records.
            </p>
          </div>
        )}
      </div>

      <PatientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={editingPatient}
        onSave={handleSavePatient}
      />
    </div>
  );
}
