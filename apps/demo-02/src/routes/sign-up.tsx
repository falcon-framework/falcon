import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@falcon-framework/sdk/react'

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <main className="page-wrap px-4 py-12">
      <SignUp afterSignUpUrl="/org/create" signInUrl="/sign-in" />
    </main>
  )
}
