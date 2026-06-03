import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, users } from '@/lib/db/schema';
import { eq, and, gte, lte, ne, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { serverError } from '@/lib/api/errors';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, format } from 'date-fns';

// ─── GET /api/dashboard/stats ────────────────────────────────────────────────
// Professional only: return aggregated statistics for the dashboard.
export async function GET() {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');

    // Trend comparison periods
    const sameDayLastWeek = format(subDays(now, 7), 'yyyy-MM-dd');
    const lastWeekStart = format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const lastWeekEnd = format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const profId = user.id;

    // ── Run all queries in parallel ─────────────────────────────────────────
    const [
      [{ count: todayCount }],
      [{ count: todayCompleted }],
      [{ count: weekConfirmed }],
      [{ count: pendingCount }],
      [{ count: totalPats }],
      [{ count: newThisMonth }],
      [{ count: lastWeekTodayCount }],
      [{ count: lastWeekConfirmedCount }],
      [{ count: patientsBeforeMonth }],
    ] = await Promise.all([
      // Today's non-cancelled appointments
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            eq(appointments.professionalId, profId),
            eq(appointments.date, today),
            ne(appointments.status, 'cancelled'),
          ),
        ),

      // Today's completed
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            eq(appointments.professionalId, profId),
            eq(appointments.date, today),
            eq(appointments.status, 'completed'),
          ),
        ),

      // This week's confirmed
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            eq(appointments.professionalId, profId),
            gte(appointments.date, weekStart),
            lte(appointments.date, weekEnd),
            eq(appointments.status, 'confirmed'),
          ),
        ),

      // All pending
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(eq(appointments.professionalId, profId), eq(appointments.status, 'pending')),
        ),

      // Total patients
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'patient')),

      // New patients this month
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(eq(users.role, 'patient'), gte(users.createdAt, monthStart)),
        ),

      // Same day last week (for trend)
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            eq(appointments.professionalId, profId),
            eq(appointments.date, sameDayLastWeek),
            ne(appointments.status, 'cancelled'),
          ),
        ),

      // Last week confirmed (for trend)
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            eq(appointments.professionalId, profId),
            gte(appointments.date, lastWeekStart),
            lte(appointments.date, lastWeekEnd),
            eq(appointments.status, 'confirmed'),
          ),
        ),

      // Patients before this month (for trend)
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, 'patient'), lte(users.createdAt, monthStart))),
    ]);

    // ── Compute trend percentages ───────────────────────────────────────────
    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return NextResponse.json({
      stats: {
        appointmentsToday: todayCount,
        appointmentsTodayCompleted: todayCompleted,
        confirmedThisWeek: weekConfirmed,
        pendingCount,
        totalPatients: totalPats,
        newPatientsThisMonth: newThisMonth,
        trends: {
          appointmentsToday: calcTrend(Number(todayCount), Number(lastWeekTodayCount)),
          confirmedThisWeek: calcTrend(Number(weekConfirmed), Number(lastWeekConfirmedCount)),
          totalPatients: calcTrend(Number(totalPats), Number(patientsBeforeMonth)),
        },
      },
    });
  } catch (error) {
    console.error('[dashboard/stats] GET error:', error);
    return serverError(error);
  }
}
