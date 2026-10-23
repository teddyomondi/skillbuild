import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "./button";

export const ModeToggleSwitch = () => {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <Button
      className="border rounded-sm"
      size="icon"
      variant="ghost"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
};
