"use client";

import { useState } from "react";
import { PatientList } from "@/components/patients/patient-list";
import { PatientDetail } from "@/components/patients/patient-detail";
import { PatientDialog } from "@/components/patients/patient-dialog";
import { mockPatients } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { UserCircle } from "lucide-react";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

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

  const handleSavePatient = (patientData: Partial<Patient>) => {
    if (editingPatient) {
      // Update existing patient
      setPatients((prev) =>
        prev.map((p) =>
          p.id === editingPatient.id ? { ...p, ...patientData } : p
        )
      );
      if (selectedPatient?.id === editingPatient.id) {
        setSelectedPatient({ ...selectedPatient, ...patientData } as Patient);
      }
    } else {
      // Add new patient
      const newPatient: Patient = {
        id: `p${Date.now()}`,
        name: patientData.name || "",
        email: patientData.email || "",
        phone: patientData.phone || "",
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender,
        address: patientData.address,
        notes: patientData.notes,
        totalVisits: 0,
        createdAt: new Date(),
      };
      setPatients((prev) => [newPatient, ...prev]);
      setSelectedPatient(newPatient);
    }
  };

  const handleNewExploration = () => {
    // Navigate to physical exploration form
    alert("Physical exploration feature coming soon!");
  };

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
