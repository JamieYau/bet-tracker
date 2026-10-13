"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function useMounted() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = resolvedTheme === "dark";
  const label = mounted
    ? `Switch to ${dark ? "light" : "dark"} mode`
    : "Change appearance";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative size-11"
      disabled={!mounted}
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
    </Button>
  );
}

export function ThemePreference() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <fieldset className="space-y-2" disabled={!mounted}>
      <legend className="text-sm font-medium">Appearance</legend>
      <div className="flex gap-2">
        {(["system", "light", "dark"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={mounted && theme === value ? "secondary" : "outline"}
            className="h-11 flex-1 sm:flex-none sm:min-w-24"
            aria-pressed={mounted && theme === value}
            onClick={() => setTheme(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        System follows your device. Your choice is saved in this browser.
      </p>
    </fieldset>
  );
}
