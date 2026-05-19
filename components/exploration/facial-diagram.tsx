"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FacialAnalysis, AreaAnalysis } from "@/lib/types";

type FacialZone = keyof FacialAnalysis;

const facialZones: { id: FacialZone; label: string; position: { top: string; left: string; width: string; height: string } }[] = [
  { id: "forehead", label: "Forehead", position: { top: "5%", left: "25%", width: "50%", height: "15%" } },
  { id: "glabella", label: "Glabella", position: { top: "20%", left: "40%", width: "20%", height: "8%" } },
  { id: "periorbital", label: "Periorbital", position: { top: "25%", left: "15%", width: "70%", height: "12%" } },
  { id: "cheeks", label: "Cheeks", position: { top: "40%", left: "10%", width: "80%", height: "18%" } },
  { id: "nasolabialFolds", label: "Nasolabial Folds", position: { top: "50%", left: "30%", width: "40%", height: "12%" } },
  { id: "lips", label: "Lips", position: { top: "62%", left: "30%", width: "40%", height: "10%" } },
  { id: "chin", label: "Chin", position: { top: "75%", left: "35%", width: "30%", height: "10%" } },
  { id: "jawline", label: "Jawline", position: { top: "70%", left: "10%", width: "80%", height: "8%" } },
  { id: "neck", label: "Neck", position: { top: "88%", left: "25%", width: "50%", height: "12%" } },
];

const conditionColors = {
  normal: "bg-emerald-500/30 border-emerald-500 hover:bg-emerald-500/40",
  mild: "bg-amber-500/30 border-amber-500 hover:bg-amber-500/40",
  moderate: "bg-orange-500/30 border-orange-500 hover:bg-orange-500/40",
  severe: "bg-red-500/30 border-red-500 hover:bg-red-500/40",
};

const treatmentOptions = [
  "Botox",
  "Dermal Fillers",
  "Chemical Peel",
  "Microneedling",
  "Laser Treatment",
  "PRP Therapy",
  "Mesotherapy",
  "Radiofrequency",
  "Thread Lift",
  "Hydrafacial",
];

const defaultAreaAnalysis: AreaAnalysis = {
  condition: "normal",
  notes: "",
  recommendedTreatments: [],
};

interface FacialDiagramProps {
  analysis: Partial<FacialAnalysis>;
  selectedZone: FacialZone | null;
  onSelectZone: (zone: FacialZone) => void;
}

export function FacialDiagram({ analysis, selectedZone, onSelectZone }: FacialDiagramProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Facial Zone Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto w-64 h-80 bg-muted rounded-full overflow-hidden border-2 border-border">
          {/* Face silhouette background */}
          <div className="absolute inset-4 bg-secondary rounded-full opacity-50" />
          
          {/* Clickable zones */}
          {facialZones.map((zone) => {
            const zoneData = analysis[zone.id];
            const condition = zoneData?.condition || "normal";
            
            return (
              <button
                key={zone.id}
                onClick={() => onSelectZone(zone.id)}
                className={cn(
                  "absolute border-2 rounded-lg transition-all cursor-pointer",
                  conditionColors[condition],
                  selectedZone === zone.id && "ring-2 ring-primary ring-offset-2"
                )}
                style={{
                  top: zone.position.top,
                  left: zone.position.left,
                  width: zone.position.width,
                  height: zone.position.height,
                }}
                title={zone.label}
              >
                <span className="sr-only">{zone.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {(["normal", "mild", "moderate", "severe"] as const).map((condition) => (
            <div key={condition} className="flex items-center gap-2">
              <div className={cn("size-3 rounded border", conditionColors[condition].split(" ").slice(0, 2).join(" "))} />
              <span className="text-sm capitalize text-muted-foreground">{condition}</span>
            </div>
          ))}
        </div>

        {/* Zone list for mobile */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {facialZones.map((zone) => {
            const zoneData = analysis[zone.id];
            const condition = zoneData?.condition || "normal";
            
            return (
              <Button
                key={zone.id}
                variant={selectedZone === zone.id ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectZone(zone.id)}
                className="text-xs"
              >
                <span className={cn("size-2 rounded-full mr-1.5", conditionColors[condition].split(" ")[0])} />
                {zone.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface ZoneDetailFormProps {
  zone: FacialZone;
  data: AreaAnalysis;
  onChange: (data: AreaAnalysis) => void;
}

export function ZoneDetailForm({ zone, data, onChange }: ZoneDetailFormProps) {
  const zoneLabel = facialZones.find((z) => z.id === zone)?.label || zone;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{zoneLabel} Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Condition */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Condition</Label>
          <RadioGroup
            value={data.condition}
            onValueChange={(value) => onChange({ ...data, condition: value as AreaAnalysis["condition"] })}
            className="flex flex-wrap gap-4"
          >
            {(["normal", "mild", "moderate", "severe"] as const).map((condition) => (
              <div key={condition} className="flex items-center gap-2">
                <RadioGroupItem value={condition} id={`${zone}-${condition}`} />
                <Label htmlFor={`${zone}-${condition}`} className="capitalize cursor-pointer">
                  {condition}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor={`${zone}-notes`} className="text-sm font-medium">Clinical Notes</Label>
          <Textarea
            id={`${zone}-notes`}
            placeholder="Enter observations for this area..."
            value={data.notes}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            rows={3}
          />
        </div>

        {/* Recommended Treatments */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Recommended Treatments</Label>
          <Select
            value=""
            onValueChange={(value) => {
              if (value && !data.recommendedTreatments.includes(value)) {
                onChange({
                  ...data,
                  recommendedTreatments: [...data.recommendedTreatments, value],
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add treatment recommendation" />
            </SelectTrigger>
            <SelectContent>
              {treatmentOptions
                .filter((t) => !data.recommendedTreatments.includes(t))
                .map((treatment) => (
                  <SelectItem key={treatment} value={treatment}>
                    {treatment}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          {data.recommendedTreatments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.recommendedTreatments.map((treatment) => (
                <span
                  key={treatment}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded-md text-sm"
                >
                  {treatment}
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...data,
                        recommendedTreatments: data.recommendedTreatments.filter((t) => t !== treatment),
                      })
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="sr-only">Remove {treatment}</span>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FacialAnalysisFormProps {
  initialData?: Partial<FacialAnalysis>;
  onChange?: (data: Partial<FacialAnalysis>) => void;
}

export function FacialAnalysisForm({ initialData = {}, onChange }: FacialAnalysisFormProps) {
  const [analysis, setAnalysis] = useState<Partial<FacialAnalysis>>(initialData);
  const [selectedZone, setSelectedZone] = useState<FacialZone | null>(null);

  const handleZoneChange = (zoneData: AreaAnalysis) => {
    if (!selectedZone) return;
    
    const newAnalysis = {
      ...analysis,
      [selectedZone]: zoneData,
    };
    setAnalysis(newAnalysis);
    onChange?.(newAnalysis);
  };

  const selectedZoneData = selectedZone ? analysis[selectedZone] || defaultAreaAnalysis : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FacialDiagram
        analysis={analysis}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
      />
      
      {selectedZone && selectedZoneData ? (
        <ZoneDetailForm
          zone={selectedZone}
          data={selectedZoneData}
          onChange={handleZoneChange}
        />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
            Select a facial zone to analyze
          </CardContent>
        </Card>
      )}
    </div>
  );
}
