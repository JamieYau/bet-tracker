"use client";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { PendingLabel } from "@/components/pending-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/features/bets/types";
import { authClient } from "./client";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (_state, form) => {
      try {
        const result = await authClient.signIn.email({
          email: String(form.get("email") ?? "")
            .trim()
            .toLowerCase(),
          password: String(form.get("password") ?? ""),
          rememberMe: true,
        });
        if (result.error)
          return {
            error:
              result.error.status === 429
                ? "Too many attempts. Wait a minute and try again."
                : "Unable to sign in. Check your email and password.",
          };
        router.replace("/");
        router.refresh();
        return {};
      } catch {
        return { error: "Unable to sign in. Please try again." };
      }
    },
    {},
  );
  return (
    <form action={action} className="space-y-5">
      <Field>
        <FieldLabel htmlFor="email">Your email</FieldLabel>
        <Input
          className="h-11 text-base"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          className="h-11 text-base"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </Field>
      <Button
        type="submit"
        className="h-11 w-full"
        disabled={pending}
        aria-busy={pending}
      >
        <PendingLabel pending={pending} pendingText="Signing in…">
          Sign in
        </PendingLabel>
      </Button>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <p role="status" className="text-sm text-primary">
          {state.success}
        </p>
      )}
    </form>
  );
}
