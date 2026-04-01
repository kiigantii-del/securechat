import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { getAdminStats } from '@/lib/supabase-data';

// GET: Get admin dashboard stats (admin only)
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const stats = await getAdminStats();
    return NextResponse.json({ success: true, stats });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
