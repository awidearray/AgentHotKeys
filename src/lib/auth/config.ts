import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { env } from '@/lib/env';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';

// Logging utility for auth events
function logAuthEvent(event: string, details: any = {}) {
  console.log(`[AUTH] ${event}:`, JSON.stringify(details, null, 2));
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logAuthEvent('CREDENTIALS_MISSING', { email: !!credentials?.email });
          return null;
        }

        try {
          const result = await safeDbOperation(async () => {
            return await supabaseAdmin
              .from('users')
              .select('id, email, name, password_hash, role, avatar_url, is_verified')
              .eq('email', credentials.email)
              .single();
          });

          if (!result.success || !result.data) {
            logAuthEvent('USER_NOT_FOUND', { email: credentials.email });
            return null;
          }

          const user = result.data as any;
          
          if (!user.password_hash) {
            logAuthEvent('NO_PASSWORD_HASH', { userId: user.id });
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            logAuthEvent('INVALID_PASSWORD', { userId: user.id });
            return null;
          }

          logAuthEvent('LOGIN_SUCCESS', { userId: user.id, role: user.role });
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar_url,
          };
        } catch (error) {
          logAuthEvent('LOGIN_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
          return null;
        }
      }
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    })] : []),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? [GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    })] : []),
    CredentialsProvider({
      id: 'api-key',
      name: 'API Key',
      credentials: {
        apiKey: { label: "API Key", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.apiKey) {
          return null;
        }

        try {
          const userResult = await safeDbOperation(async () => {
            return await supabaseAdmin
              .from('users')
              .select('*')
              .eq('api_key', credentials.apiKey)
              .eq('role', 'ai_agent')
              .single();
          });

          if (!userResult.success || !userResult.data) {
            logAuthEvent('API_KEY_USER_NOT_FOUND', { apiKeyLength: credentials.apiKey?.length || 0 });
            return null;
          }

          const user = userResult.data as any;

          const agentResult = await safeDbOperation(async () => {
            return await supabaseAdmin
              .from('ai_agents')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .single();
          });

          if (!agentResult.success || !agentResult.data) {
            logAuthEvent('AI_AGENT_NOT_FOUND', { userId: user.id });
            return null;
          }

          const agent = agentResult.data as any;

          logAuthEvent('API_KEY_LOGIN_SUCCESS', { userId: user.id, agentName: agent.agent_name });

          return {
            id: user.id,
            email: user.email,
            name: agent.agent_name,
            role: 'ai_agent',
            image: user.avatar_url,
          };
        } catch (error) {
          logAuthEvent('API_KEY_LOGIN_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
          return null;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.apiKey = token.apiKey as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        
        if ((user as any).role === 'ai_agent') {
          const apiKeyResult = await safeDbOperation(async () => {
            return await supabaseAdmin
              .from('users')
              .select('api_key')
              .eq('id', (user as any).id)
              .single();
          });
          
          if (apiKeyResult.success && apiKeyResult.data) {
            token.apiKey = (apiKeyResult.data as any).api_key;
          }
        }
      }

      if (account && (account.provider === 'google' || account.provider === 'github')) {
        try {
          const existingUserResult = await safeDbOperation(async () => {
            return await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', user?.email)
              .single();
          });

          if (!existingUserResult.success || !existingUserResult.data) {
            // Create new user for OAuth login
            const newUserResult = await safeDbOperation(async () => {
              return await supabaseAdmin
                .from('users')
                .insert({
                  email: user?.email,
                  name: user?.name,
                  avatar_url: user?.image,
                  role: 'human',
                  github_username: account.provider === 'github' ? user?.name : null,
                })
                .select()
                .single();
            });

            if (newUserResult.success && newUserResult.data) {
              token.id = (newUserResult.data as any).id;
              token.role = (newUserResult.data as any).role;
              logAuthEvent('OAUTH_USER_CREATED', { userId: (newUserResult.data as any).id, provider: account.provider });
            } else {
              logAuthEvent('OAUTH_USER_CREATE_FAILED', { error: newUserResult.error, provider: account.provider });
            }
          } else {
            token.id = (existingUserResult.data as any).id;
            token.role = (existingUserResult.data as any).role;
            logAuthEvent('OAUTH_LOGIN_SUCCESS', { userId: (existingUserResult.data as any).id, provider: account.provider });
          }
        } catch (error) {
          logAuthEvent('OAUTH_ERROR', { error: error instanceof Error ? error.message : 'Unknown error', provider: account.provider });
        }
      }

      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
};