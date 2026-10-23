import { MenuIcon } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

const NavBar = ({ isCollapsed, onResetWidth, document }) => (
  <nav className="bg-background dark:bg-[#1F1F1F] px-4 py-2 w-full flex items-center justify-between gap-4 border-b border-border/60">
    <div className="flex items-center gap-2 min-w-0">
      {isCollapsed && (
        <button type="button" onClick={onResetWidth} aria-label="Open course navigation">
          <MenuIcon className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
      {document.icon && <span aria-hidden="true">{document.icon}</span>}
      <span className="truncate text-sm font-semibold text-foreground">
        {document.title}
      </span>
    </div>
    <ModeToggle />
  </nav>
);

export default NavBar;
