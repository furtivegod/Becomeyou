import jwt from 'jsonwebtoken'

interface JwtPayload {
  sessionId: string
  email: string
}

export function verifyToken(token: string | undefined, sessionId: string): boolean {
  if (!token) return false
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    return decoded.sessionId === sessionId
  } catch (error) {
    console.error('Token verification failed:', error)
    return false
  }
}

export function generateToken(sessionId: string, email: string): string {
  return jwt.sign(
    { sessionId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  )
}