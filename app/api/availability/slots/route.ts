import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { availability, appointments } from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { badRequest, serverError } from '@/lib/api/errors';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isTimeInRange(timeMinutes: number, rangeStart: string, rangeEnd: string): boolean {
  return timeMinutes >= timeToMinutes(rangeStart) && timeMinutes < timeToMinutes(rangeEnd);
}

function slotsOverlap(
  slotStart: number,
  slotEnd: number,
  aptStart: string,
  aptEnd: string,
): boolean {
  return slotStart < timeToMinutes(aptEnd) && slotEnd > timeToMinutes(aptStart);
}

// ─── GET /api/availability/slots ─────────────────────────────────────────────
// Calculate available 30-min slots for a given date and professional.
// Accessible by both roles (professionals checking their own availability,
// patients booking).
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional', 'patient');
    if (!('user' in auth)) return auth;

    // ── Parse query params ──────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const professionalId = searchParams.get('professionalId');
    const durationParam = searchParams.get('duration');

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return badRequest('date is required (YYYY-MM-DD)');
    }
    if (!professionalId || !professionalId.trim()) {
      return badRequest('professionalId is required');
    }

    // ── Parse optional duration param ────────────────────────────────────────
    let slotDuration = 30;
    if (durationParam) {
      const d = parseInt(durationParam, 10);
      if (isNaN(d) || d <= 0 || String(d) !== durationParam) {
        return badRequest('duration must be a positive integer');
      }
      if (d % 5 !== 0) {
        return badRequest('duration must be a multiple of 5');
      }
      slotDuration = d;
    }

    // ── Resolve day of week from date ───────────────────────────────────────
    const [y, m, d] = date.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();

    // ── Step 1: Query availability entries ──────────────────────────────────
    const entries = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.professionalId, professionalId),
          or(
            eq(availability.dayOfWeek, dayOfWeek),
            eq(availability.specificDate, date),
          ),
        ),
      );

    if (entries.length === 0) {
      return NextResponse.json({ slots: [], date, professionalId });
    }

    // ── Step 2: Separate by type ────────────────────────────────────────────
    const regular = entries.filter((e) => e.type === 'regular');
    const breaks = entries.filter((e) => e.type === 'break');
    const blocked = entries.filter((e) => e.type === 'blocked');

    // If the date has a blocked exception, return empty slots
    const dateBlocked = blocked.some((e) => e.specificDate === date);
    if (dateBlocked) {
      return NextResponse.json({ slots: [], date, professionalId });
    }

    if (regular.length === 0) {
      return NextResponse.json({ slots: [], date, professionalId });
    }

    // ── Step 3: Generate slots at 30-min granularity from regular entries ───
    const slotEntries: { time: string }[] = [];

    for (const entry of regular) {
      const start = timeToMinutes(entry.startTime);
      const end = timeToMinutes(entry.endTime);
      for (let t = start; t < end; t += 30) {
        const h = Math.floor(t / 60);
        const m = t % 60;
        slotEntries.push({
          time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        });
      }
    }

    // Sort slots chronologically — entries come from DB in insertion order
    // but must be presented to the patient in ascending time order.
    slotEntries.sort((a, b) => a.time.localeCompare(b.time));

    // ── Step 6: Fetch existing appointments for the date/professional ──────
    const existingAppointments = await db
      .select({ startTime: appointments.startTime, endTime: appointments.endTime })
      .from(appointments)
      .where(
        and(
          eq(appointments.professionalId, professionalId),
          eq(appointments.date, date),
          inArray(appointments.status, ['pending', 'confirmed']),
        ),
      );

    // ── Steps 4–6: Compute availability — duration-aware ─────────────────────
    const slots = slotEntries.map((slot) => {
      const slotStart = timeToMinutes(slot.time);
      const slotEnd = slotStart + slotDuration;

      // Check break ranges (overlap-aware for duration)
      const inBreak = breaks.some((b) =>
        slotsOverlap(slotStart, slotEnd, b.startTime, b.endTime),
      );
      if (inBreak) return { time: slot.time, available: false };

      // Check blocked ranges (overlap-aware for duration)
      const inBlocked = blocked.some((b) =>
        slotsOverlap(slotStart, slotEnd, b.startTime, b.endTime),
      );
      if (inBlocked) return { time: slot.time, available: false };

      // Check existing appointments
      const overlapsAppointment = existingAppointments.some((apt) =>
        slotsOverlap(slotStart, slotEnd, apt.startTime, apt.endTime),
      );
      if (overlapsAppointment) return { time: slot.time, available: false };

      return { time: slot.time, available: true };
    });

    return NextResponse.json({ slots, date, professionalId });
  } catch (error) {
    console.error('[slots] GET error:', error);
    return serverError(error);
  }
}
