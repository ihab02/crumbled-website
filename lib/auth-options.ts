import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import db from './db';
import { JWT } from 'next-auth/jwt';
import { debugLog } from '@/lib/debug-utils';

interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
}

declare module 'next-auth' {
  interface Session {
    user: User;
  }
  interface User {
    firstName: string;
    lastName: string;
    phone: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        autoLogin: { label: 'Auto Login', type: 'text' }
      },
      async authorize(credentials) {
        await debugLog('NextAuth authorize called with email:', credentials?.email);
        
        // Check if this is an auto-login attempt (no password required)
        const isAutoLogin = credentials?.autoLogin === 'verified';
        
        if (!credentials?.email) {
          await debugLog('Missing email');
          return null;
        }
        
        if (!isAutoLogin && !credentials?.password) {
          await debugLog('Missing password for regular login');
          return null;
        }

        try {
          const [rows] = await db.query(
            'SELECT * FROM customers WHERE email = ?',
            [credentials.email]
          );

          const user = (rows as any[])[0];
          await debugLog('User found:', !!user);

          if (!user) {
            await debugLog('No user found with email:', credentials.email);
            return null;
          }

          await debugLog('User data:', {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            hasPassword: !!user.password
          });

          // For auto-login, skip password validation
          if (!isAutoLogin) {
            // Compare password with bcrypt
            const isPasswordValid = await compare(credentials.password, user.password);
            await debugLog('Password valid:', isPasswordValid);
            
            if (!isPasswordValid) {
              await debugLog('Invalid password for user:', credentials.email);
              return null;
            }
          }

          // Only check email verification if password is correct
          if (user.email_verified === 0 || user.email_verified === false) {
            await debugLog('Password correct but email not verified for user:', credentials.email);
            // Return null to indicate valid credentials but unverified email
            return null;
          }

          await debugLog('Authentication successful for user:', credentials.email);
          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          // Re-throw the error so NextAuth can handle it properly
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.phone = token.phone;
      }
      return session;
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      await debugLog('Sign in event:', { user: user?.email, isNewUser });
    },
    async signOut({ session, token }) {
      await debugLog('Sign out event');
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/signout'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'x+1DNU9w01MI2M7bNhUuI9F74OxrivACw4XemPMY8gE=',
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}; 