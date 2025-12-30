import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    businessName: string
    avatar: string
    dataSet: "invino" | "noire"
    role: "admin" | "user"
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    businessName: string
    avatar: string
    dataSet: "invino" | "noire"
    role: "admin" | "user"
  }
}
