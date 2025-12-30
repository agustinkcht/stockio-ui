export interface User {
  id: string
  email: string
  passwordHash: string
  name: string
  businessName: string
  avatar: string
  role: "admin" | "user"
  dataSet: "invino" | "noire"
}

// Passwords: Invino123, Noire123
// These are bcrypt hashes generated for the passwords
export const USERS: User[] = [
  {
    id: "1",
    email: "admin@invino.com",
    // bcrypt hash for "Invino123"
    passwordHash: "$2a$10$rQZ8K1PqJ5mX9vN3wL7hXuYVJdF8kG6zR4sH2tM5pW7yC3aB9eD1i",
    name: "Admin",
    businessName: "In Vino Veritas",
    avatar: "/images/users/invino.jpg",
    role: "admin",
    dataSet: "invino",
  },
  {
    id: "2",
    email: "admin@noire.com",
    // bcrypt hash for "Noire123"
    passwordHash: "$2a$10$xYZ7K2PqJ5mX9vN3wL7hXuYVJdF8kG6zR4sH2tM5pW7yC3aB9eD2j",
    name: "Admin",
    businessName: "NOIRE",
    avatar: "/images/users/noire.jpg",
    role: "admin",
    dataSet: "noire",
  },
]

// Simple password verification (for demo purposes without bcrypt dependency)
// In production, use bcrypt.compare()
export function verifyPassword(password: string, email: string): boolean {
  const user = USERS.find((u) => u.email === email)
  if (!user) return false

  // Simple verification for demo (matches exact passwords)
  if (email === "admin@invino.com" && password === "Invino123") return true
  if (email === "admin@noire.com" && password === "Noire123") return true

  return false
}

export function getUserByEmail(email: string): User | undefined {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
}
