import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireOwner } from "@/lib/auth";
import { isDemo } from "@/lib/config";
export const dynamic = "force-dynamic";
export default async function TrackerLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireOwner();
  return <AppShell demo={isDemo()}>{children}</AppShell>;
}
