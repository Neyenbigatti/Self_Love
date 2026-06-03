import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSession();

    // For patients, include a list of professionals they can book with
    let professionals = null;
    if (user?.role === 'patient') {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          title: users.title,
          clinicName: users.clinicName,
          avatar: users.avatar,
        })
        .from(users)
        .where(eq(users.role, 'professional'));
      professionals = rows;
    }

    return NextResponse.json({
      user: user ?? null,
      professionals,
    });
  } catch (error) {
    console.error('Session restore error:', error);
    return NextResponse.json({ user: null, professionals: null });
  }
}
