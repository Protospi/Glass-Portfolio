import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";


export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="glass-chip hover:bg-blue-500/20 transition-all duration-200 group border-0 bg-transparent"
      data-testid="button-theme-toggle"
      title={t('tooltips.themeToggle')}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:scale-110 transition-all" />
      ) : (
        <Sun className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:scale-110 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
