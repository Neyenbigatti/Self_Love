"use client";

import { Calendar, User, FileText, Image } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { TreatmentRecord } from "@/lib/types";
import { format } from "date-fns";

interface TreatmentHistoryTabProps {
  treatments: TreatmentRecord[];
}

export function TreatmentHistoryTab({ treatments }: TreatmentHistoryTabProps) {
  if (treatments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No Treatment History</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          No treatments have been recorded for this patient yet.
        </p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {treatments.map((treatment) => (
        <AccordionItem key={treatment.id} value={treatment.id}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Calendar className="size-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">{treatment.treatment}</p>
                <p className="text-sm text-muted-foreground">
                  {format(treatment.date, "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-14 pr-4 pb-2">
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-sm">
                    Performed by:{" "}
                    <span className="font-medium">{treatment.professional}</span>
                  </span>
                </div>

                {treatment.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Treatment Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {treatment.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {treatment.photos && (treatment.photos.before || treatment.photos.after) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Image className="size-4" />
                        Before & After Photos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {treatment.photos.before && (
                          <div>
                            <Badge variant="secondary" className="mb-2">
                              Before
                            </Badge>
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                              <Image className="size-8 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        {treatment.photos.after && (
                          <div>
                            <Badge variant="secondary" className="mb-2">
                              After
                            </Badge>
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                              <Image className="size-8 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
