import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, users } from '@/lib/db/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/api/auth-guard';
import { serverError } from '@/lib/api/errors';
import { format } from 'date-fns';

// ─── GET /api/patients/recent ────────────────────────────────────────────────
// Professional only: return the 5 most recent patients ordered by last visit.
export async function GET() {
  try {
    const session = await getSession();
    const auth = requireRole(session, 'professional');
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const profId = user.id;
    const today = format(new Date(), 'yyyy-MM-dd');

    // ── Step 1: Get patients with their most recent appointment date ────────
    const recentRows = await db
      .select({
        patientId: appointments.patientId,
        patientName: users.name,
        patientAvatar: users.avatar,
        lastVisit: sql<string>`MAX(${appointments.date})`,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(eq(appointments.professionalId, profId))
      .groupBy(appointments.patientId)
      .orderBy(desc(sql`MAX(${appointments.date})`))
      .limit(5);

    // ── Step 2: If fewer than 5, include patients without appointments ──────
    const recentPatientIds = recentRows.map((r) => r.patientId);

    if (recentRows.length < 5) {
      const remaining = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        })
        .from(users)
        .where(
          and(
            eq(users.role, 'patient'),
            recentPatientIds.length > 0
              ? sql`${users.id} NOT IN (${sql.join(recentPatientIds.map((id) => sql`${id}`), sql`, `)})`
              : sql`1=1`,
          ),
        )
        .orderBy(users.name)
        .limit(5 - recentRows.length);

      for (const pat of remaining) {
        recentRows.push({
          patientId: pat.id,
          patientName: pat.name,
          patientAvatar: pat.avatar,
          lastVisit: null as unknown as string,
        });
      }
    }

    // ── Step 3: For each patient, find their next upcoming appointment ──────
    const patients = await Promise.all(
      recentRows.map(async (row) => {
        const [nextApt] = await db
          .select({ date: appointments.date })
          .from(appointments)
          .where(
            and(
              eq(appointments.patientId, row.patientId),
              eq(appointments.professionalId, profId),
              eq(appointments.status, 'confirmed'),
              gte(appointments.date, today),
            ),
          )
          .orderBy(appointments.date)
          .limit(1);

        return {
          id: row.patientId,
          name: row.patientName,
          avatar: row.patientAvatar,
          lastVisit: row.lastVisit
            ? format(new Date(row.lastVisit), 'MMM d, yyyy')
            : 'First visit',
          nextAppointment: nextApt
            ? format(new Date(nextApt.date), 'MMM d, yyyy')
            : undefined,
        };
      }),
    );

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('[patients/recent] GET error:', error);
    return serverError(error);
  }
}
