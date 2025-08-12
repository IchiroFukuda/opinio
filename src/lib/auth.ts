import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { env } from './env'
import { createClient } from '@supabase/supabase-js'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        const email = credentials.email.toLowerCase()
        
        try {
          // Supabaseクライアントを作成
          const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
          
          // 既存ユーザーを確認
          const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (selectError && selectError.code !== 'PGRST116') {
            console.error('User select error:', selectError)
            return null
          }

          if (existingUser) {
            // 既存ユーザーの場合
            return {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name || email.split('@')[0],
            }
          } else {
            // 新規ユーザーの場合、usersテーブルに作成
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: email,
                name: email.split('@')[0],
                email_verified: new Date().toISOString()
              })
              .select()
              .single()

            if (insertError) {
              console.error('User insert error:', insertError)
              return null
            }

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: env.NEXTAUTH_SECRET,
} 
