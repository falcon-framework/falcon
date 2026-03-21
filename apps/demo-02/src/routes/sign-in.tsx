import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@falcon-framework/sdk/react'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <main className="page-wrap px-4 py-12">
      <SignIn afterSignInUrl="/" signUpUrl="/sign-up" />
    </main>
  )
}
