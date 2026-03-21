import { createFileRoute } from '@tanstack/react-router'
import { exchangeCodeForSession, fetchFalconSession } from '@falcon-framework/sdk'
import { falconAuthConfig } from '#/lib/demo-env'
import { completeAuthCallback } from '#/lib/auth-callback'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedState = sessionStorage.getItem('falcon_auth_state')
    sessionStorage.removeItem('falcon_auth_state')

    completeAuthCallback({
      code,
      state,
      storedState,
      exchangeCode: (authCode) => exchangeCodeForSession(falconAuthConfig, { code: authCode }),
      getSession: async () => ({ data: await fetchFalconSession(falconAuthConfig) }),
    })
      .then(() => {
        window.location.replace('/dashboard')
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
  }, [code, state])

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
