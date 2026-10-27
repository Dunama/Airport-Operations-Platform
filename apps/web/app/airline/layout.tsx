import { ProtectedShell } from "@/components/layout/protected-shell";

export default function AirlineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedShell allow={["airline"]}>{children}</ProtectedShell>;
}
