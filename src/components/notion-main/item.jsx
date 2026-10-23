import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Play,
} from "lucide-react";

export const Item = ({
  id,
  documentIcon,
  active,
  disabled = false,
  expanded,
  isSearch,
  level = 0,
  label,
  icon: Icon,
  badgeText,
  onExpand,
  onClick,
  onLaunchInIde,
}) => {
  const documentPaddingLeft = level ? level * 12 + 12 : 12;
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  const handleExpand = (event) => {
    event.stopPropagation();
    onExpand?.();
  };

  return (
    <div
      role="button"
      aria-disabled={disabled}
      onClick={onClick}
      style={{ paddingLeft: `${documentPaddingLeft}px` }}
      className={cn(
        "group flex items-center space-x-1 text-sm min-h-[27px] py-1 pr-3 w-full hover:bg-primary/5 text-muted-foreground font-medium cursor-pointer",
        active && "bg-primary/5 text-primary",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {!!id && (
        <div
          role="button"
          className="h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 mr-1"
          onClick={handleExpand}
        >
          <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </div>
      )}
      {documentIcon ? (
        <div className="flex items-center min-w-0 flex-1">
          <div className="shrink-0 mr-2 text-[16px]">{documentIcon}</div>
          <span className="truncate">{label}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {Icon && <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />}
          <span className="truncate">{label}</span>
        </div>
      )}

      {badgeText && (
        <span className="ml-auto mr-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold shrink-0">
          {badgeText}
        </span>
      )}

      {isSearch && (
        <div className="hidden md:flex justify-end ml-auto">
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">CTRL</span>K
          </kbd>
        </div>
      )}

      {!!id && (
        <div className="ml-auto flex items-center gap-x-1 shrink-0">
          {onLaunchInIde && (
            <div
              role="button"
              title="Open in Interactive AI IDE"
              onClick={(e) => {
                e.stopPropagation();
                onLaunchInIde();
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
            >
              <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}

        </div>
      )}
    </div>
  );
};

Item.Skeleton = function ItemSkeleton({ level }) {
  const documentPaddingLeft = level ? level * 12 + 12 : 12;
  return (
    <div
      style={{ paddingLeft: `${documentPaddingLeft}px` }}
      className="flex gap-x-2 py-3"
    >
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-[30%]" />
    </div>
  );
};
