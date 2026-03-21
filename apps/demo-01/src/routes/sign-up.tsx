import { createFileRoute,Navigate } from '@tanstack/react-router'
import { SignUp,useFalconAuth } from '@falcon-framework/sdk/react'

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  const { isSignedIn } = useFalconAuth();
  if (isSignedIn) {
    return (
      <main className="page-wrap px-4 py-12">
        <p>You are already signed in</p>
        <Navigate to="/dashboard" />
      </main>
    )
  }
  return (
    <main className="page-wrap px-4 py-12">
      <SignUp afterSignUpUrl="/org/create" signInUrl="/sign-in" />
    </main>
  )
}
