import { randomUUID } from "node:crypto";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { getLedger } from "@/features/bets/repository";
import { OptionForm } from "@/features/settings/option-form";
import { isDemo } from "@/lib/config";
export default async function SettingsPage() {
  const ledger = await getLedger();
  return (
    <>
      <PageHeading
        title="Settings"
        description="Keep your bookmakers and sources organised."
      />
      <div className="grid items-start gap-5 md:grid-cols-2">
        {(
          [
            ["bookmakers", "Bookmakers"],
            ["sources", "Sources & tipsters"],
          ] as const
        ).map(([kind, title]) => (
          <Card key={kind}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Archive entries by clearing Active. Existing bets retain their
                list reference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ledger[kind].map((option) => (
                <OptionForm
                  key={option.id}
                  kind={kind}
                  id={option.id}
                  option={option}
                />
              ))}
              <OptionForm kind={kind} id={randomUUID()} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Currency: GBP · Display time: Europe/London · Storage time: UTC
          </p>
          <p className="text-xs text-muted-foreground">
            To install on iPhone: open in Safari, tap Share, then Add to Home
            Screen.
          </p>
          {!isDemo() && (
            <form action={signOut}>
              <Button type="submit" variant="outline" className="h-11">
                Sign out
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
