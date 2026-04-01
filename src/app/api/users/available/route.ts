import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { getAllUsers } from '@/lib/supabase-data';

// GET: List users available for chat (authenticated users only, not admin-only)
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Valid token required.' },
      { status: 401 }
    );
  }

  try {
    const allUsers = await getAllUsers();
    // Filter out the requesting user and deleted users
    const availableUsers = allUsers.filter(
      (user) => user.id !== auth.userId && !user.isDeleted
    );
    return NextResponse.json({ success: true, users: availableUsers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
