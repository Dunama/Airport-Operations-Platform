import { ProtectedShell } from "@/components/layout/protected-shell";

export default function GroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedShell allow={["ground", "ops"]}>{children}</ProtectedShell>;
}
