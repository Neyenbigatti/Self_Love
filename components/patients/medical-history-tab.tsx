"use client";

import { AlertCircle, Pill, Heart, Syringe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@/lib/types";

interface MedicalHistoryTabProps {
  patient: Patient;
}

export function MedicalHistoryTab({ patient }: MedicalHistoryTabProps) {
  const history = patient.medicalHistory;

  if (!history) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Heart className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No Medical History</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Medical history has not been recorded for this patient yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-destructive" />
            <CardTitle className="text-base">Allergies</CardTitle>
          </div>
          <CardDescription>Known allergies and sensitivities</CardDescription>
        </CardHeader>
        <CardContent>
          {history.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {history.allergies.map((allergy, index) => (
                <Badge key={index} variant="destructive">
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No known allergies</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Pill className="size-5 text-accent" />
            <CardTitle className="text-base">Current Medications</CardTitle>
          </div>
          <CardDescription>Medications currently being taken</CardDescription>
        </CardHeader>
        <CardContent>
          {history.medications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {history.medications.map((medication, index) => (
                <Badge key={index} variant="secondary">
                  {medication}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No current medications</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Heart className="size-5 text-pink-500" />
            <CardTitle className="text-base">Medical Conditions</CardTitle>
          </div>
          <CardDescription>Existing health conditions</CardDescription>
        </CardHeader>
        <CardContent>
          {history.conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {history.conditions.map((condition, index) => (
                <Badge key={index} variant="outline">
                  {condition}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No known conditions</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Syringe className="size-5 text-blue-500" />
            <CardTitle className="text-base">Previous Treatments</CardTitle>
          </div>
          <CardDescription>Prior aesthetic treatments elsewhere</CardDescription>
        </CardHeader>
        <CardContent>
          {history.previousTreatments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {history.previousTreatments.map((treatment, index) => (
                <Badge key={index} variant="secondary">
                  {treatment}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No previous treatments recorded
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
