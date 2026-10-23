import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useTheme } from "@/hooks/use-theme";

const IconPicker = ({ onChange, children, asChild }) => {
  const { resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || "light";
  const themeMap = {
    dark: Theme.DARK,
    light: Theme.LIGHT,
  };
  const theme = themeMap[currentTheme] || Theme.LIGHT;

  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>
      <PopoverContent className="p-0 w-full border-none shadow-none">
        <EmojiPicker
          theme={theme}
          height={350}
          onEmojiClick={(data) => onChange(data.emoji)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
