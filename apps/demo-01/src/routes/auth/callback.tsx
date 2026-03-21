import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { exchangeCodeForSession, sessionCookieName } from '@falcon-framework/sdk'
import { falconAuthConfig } from '#/lib/demo-env'
import { useEffect, useState } from 'react'
import { z } from 'zod'

const callbackSearchSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
})

export const Route = createFileRoute('/auth/callback')({
  validateSearch: callbackSearchSchema,
  component: CallbackPage,
})

function CallbackPage() {
  const { code, state } = Route.useSearch()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      setError('Missing authorization code in callback URL.')
      return
    }

    // Verify the state parameter to guard against CSRF
    const storedState = sessionStorage.getItem('falcon_auth_state')
    if (state && storedState !== state) {
      setError('State mismatch — possible CSRF attempt. Please try signing in again.')
      return
    }
    sessionStorage.removeItem('falcon_auth_state')

    exchangeCodeForSession(falconAuthConfig, { code })
      .then(({ sessionToken }) => {
        // Store the session token as a cookie so verifySession() can forward it
        // to the Falcon Auth server. Uses the per-app cookie name.
        const cookieName = sessionCookieName(falconAuthConfig.publishableKey)
        document.cookie = `${cookieName}=${sessionToken}; path=/; SameSite=None; Secure`
        void navigate({ to: '/dashboard' })
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to complete sign-in. Please try again.',
        )
      })
  // Run once on mount — code and state are stable URL params
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <main className="page-wrap px-4 py-12">
        <div className="mx-auto max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <h2 className="mb-2 text-base font-semibold text-red-800 dark:text-red-200">
            Sign-in failed
          </h2>
          <p className="mb-4 text-sm text-red-700 dark:text-red-300">{error}</p>
          <a
            href="/sign-in"
            className="text-sm font-semibold text-red-800 underline dark:text-red-200"
          >
            Try again
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap flex items-center justify-center px-4 py-12">
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </main>
  )
}
