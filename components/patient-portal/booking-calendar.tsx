"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, isSameDay, startOfWeek, isAfter, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  professionalId: string;
  onSlotSelect: (date: Date, time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

interface DaySlots {
  date: string; // YYYY-MM-DD
  slots: { time: string; available: boolean }[];
}

export function BookingCalendar({
  professionalId,
  onSlotSelect,
  selectedDate,
  selectedTime,
}: BookingCalendarProps) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(startOfWeek(today, { weekStartsOn: 1 }));
  const [hoveredSlot, setHoveredSlot] = useState<{ date: Date; time: string } | null>(null);
  const [daysMap, setDaysMap] = useState<Map<string, DaySlots>>(new Map());
  const [loading, setLoading] = useState(true);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // ── Fetch slots for the entire visible week ──────────────────────────────
  const fetchWeekSlots = useCallback(async (start: Date, profId: string) => {
    setLoading(true);
    const results = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const day = addDays(start, i);
        const dateStr = format(day, "yyyy-MM-dd");
        try {
          const res = await fetch(
            `/api/availability/slots?date=${dateStr}&professionalId=${profId}`,
          );
          if (!res.ok) return { date: dateStr, slots: [] };
          const data = await res.json();
          return { date: dateStr, slots: data.slots ?? [] } as DaySlots;
        } catch {
          return { date: dateStr, slots: [] };
        }
      }),
    );

    const map = new Map<string, DaySlots>();
    for (const day of results) {
      map.set(day.date, day);
    }
    setDaysMap(map);
    setLoading(false);
  }, []);

  // Refetch when professional or week changes
  useEffect(() => {
    fetchWeekSlots(weekStart, professionalId);
  }, [weekStart, professionalId, fetchWeekSlots]);

  const navigateWeek = (direction: "prev" | "next") => {
    setWeekStart((prev) =>
      direction === "next" ? addDays(prev, 7) : addDays(prev, -7),
    );
  };

  const canGoBack = isAfter(weekStart, today);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Seleccioná Fecha y Hora</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek("prev")}
              disabled={!canGoBack || loading}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Semana anterior</span>
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek("next")}
              disabled={loading}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Semana siguiente</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Days Header */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isPast = isBefore(day, today) && !isSameDay(day, today);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex flex-col items-center rounded-lg p-2 text-center transition-colors",
                  isPast && "opacity-40",
                  isSelected && "bg-accent text-accent-foreground",
                  isToday && !isSelected && "bg-secondary",
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wide">
                  {format(day, "EEE")}
                </span>
                <span
                  className={cn(
                    "mt-1 text-lg font-semibold",
                    isSelected ? "text-accent-foreground" : "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time Slots Grid */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-pulse text-sm text-muted-foreground">
              Cargando disponibilidad...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayData = daysMap.get(dateStr);
              const isPast = isBefore(day, today) && !isSameDay(day, today);
              const availableSlots = isPast
                ? []
                : (dayData?.slots ?? []).filter((s) => !isPast);

              return (
                <div key={day.toISOString()} className="flex flex-col gap-1">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => {
                      const isSelected =
                        selectedDate &&
                        isSameDay(day, selectedDate) &&
                        selectedTime === slot.time;
                      const isHovered =
                        hoveredSlot &&
                        isSameDay(day, hoveredSlot.date) &&
                        hoveredSlot.time === slot.time;

                      if (!slot.available) {
                        return (
                          <div
                            key={`${day.toISOString()}-${slot.time}`}
                            className="flex items-center justify-center rounded-md px-1 py-1.5 text-xs font-medium text-muted-foreground/30 line-through"
                          >
                            {slot.time}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={`${day.toISOString()}-${slot.time}`}
                          onClick={() => onSlotSelect(day, slot.time)}
                          onMouseEnter={() =>
                            setHoveredSlot({ date: day, time: slot.time })
                          }
                          onMouseLeave={() => setHoveredSlot(null)}
                          className={cn(
                            "flex items-center justify-center rounded-md px-1 py-1.5 text-xs font-medium transition-all",
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : isHovered
                              ? "bg-secondary text-foreground"
                              : "bg-secondary/50 text-muted-foreground hover:bg-secondary",
                          )}
                        >
                          {isSelected ? (
                            <Check className="size-3" />
                          ) : (
                            slot.time
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex h-14 items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {isPast ? "-" : "Sin horarios"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Summary */}
        {selectedDate && selectedTime && (
          <div className="mt-6 rounded-lg bg-accent/10 p-4">
            <p className="text-sm font-medium text-foreground">Turno Seleccionado</p>
            <p className="mt-1 text-lg font-semibold text-accent">
              {format(selectedDate, "EEEE, d MMMM yyyy")} a las {selectedTime}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
