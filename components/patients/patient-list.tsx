"use client";

import { useState } from "react";
import { Search, Plus, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/types";
import { format } from "date-fns";

interface PatientListProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
}

export function PatientList({
  patients,
  selectedPatient,
  onSelectPatient,
  onNewPatient,
}: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif text-xl">Patients</CardTitle>
            <CardDescription>{patients.length} registered</CardDescription>
          </div>
          <Button onClick={onNewPatient} size="sm">
            <Plus data-icon="inline-start" />
            New
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="flex flex-col">
          {filteredPatients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              className={cn(
                "flex items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50 border-b border-border",
                selectedPatient?.id === patient.id && "bg-muted"
              )}
            >
              <Avatar className="size-12">
                <AvatarImage src={patient.avatar} alt={patient.name} />
                <AvatarFallback>
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{patient.name}</p>
                  <Badge variant="secondary" className="shrink-0">
                    {patient.totalVisits} visits
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Mail className="size-3" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                  <Phone className="size-3" />
                  <span>{patient.phone}</span>
                </div>
                {patient.lastVisit && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>Last visit: {format(patient.lastVisit, "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No patients found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
