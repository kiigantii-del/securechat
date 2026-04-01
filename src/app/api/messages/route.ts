import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import {
  getConversationMessages,
  createMessage,
  getUserConversations,
} from '@/lib/supabase-data';

// GET: Get messages for a conversation
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
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!conversationId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Both conversationId and userId are required' },
        { status: 400 }
      );
    }

    // Users can only fetch messages from conversations they are part of
    if (auth.role !== 'admin' && auth.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only view your own messages' },
        { status: 403 }
      );
    }

    // Verify conversation exists and user is a participant
    const conversations = await getUserConversations(userId);
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation && auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    const messages = await getConversationMessages(conversationId);

    return NextResponse.json({ success: true, messages });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST: Send a new message
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
    const { conversationId, senderId, content, type, replyToId } = body;

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { success: false, error: 'conversationId, senderId, and content are required' },
        { status: 400 }
      );
    }

    // Users can only send messages as themselves
    if (auth.role !== 'admin' && auth.userId !== senderId) {
      return NextResponse.json(
        { success: false, error: 'You can only send messages as yourself' },
        { status: 403 }
      );
    }

    // Verify conversation exists and user is a participant
    const conversations = await getUserConversations(senderId);
    const isParticipant = conversations.some(c => c.id === conversationId);
    if (!isParticipant && auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    const message = await createMessage({
      conversationId,
      senderId,
      content,
      type,
      replyToId,
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
