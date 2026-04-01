import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/supabase-data';

// POST: Login (admin or user)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Username, password, and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      );
    }

    const result = await loginUser(username, password, role);

    if (!result) {
      if (role === 'admin') {
        return NextResponse.json(
          { success: false, error: 'Invalid admin credentials' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user: result.user, token: result.token });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
