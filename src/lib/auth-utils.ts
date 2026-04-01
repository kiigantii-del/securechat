// ============================================
// SecureChat - Auth Utility Functions (Server-side only)
// ============================================

import { NextRequest } from 'next/server';

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'user';
  exp: number;
}

export function createToken(userId: string, role: 'admin' | 'user'): string {
  const payload: TokenPayload = {
    userId,
    role,
    exp: Date.now() + 86400000, // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const payload: TokenPayload = JSON.parse(decoded);

    if (payload.exp && Date.now() > payload.exp) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

export function getAuthPayload(request: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAdmin(request: NextRequest): TokenPayload | null {
  const payload = getAuthPayload(request);
  if (!payload || payload.role !== 'admin') {
    return null;
  }
  return payload;
}

export function requireAuth(request: NextRequest): TokenPayload | null {
  const payload = getAuthPayload(request);
  if (!payload) {
    return null;
  }
  return payload;
}
