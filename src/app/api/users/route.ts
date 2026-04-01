import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserByUsername,
} from '@/lib/supabase-data';

// GET: List all users (admin only)
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({ success: true, users });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST: Create new user (admin only)
export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { username, displayName, password, bio, avatarUrl } = body;

    if (!username || !displayName || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, displayName, and password are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    const user = await createUser({
      username,
      displayName,
      password,
      bio,
      avatarUrl,
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid request body';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

// PUT: Update user (admin only)
export async function PUT(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent updating sensitive fields directly
    const { role, isDeleted, createdAt, ...safeUpdates } = updates;

    const updatedUser = await updateUser(id, safeUpdates);
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// DELETE: Soft delete user (admin only)
export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID query parameter is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteUser(userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
