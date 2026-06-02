import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSession();

    return NextResponse.json({
      user: user ?? null,
    });
  } catch (error) {
    console.error('Session restore error:', error);
    return NextResponse.json({ user: null });
  }
}
