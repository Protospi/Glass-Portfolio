import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="glass-chip hover:bg-blue-500/20 transition-all duration-200 group border-0 bg-transparent"
      data-testid="button-theme-toggle"
    >
      {theme === "light" ? (
        <Sun className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:scale-110 transition-all" />
      ) : (
        <Moon className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:scale-110 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
