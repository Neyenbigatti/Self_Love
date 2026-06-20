import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSession();

    let emailVerified = false;
    let professionals = null;

    if (user) {
      // Check email verification status
      const [verified] = await db
        .select({ id: verificationTokens.id })
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.userId, user.id),
            eq(verificationTokens.type, 'email_verification'),
            sql`${verificationTokens.usedAt} IS NOT NULL`,
          ),
        )
        .limit(1);

      emailVerified = !!verified;

      // For patients, include a list of professionals they can book with
      if (user.role === 'patient') {
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
    }

    return NextResponse.json({
      user: user ?? null,
      emailVerified,
      professionals,
    });
  } catch (error) {
    console.error('Session restore error:', error);
    return NextResponse.json({ user: null, emailVerified: false, professionals: null });
  }
}
