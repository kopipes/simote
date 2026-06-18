import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const COOKIE_NAME = 'simote_token'
const EXPIRES_IN = '7d'

export interface JwtPayload {
  userId: string
  role: string
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionUser() {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })
  if (!user || !user.isActive) return null
  return user
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME
