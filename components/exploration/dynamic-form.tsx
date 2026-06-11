"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldRenderer } from "@/components/exploration/field-renderer";
import {
  FacialDiagram,
  ZoneDetailForm,
} from "@/components/exploration/facial-diagram";
import { PhotoCapture } from "@/components/exploration/photo-capture";
import type {
  TemplateConfig,
  FacialAnalysis,
  AreaAnalysis,
  ExplorationPhoto,
} from "@/lib/types";

interface DynamicFormProps {
  config: TemplateConfig;
  responses: Record<string, any>;
  onResponsesChange: (responses: Record<string, any>) => void;
  facialAnalysis: Partial<FacialAnalysis>;
  onFacialAnalysisChange: (data: Partial<FacialAnalysis>) => void;
  photos: ExplorationPhoto[];
  onPhotosChange: (photos: ExplorationPhoto[]) => void;
}

export function DynamicForm({
  config,
  responses,
  onResponsesChange,
  facialAnalysis,
  onFacialAnalysisChange,
  photos,
  onPhotosChange,
}: DynamicFormProps) {
  const handleFieldChange = (key: string, value: any) => {
    onResponsesChange({ ...responses, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Sections as cards */}
      {config.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[...section.fields]
              .filter((f) => f.isActive !== false)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={responses[field.key]}
                  onChange={(value) => handleFieldChange(field.key, value)}
                />
              ))}
          </CardContent>
        </Card>
      ))}

      {/* Facial Diagram widget */}
      {config.widgets?.facialDiagram && (
        <FacialDiagramWidget
          facialAnalysis={facialAnalysis}
          onFacialAnalysisChange={onFacialAnalysisChange}
        />
      )}

      {/* Photo Capture widget */}
      {config.widgets?.photoCapture && (
        <PhotoCapture photos={photos} onPhotosChange={onPhotosChange} />
      )}
    </div>
  );
}

// ─── Internal FacialDiagram + ZoneDetailForm wrapper ────────────────────────────

const defaultAreaAnalysis: AreaAnalysis = {
  condition: 'normal',
  notes: '',
  recommendedTreatments: [],
};

function FacialDiagramWidget({
  facialAnalysis,
  onFacialAnalysisChange,
}: {
  facialAnalysis: Partial<FacialAnalysis>;
  onFacialAnalysisChange: (data: Partial<FacialAnalysis>) => void;
}) {
  const [selectedZone, setSelectedZone] = useState<keyof FacialAnalysis | null>(
    null,
  );

  const handleZoneChange = (zoneData: AreaAnalysis) => {
    if (!selectedZone) return;
    onFacialAnalysisChange({
      ...facialAnalysis,
      [selectedZone]: zoneData,
    });
  };

  const zoneData = selectedZone
    ? facialAnalysis[selectedZone] ?? defaultAreaAnalysis
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FacialDiagram
        analysis={facialAnalysis}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
      />

      {selectedZone && zoneData ? (
        <ZoneDetailForm
          zone={selectedZone}
          data={zoneData}
          onChange={handleZoneChange}
        />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
            Seleccioná una zona facial para analizar
          </CardContent>
        </Card>
      )}
    </div>
  );
}
