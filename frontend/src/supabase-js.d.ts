/**
 * @supabase/supabase-js 모듈 타입 선언
 * Vercel 빌드 환경에서 패키지 해석 실패 시 TypeScript가 이 선언을 사용합니다.
 */
declare module '@supabase/supabase-js' {
  export type Provider = 'kakao' | 'google' | 'facebook' | 'apple' | string

  export interface AuthSession {
    access_token: string
    refresh_token?: string
    user: {
      id: string
      app_metadata?: { provider?: string } | undefined
    }
  }

  export interface AuthClient {
    signInWithOAuth(options: {
      provider: Provider
      options?: { redirectTo?: string }
    }): Promise<{ data: unknown; error: Error | null }>
    getSession(): Promise<{ data: { session: AuthSession | null }; error: Error | null }>
    signOut(): Promise<{ error: Error | null }>
    getUser(): Promise<{ data: { user: unknown }; error: Error | null }>
    refreshSession(): Promise<{ data: { session: AuthSession | null }; error: Error | null }>
  }

  export interface SupabaseClient {
    auth: AuthClient
  }

  export function createClient(
    url: string,
    key: string,
    options?: unknown
  ): SupabaseClient
}
