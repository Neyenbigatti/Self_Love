"use client";

import { useState } from "react";
import { format, addDays, isSameDay, startOfWeek, isAfter, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { timeSlots } from "@/lib/mock-data";

interface BookingCalendarProps {
  onSlotSelect: (date: Date, time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

// Generate available slots (mock - some slots randomly unavailable)
const generateAvailableSlots = (date: Date) => {
  const dayOfWeek = date.getDay();
  // Weekend has fewer slots
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return timeSlots.slice(2, 8).filter(() => Math.random() > 0.3);
  }
  // Weekday - more slots available
  return timeSlots.filter(() => Math.random() > 0.25);
};

export function BookingCalendar({
  onSlotSelect,
  selectedDate,
  selectedTime,
}: BookingCalendarProps) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(startOfWeek(today, { weekStartsOn: 1 }));
  const [hoveredSlot, setHoveredSlot] = useState<{ date: Date; time: string } | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const navigateWeek = (direction: "prev" | "next") => {
    setWeekStart((prev) =>
      direction === "next" ? addDays(prev, 7) : addDays(prev, -7)
    );
  };

  const canGoBack = isAfter(weekStart, today);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Date & Time</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek("prev")}
              disabled={!canGoBack}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Previous week</span>
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek("next")}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Next week</span>
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
                  isToday && !isSelected && "bg-secondary"
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wide">
                  {format(day, "EEE")}
                </span>
                <span className={cn(
                  "mt-1 text-lg font-semibold",
                  isSelected ? "text-accent-foreground" : "text-foreground"
                )}>
                  {format(day, "d")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const isPast = isBefore(day, today) && !isSameDay(day, today);
            const availableSlots = isPast ? [] : generateAvailableSlots(day);

            return (
              <div key={day.toISOString()} className="flex flex-col gap-1">
                {availableSlots.length > 0 ? (
                  availableSlots.slice(0, 6).map((time) => {
                    const isSelected =
                      selectedDate &&
                      isSameDay(day, selectedDate) &&
                      selectedTime === time;
                    const isHovered =
                      hoveredSlot &&
                      isSameDay(day, hoveredSlot.date) &&
                      hoveredSlot.time === time;

                    return (
                      <button
                        key={`${day.toISOString()}-${time}`}
                        onClick={() => onSlotSelect(day, time)}
                        onMouseEnter={() => setHoveredSlot({ date: day, time })}
                        onMouseLeave={() => setHoveredSlot(null)}
                        className={cn(
                          "flex items-center justify-center rounded-md px-1 py-1.5 text-xs font-medium transition-all",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : isHovered
                            ? "bg-secondary text-foreground"
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {isSelected ? (
                          <Check className="size-3" />
                        ) : (
                          time
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="flex h-20 items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      {isPast ? "-" : "Full"}
                    </span>
                  </div>
                )}
                {availableSlots.length > 6 && (
                  <span className="text-center text-xs text-muted-foreground">
                    +{availableSlots.length - 6} more
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Summary */}
        {selectedDate && selectedTime && (
          <div className="mt-6 rounded-lg bg-accent/10 p-4">
            <p className="text-sm font-medium text-foreground">
              Selected Appointment
            </p>
            <p className="mt-1 text-lg font-semibold text-accent">
              {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
