import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import {
  getUserConversations,
  createDirectConversation,
  getUserById,
} from '@/lib/supabase-data';

// GET: Get conversations for authenticated user
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Valid token required.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Users can only fetch their own conversations
    if (auth.role !== 'admin' && auth.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only view your own conversations' },
        { status: 403 }
      );
    }

    const conversations = await getUserConversations(userId);

    return NextResponse.json({ success: true, conversations });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST: Start new direct conversation
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Valid token required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { userId1, userId2 } = body;

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { success: false, error: 'Both userId1 and userId2 are required' },
        { status: 400 }
      );
    }

    if (userId1 === userId2) {
      return NextResponse.json(
        { success: false, error: 'Cannot create a conversation with yourself' },
        { status: 400 }
      );
    }

    // Users can only create conversations involving themselves
    if (auth.role !== 'admin' && auth.userId !== userId1 && auth.userId !== userId2) {
      return NextResponse.json(
        { success: false, error: 'You can only create conversations involving yourself' },
        { status: 403 }
      );
    }

    // Verify both users exist
    const user1 = await getUserById(userId1);
    const user2 = await getUserById(userId2);

    if (!user1 || user1.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'User not found: ' + userId1 },
        { status: 404 }
      );
    }

    if (!user2 || user2.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'User not found: ' + userId2 },
        { status: 404 }
      );
    }

    const conversation = await createDirectConversation(userId1, userId2);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, conversation }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
