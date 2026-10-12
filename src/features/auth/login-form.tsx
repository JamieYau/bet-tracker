"use client";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "./actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-5">
      <Field>
        <FieldLabel htmlFor="email">Your email</FieldLabel>
        <Input
          className="h-11 text-base"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
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
