"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "cn";

import { useTheme } from "@/lib/use-theme";
import { Button } from "@/components/ui/button";

/**
 * Icons swap with CSS (not JS state) so server HTML and first client paint
 * always agree, whichever theme the visitor has.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { toggle } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Switch between light and dark mode"
      className={cn(className)}
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}
