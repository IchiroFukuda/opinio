/* eslint-disable @typescript-eslint/no-explicit-any */
import CredentialsProvider from 'next-auth/providers/credentials'
import { env } from './env'
import { createClient } from '@supabase/supabase-js'
import NextAuth from 'next-auth/next'

export const authOptions = {
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
          
          // ユーザーが存在するかチェック
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Supabase user fetch error:', error)
            return null
          }

          // ユーザーが存在しない場合は作成
          let user = userData
          if (!user) {
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert([
                {
                  id: email,
                  email: email,
                  name: email.split('@')[0],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ])
              .select()
              .single()

            if (createError) {
              console.error('User creation error:', createError)
              return null
            }

            user = newUser
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
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
  pages: {
    signIn: '/login',
  },
  secret: env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const nextAuth = NextAuth(authOptions)
export const { auth } = nextAuth
export const { GET, POST } = nextAuth 
