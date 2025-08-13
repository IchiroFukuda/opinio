/* eslint-disable @typescript-eslint/no-explicit-any */
import CredentialsProvider from 'next-auth/providers/credentials'
import { env } from './env'
import { createClient } from '@supabase/supabase-js'
import NextAuth from 'next-auth/next'
import { verifyPassword } from './auth-utils'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase()
        const password = credentials.password
        
        try {
          // Supabaseクライアントを作成
          const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
          
          // ユーザーが存在するかチェック（パスワードハッシュも含む）
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (error) {
            console.error('Supabase user fetch error:', error)
            return null
          }

          // ユーザーが存在しない場合
          if (!userData) {
            return null
          }

          // パスワードが設定されていない場合（既存のユーザー）
          if (!userData.password_hash) {
            return null
          }

          // パスワードを検証
          const isValidPassword = await verifyPassword(password, userData.password_hash)
          if (!isValidPassword) {
            return null
          }

          return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  secret: env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 
