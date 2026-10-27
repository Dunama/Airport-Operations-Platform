import { ProtectedShell } from "@/components/layout/protected-shell";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedShell allow={["ground", "ops", "airline"]}>{children}</ProtectedShell>;
}
