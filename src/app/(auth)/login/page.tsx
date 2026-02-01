import { Suspense } from "react"
import { LoginForm } from "./login-form"
import { AuthCard } from "@/components/auth/auth-card"
import { Skeleton } from "@/components/ui/skeleton"

function LoginFormSkeleton() {
  return (
    <AuthCard title="Willkommen zurück" description="Melde dich mit deinem Account an">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
