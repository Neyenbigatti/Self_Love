"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  Edit2,
  FileText,
  Stethoscope,
  Camera,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import type { Patient, TreatmentRecord } from "@/lib/types";
import { format, differenceInYears } from "date-fns";
import { MedicalHistoryTab } from "./medical-history-tab";
import { TreatmentHistoryTab } from "./treatment-history-tab";
import { ExplorationsTab } from "./explorations-tab";
import { ClinicalNotesTab } from "./clinical-notes-tab";

interface PatientDetailProps {
  patient: Patient;
  onEdit: () => void;
  onNewExploration: () => void;
}

export function PatientDetail({
  patient,
  onEdit,
  onNewExploration,
}: PatientDetailProps) {
  const age = patient.dateOfBirth
    ? differenceInYears(new Date(), patient.dateOfBirth)
    : null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-20">
            <AvatarImage src={patient.avatar} alt={patient.name} />
            <AvatarFallback className="text-2xl">
              {patient.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-serif text-2xl">
                  {patient.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  {age && <span>{age} years old</span>}
                  {patient.gender && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="capitalize">{patient.gender}</span>
                    </>
                  )}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit2 data-icon="inline-start" />
                Editar
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                <span>{patient.phone}</span>
              </div>
              {patient.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{patient.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onNewExploration} className="flex-1">
            <Stethoscope data-icon="inline-start" />
            Nueva Exploración Física
          </Button>
          <Button variant="outline" className="flex-1" onClick={onNewExploration}>
            <Camera data-icon="inline-start" />
            Agregar Fotos
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-auto pt-4">
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">
              <FileText className="size-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="medical">
              <Stethoscope className="size-4 mr-2" />
              Historial Médico
            </TabsTrigger>
            <TabsTrigger value="treatments">
              <History className="size-4 mr-2" />
              Tratamientos
            </TabsTrigger>
            <TabsTrigger value="explorations">
              <Stethoscope className="size-4 mr-2" />
              Exploraciones
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FileText className="size-4 mr-2" />
              Notas Clínicas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-accent">
                      {patient.totalVisits}
                    </div>
                    <p className="text-sm text-muted-foreground">Visitas Totales</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">
                      {patient.treatments?.length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Tratamientos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">
                      {patient.lastVisit
                        ? format(patient.lastVisit, "MMM d")
                        : "-"}
                    </div>
                    <p className="text-sm text-muted-foreground">Última Visita</p>
                  </CardContent>
                </Card>
              </div>

              {patient.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {patient.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {patient.treatments && patient.treatments.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tratamientos Recientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      {patient.treatments.slice(0, 3).map((treatment) => (
                        <div
                          key={treatment.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{treatment.treatment}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(treatment.date, "MMMM d, yyyy")}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {treatment.professional}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="medical" className="mt-4">
            <MedicalHistoryTab patient={patient} />
          </TabsContent>

          <TabsContent value="treatments" className="mt-4">
            <TreatmentHistoryTab treatments={patient.treatments || []} />
          </TabsContent>

          <TabsContent value="explorations" className="mt-4">
            <ExplorationsTab
              patientId={patient.id}
              onNewExploration={onNewExploration}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <ClinicalNotesTab patientId={patient.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
