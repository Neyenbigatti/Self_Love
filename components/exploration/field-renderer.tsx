"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { TemplateField } from "@/lib/types";

interface FieldRendererProps {
  field: TemplateField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const labelContent = (
    <span>
      {field.label}
      {field.required && <span className="text-destructive ml-0.5">*</span>}
    </span>
  );

  const errorEl = error && (
    <p className="text-sm text-destructive">{error}</p>
  );

  switch (field.type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label>{labelContent}</Label>
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
          {errorEl}
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-2">
          <Label>{labelContent}</Label>
          <Textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
          {errorEl}
        </div>
      );

    case "boolean":
      return (
        <div className="space-y-2">
          <Label>{labelContent}</Label>
          <RadioGroup
            value={value === true ? "true" : value === false ? "false" : ""}
            onValueChange={(v) => onChange(v === "true")}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="true" id={`${field.key}-yes`} />
              <Label htmlFor={`${field.key}-yes`} className="cursor-pointer">
                Sí
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="false" id={`${field.key}-no`} />
              <Label htmlFor={`${field.key}-no`} className="cursor-pointer">
                No
              </Label>
            </div>
          </RadioGroup>
          {errorEl}
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label>{labelContent}</Label>
          <Input
            type="number"
            value={value ?? ""}
            onChange={(e) =>
              onChange(
                e.target.value === "" ? "" : e.target.valueAsNumber,
              )
            }
          />
          {errorEl}
        </div>
      );

    case "date":
      return (
        <div className="space-y-2">
          <Label>{labelContent}</Label>
          <Input
            type="date"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {errorEl}
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label>{labelContent}</Label>
          <Select
            value={value ?? ""}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorEl}
        </div>
      );

    case "multiselect":
      return (
        <div className="space-y-2">
          <Label>{labelContent}</Label>
          <div className="flex flex-wrap gap-3">
            {field.options?.map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`${field.key}-${opt}`}
                    checked={checked}
                    onCheckedChange={() => {
                      const current = Array.isArray(value) ? [...value] : [];
                      if (checked) {
                        onChange(current.filter((v: string) => v !== opt));
                      } else {
                        onChange([...current, opt]);
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${field.key}-${opt}`}
                    className="cursor-pointer text-sm"
                  >
                    {opt}
                  </Label>
                </div>
              );
            })}
          </div>
          {errorEl}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label>{labelContent}</Label>
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
          {errorEl}
        </div>
      );
  }
}
