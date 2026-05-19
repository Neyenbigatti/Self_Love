"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FacialAnalysisForm } from "@/components/exploration/facial-diagram";
import { SkinEvaluationForm } from "@/components/exploration/skin-evaluation";
import { PhotoCapture } from "@/components/exploration/photo-capture";
import { mockPatients } from "@/lib/mock-data";
import type { FacialAnalysis, ExplorationPhoto } from "@/lib/types";
import { format } from "date-fns";

export default function PhysicalExplorationPage() {
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patient");
  
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || "");
  const [activeTab, setActiveTab] = useState("skin");
  const [facialAnalysis, setFacialAnalysis] = useState<Partial<FacialAnalysis>>({});
  const [skinEvaluation, setSkinEvaluation] = useState({});
  const [photos, setPhotos] = useState<ExplorationPhoto[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const selectedPatient = mockPatients.find((p) => p.id === selectedPatientId);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Saving exploration:", {
      patientId: selectedPatientId,
      facialAnalysis,
      skinEvaluation,
      photos,
    });
    setIsSaving(false);
    alert("Physical exploration saved successfully!");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Physical Exploration</h1>
          <p className="text-muted-foreground mt-1">
            Document comprehensive skin analysis and facial evaluation
          </p>
        </div>
        <Button onClick={handleSave} disabled={!selectedPatientId || isSaving}>
          {isSaving ? (
            <>
              <svg className="animate-spin size-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Exploration
            </>
          )}
        </Button>
      </div>

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient Selection</CardTitle>
          <CardDescription>Select a patient to begin the physical exploration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="md:w-80">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {mockPatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarImage src={patient.avatar} alt={patient.name} />
                        <AvatarFallback className="text-xs">{getInitials(patient.name)}</AvatarFallback>
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
                  <AvatarImage src={selectedPatient.avatar} alt={selectedPatient.name} />
                  <AvatarFallback>{getInitials(selectedPatient.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedPatient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.dateOfBirth && (
                      <>DOB: {format(selectedPatient.dateOfBirth, "MMM d, yyyy")} &bull; </>
                    )}
                    {selectedPatient.totalVisits} visits
                  </p>
                </div>
                {selectedPatient.medicalHistory?.allergies && selectedPatient.medicalHistory.allergies.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-medium">
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Allergies
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {selectedPatientId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skin">Skin Evaluation</TabsTrigger>
            <TabsTrigger value="facial">Facial Analysis</TabsTrigger>
            <TabsTrigger value="photos">Photo Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="skin" className="mt-6">
            <SkinEvaluationForm onChange={setSkinEvaluation} />
          </TabsContent>

          <TabsContent value="facial" className="mt-6">
            <FacialAnalysisForm onChange={setFacialAnalysis} />
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <PhotoCapture photos={photos} onPhotosChange={setPhotos} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="size-16 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-medium">No Patient Selected</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Please select a patient from the dropdown above to begin documenting their physical exploration.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
