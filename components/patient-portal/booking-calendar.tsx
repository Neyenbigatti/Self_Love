"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  startOfDay,
  isToday,
  eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BOOKING_WINDOW_DAYS } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingCalendarProps {
  professionalId: string;
  onSlotSelect: (date: Date, time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

interface SlotInfo {
  time: string;
  available: boolean;
}

interface DaySlots {
  date: string;
  slots: SlotInfo[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingCalendar({
  professionalId,
  onSlotSelect,
  selectedDate,
  selectedTime,
}: BookingCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addDays(today, BOOKING_WINDOW_DAYS), [today]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));
  const [activeDate, setActiveDate] = useState<Date>(() => {
    if (selectedDate && !isBefore(selectedDate, today) && !isAfter(selectedDate, maxDate)) {
      return selectedDate;
    }
    return today;
  });
  const [daysMap, setDaysMap] = useState<Map<string, DaySlots>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDateStr = format(activeDate, "yyyy-MM-dd");

  // ── Locally-synced activeDate when selectedDate prop changes externally ────
  useEffect(() => {
    if (selectedDate && !isSameDay(selectedDate, activeDate)) {
      const isInRange = !isBefore(selectedDate, today) && !isAfter(selectedDate, maxDate);
      if (isInRange) setActiveDate(selectedDate);
    }
  }, [selectedDate, activeDate, today, maxDate]);

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // ── Navigation limits ──────────────────────────────────────────────────────
  const canGoPrev = useMemo(
    () => isAfter(startOfMonth(currentMonth), startOfMonth(today)),
    [currentMonth, today],
  );

  const canGoNext = useMemo(
    () => isBefore(endOfMonth(currentMonth), maxDate),
    [currentMonth, maxDate],
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isDayDisabled = useCallback(
    (day: Date) => isBefore(day, today) || isAfter(day, maxDate),
    [today, maxDate],
  );

  const isDaySelected = useCallback(
    (day: Date) => isSameDay(day, activeDate),
    [activeDate],
  );

  // ── Fetch slots for a specific date ────────────────────────────────────────
  const fetchSlotsForDate = useCallback(
    async (dateStr: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/availability/slots?date=${dateStr}&professionalId=${professionalId}`,
        );
        if (!res.ok) throw new Error("Error al cargar disponibilidad");
        const data = await res.json();
        const daySlots: DaySlots = {
          date: dateStr,
          slots: data.slots ?? [],
        };
        setDaysMap((prev) => {
          const next = new Map(prev);
          next.set(dateStr, daySlots);
          return next;
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar horarios",
        );
      } finally {
        setLoading(false);
      }
    },
    [professionalId],
  );

  // ── Fetch active date's slots when it changes (or on mount) ───────────────
  useEffect(() => {
    if (!daysMap.has(activeDateStr)) {
      fetchSlotsForDate(activeDateStr);
    }
  }, [activeDateStr, fetchSlotsForDate, daysMap]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDayClick = useCallback(
    (day: Date) => {
      if (isDayDisabled(day)) return;
      if (!isSameMonth(day, currentMonth)) return;
      const isNewDay = !isSameDay(day, activeDate);
      setActiveDate(day);
      // Clear time selection when switching to a different date
      if (isNewDay) {
        onSlotSelect(day, "");
      }
    },
    [isDayDisabled, currentMonth, activeDate, onSlotSelect],
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleRetry = useCallback(() => {
    fetchSlotsForDate(activeDateStr);
  }, [fetchSlotsForDate, activeDateStr]);

  // ── Derive active slots from cache ─────────────────────────────────────────
  const activeSlots = useMemo(() => {
    const dayData = daysMap.get(activeDateStr);
    if (!dayData) return [];
    return dayData.slots.filter((s) => s.available);
  }, [daysMap, activeDateStr]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
      {/* ── Left panel: Monthly Calendar ──────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              disabled={!canGoPrev}
              className="size-8"
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Mes anterior</span>
            </Button>
            <h3 className="text-sm font-semibold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={!canGoNext}
              className="size-8"
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Mes siguiente</span>
            </Button>
          </div>

          {/* Day name headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAY_NAMES.map((name) => (
              <div
                key={name}
                className="py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const inMonth = isSameMonth(day, currentMonth);
              const disabled = isDayDisabled(day);
              const active = isDaySelected(day);
              const todayHighlight = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={disabled || !inMonth}
                  className={cn(
                    "relative h-9 w-full rounded-lg text-sm transition-colors",
                    // Days from prev/next month — barely visible
                    !inMonth && "text-muted-foreground/20",
                    // Disabled days (past or beyond max) — tachado + opacidad
                    disabled &&
                      inMonth &&
                      "cursor-not-allowed text-muted-foreground/30 bg-muted/30 line-through decoration-muted-foreground/20",
                    // Active day (clicked by user) — immediate highlight
                    active &&
                      !disabled &&
                      "bg-accent font-semibold text-accent-foreground",
                    // Today indicator (only if not active)
                    todayHighlight &&
                      !active &&
                      "border border-accent/50 font-medium",
                    // Hover for clickable unselected days
                    !disabled &&
                      inMonth &&
                      !active &&
                      "cursor-pointer hover:bg-secondary",
                    // Default text for in-month non-active days
                    !active &&
                      !todayHighlight &&
                      !disabled &&
                      inMonth &&
                      "text-foreground",
                  )}
                  aria-label={format(day, "EEEE d 'de' MMMM yyyy", {
                    locale: es,
                  })}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Right panel: Available slots ──────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 text-sm font-semibold">
            Horarios disponibles
            {!isDayDisabled(activeDate) && (
              <span className="font-normal text-muted-foreground">
                {" "}
                para el{" "}
                {format(activeDate, "d 'de' MMMM", { locale: es })}
              </span>
            )}
          </h3>

          {/* Loading state */}
          {loading && (
            <div className="flex h-40 items-center justify-center">
              <div className="animate-pulse text-sm text-muted-foreground">
                Cargando disponibilidad...
              </div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
              >
                <RefreshCw className="mr-1 size-3" />
                Reintentar
              </Button>
            </div>
          )}

          {/* Disabled day — no slots shown */}
          {!loading && !error && isDayDisabled(activeDate) && (
            <div className="flex h-40 items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-8 opacity-40" />
                <p>Fecha no disponible</p>
              </div>
            </div>
          )}

          {/* No slots available */}
          {!loading &&
            !error &&
            !isDayDisabled(activeDate) &&
            activeSlots.length === 0 && (
              <div className="flex h-40 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-8 opacity-40" />
                  <p>Sin horarios disponibles</p>
                </div>
              </div>
            )}

          {/* Slots grid */}
          {!loading &&
            !error &&
            !isDayDisabled(activeDate) &&
            activeSlots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeSlots.map((slot) => {
                  const isSlotSelected =
                    selectedDate &&
                    isSameDay(activeDate, selectedDate) &&
                    selectedTime === slot.time;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => onSlotSelect(activeDate, slot.time)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
                        isSlotSelected
                          ? "bg-accent text-accent-foreground ring-1 ring-accent"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {isSlotSelected && <Check className="size-3.5 shrink-0" />}
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
