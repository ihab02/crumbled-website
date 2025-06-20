import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { databaseService } from "@/lib/services/databaseService"
import { compare } from "bcrypt"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          // Get customer from database
          const [customers] = await databaseService.query(
            'SELECT id, email, password_hash, first_name, last_name, phone FROM customers WHERE email = ?',
            [credentials.email]
          )

          if (!customers || customers.length === 0) {
            throw new Error("Invalid credentials")
          }

          const customer = customers[0]

          // Compare password
          const isValid = await compare(credentials.password, customer.password_hash)

          if (!isValid) {
            throw new Error("Invalid credentials")
          }

          return {
            id: customer.id.toString(),
            email: customer.email,
            name: `${customer.first_name} ${customer.last_name}`,
            phone: customer.phone
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw new Error("Authentication failed")
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
        session.user.phone = token.phone
      }
      return session
    }
  }
})

export { handler as GET, handler as POST } 