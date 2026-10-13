import { Wallet } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { hasAuthentication, isDemo } from "@/lib/config";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4">
          <Wallet className="size-9 text-primary" />
          <CardTitle className="text-2xl">Your private bet ledger</CardTitle>
          <CardDescription className="text-sm leading-6 text-muted-foreground">
            One place to record your bets and understand your returns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!hasAuthentication() && (
            <Alert>
              <AlertDescription>
                Private login is awaiting account setup. See the repository
                setup guide.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error === "access"
                  ? "This account is not provisioned for this app."
                  : "Unable to verify your session. Please sign in again."}
              </AlertDescription>
            </Alert>
          )}
          <LoginForm />
          {isDemo() && (
            <Link
              className="block text-center text-sm font-medium text-primary underline"
              href="/"
            >
              Continue to local demo
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
