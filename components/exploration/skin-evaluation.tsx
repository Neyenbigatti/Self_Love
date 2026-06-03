"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { SkinEvaluationData } from "@/lib/types";

const skinTypes = [
  { value: "I", label: "Type I - Very Fair", description: "Always burns, never tans" },
  { value: "II", label: "Type II - Fair", description: "Burns easily, tans minimally" },
  { value: "III", label: "Type III - Medium", description: "Sometimes burns, tans gradually" },
  { value: "IV", label: "Type IV - Olive", description: "Rarely burns, tans easily" },
  { value: "V", label: "Type V - Brown", description: "Very rarely burns, tans very easily" },
  { value: "VI", label: "Type VI - Dark Brown/Black", description: "Never burns, tans very easily" },
];

const skinConditions = [
  "Normal",
  "Dry",
  "Oily",
  "Combination",
  "Sensitive",
  "Dehydrated",
  "Mature",
  "Acne-Prone",
];

const skinConcerns = [
  { id: "wrinkles", label: "Fine Lines & Wrinkles" },
  { id: "sagging", label: "Skin Laxity / Sagging" },
  { id: "pigmentation", label: "Hyperpigmentation" },
  { id: "redness", label: "Redness / Rosacea" },
  { id: "acne", label: "Active Acne" },
  { id: "scarring", label: "Acne Scarring" },
  { id: "pores", label: "Enlarged Pores" },
  { id: "texture", label: "Uneven Texture" },
  { id: "dullness", label: "Dullness / Lack of Radiance" },
  { id: "dehydration", label: "Dehydration" },
  { id: "dark-circles", label: "Dark Circles" },
  { id: "volume-loss", label: "Volume Loss" },
];

const defaultData: SkinEvaluationData = {
  skinType: "",
  skinCondition: "",
  concerns: [],
  elasticity: "good",
  hydrationLevel: 50,
  oilLevel: 50,
  sensitivityLevel: "none",
  notes: "",
};

interface SkinEvaluationFormProps {
  initialData?: Partial<SkinEvaluationData>;
  onChange?: (data: SkinEvaluationData) => void;
}

export function SkinEvaluationForm({ initialData, onChange }: SkinEvaluationFormProps) {
  const [data, setData] = useState<SkinEvaluationData>({ ...defaultData, ...initialData });

  const updateData = (updates: Partial<SkinEvaluationData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onChange?.(newData);
  };

  const toggleConcern = (concernId: string) => {
    const newConcerns = data.concerns.includes(concernId)
      ? data.concerns.filter((c) => c !== concernId)
      : [...data.concerns, concernId];
    updateData({ concerns: newConcerns });
  };

  return (
    <div className="space-y-6">
      {/* Fitzpatrick Skin Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fitzpatrick Skin Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={data.skinType} onValueChange={(value) => updateData({ skinType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select skin type" />
            </SelectTrigger>
            <SelectContent>
              {skinTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Skin Condition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skin Condition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {skinConditions.map((condition) => (
              <Button
                key={condition}
                variant={data.skinCondition === condition ? "default" : "outline"}
                size="sm"
                onClick={() => updateData({ skinCondition: condition })}
              >
                {condition}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skin Concerns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skin Concerns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {skinConcerns.map((concern) => (
              <Button
                key={concern.id}
                variant={data.concerns.includes(concern.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleConcern(concern.id)}
                className="justify-start"
              >
                {data.concerns.includes(concern.id) && (
                  <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {concern.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skin Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Elasticity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Skin Elasticity</Label>
            <RadioGroup
              value={data.elasticity}
              onValueChange={(value) => updateData({ elasticity: value as SkinEvaluationData["elasticity"] })}
              className="flex flex-wrap gap-4"
            >
              {(["excellent", "good", "fair", "poor"] as const).map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <RadioGroupItem value={level} id={`elasticity-${level}`} />
                  <Label htmlFor={`elasticity-${level}`} className="capitalize cursor-pointer">
                    {level}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Hydration Level */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-sm font-medium">Hydration Level</Label>
              <span className="text-sm text-muted-foreground">{data.hydrationLevel}%</span>
            </div>
            <Input
              type="range"
              min="0"
              max="100"
              value={data.hydrationLevel}
              onChange={(e) => updateData({ hydrationLevel: parseInt(e.target.value) })}
              className="w-full h-2 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Dehydrated</span>
              <span>Well Hydrated</span>
            </div>
          </div>

          {/* Oil Level */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-sm font-medium">Oil Production</Label>
              <span className="text-sm text-muted-foreground">{data.oilLevel}%</span>
            </div>
            <Input
              type="range"
              min="0"
              max="100"
              value={data.oilLevel}
              onChange={(e) => updateData({ oilLevel: parseInt(e.target.value) })}
              className="w-full h-2 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Dry</span>
              <span>Very Oily</span>
            </div>
          </div>

          {/* Sensitivity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sensitivity Level</Label>
            <RadioGroup
              value={data.sensitivityLevel}
              onValueChange={(value) => updateData({ sensitivityLevel: value as SkinEvaluationData["sensitivityLevel"] })}
              className="flex flex-wrap gap-4"
            >
              {(["none", "mild", "moderate", "severe"] as const).map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <RadioGroupItem value={level} id={`sensitivity-${level}`} />
                  <Label htmlFor={`sensitivity-${level}`} className="capitalize cursor-pointer">
                    {level}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter any additional observations about the patient's skin..."
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
