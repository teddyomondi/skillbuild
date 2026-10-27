import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { ArrowLeft, ChevronLeftSquare, MenuIcon, Search, Settings } from "lucide-react";
import { navigateToRoute } from "@/services/routeManager.js";
import { useSearch } from "@/hooks/use-search";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import DocumentList from "./document-list";
import { Item } from "./item";
import Navbar from "./navbar";
import { UserItem } from "./user-item";

export const Navigation = ({
  documents = [],
  activeDocumentId,
  onSelectDocument,
  onLaunchInIde,
  onBackToSubjects,
}) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const isResizingRef = useRef(false);
  const sidebarRef = useRef(null);
  const navbarRef = useRef(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const onOpenSearchBox = useSearch((store) => store.onOpen);
  const onOpenSettings = useSettings((store) => store.onOpen);
  const activeDoc = documents.find((doc) => doc.id === activeDocumentId) || null;

  const collapse = () => {
    setIsCollapsed(true);
    setIsResetting(true);
    if (sidebarRef.current) sidebarRef.current.style.width = "0";
    if (navbarRef.current) {
      navbarRef.current.style.setProperty("width", "100%");
      navbarRef.current.style.setProperty("left", "0");
    }
    setTimeout(() => setIsResetting(false), 300);
  };

  const resetWidth = () => {
    setIsCollapsed(false);
    setIsResetting(true);
    if (sidebarRef.current) sidebarRef.current.style.width = isMobile ? "100%" : "240px";
    if (navbarRef.current) {
      navbarRef.current.style.setProperty("width", isMobile ? "0" : "calc(100% - 240px)");
      navbarRef.current.style.setProperty("left", isMobile ? "100%" : "240px");
    }
    setTimeout(() => setIsResetting(false), 300);
  };

  const handleMouseDown = (event) => {
    event.preventDefault();
    isResizingRef.current = true;
    const handleMouseMove = (moveEvent) => {
      if (!isResizingRef.current || !sidebarRef.current || !navbarRef.current) return;
      const width = Math.min(480, Math.max(240, moveEvent.clientX));
      sidebarRef.current.style.width = `${width}px`;
      navbarRef.current.style.setProperty("left", `${width}px`);
      navbarRef.current.style.setProperty("width", `calc(100% - ${width}px)`);
    };
    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    if (isMobile) collapse();
    else resetWidth();
    // Resize the course navigation when the screen crosses the mobile breakpoint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "group/sidebar h-full bg-secondary overflow-y-auto relative flex flex-col w-60 z-[300] overflow-x-hidden shrink-0",
          isResetting && "transition-all ease-in-out duration-300",
          isMobile && "w-0"
        )}
      >
        <button
          type="button"
          onClick={collapse}
          aria-label="Collapse course navigation"
          className={cn(
            "h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition",
            isMobile && "opacity-100"
          )}
        >
          <ChevronLeftSquare className="h-6 w-6" />
        </button>

        <div className="pt-1">
          <UserItem />
          <Item onClick={onOpenSearchBox} icon={Search} label="Search courses" isSearch />
          <Item onClick={onOpenSettings} icon={Settings} label="Settings" />
        </div>

        <div className="mt-5">
          <h2 className="flex items-center justify-center my-1 bg-background/80 text-xs font-medium py-1">
            COURSES
          </h2>
          <DocumentList
            shared
            documents={documents}
            activeDocumentId={activeDocumentId}
            onSelectDocument={onSelectDocument}
            onLaunchInIde={onLaunchInIde}
          />
        </div>

        <div className="mt-auto border-t border-border/70 p-3">
          <button
            type="button"
            onClick={onBackToSubjects}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-background hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Choose a subject</span>
          </button>
        </div>

        <div
          onMouseDown={handleMouseDown}
          className="opacity-0 group-hover/sidebar:opacity-100 transition cursor-ew-resize absolute w-1 h-full bg-primary/10 right-0 top-0"
        />
      </aside>

      <div
        ref={navbarRef}
        className={cn(
          "absolute top-0 z-[200] left-60 w-[calc(100%-240px)]",
          isResetting && "transition-all ease-in-out duration-300",
          isMobile && "left-0 w-full"
        )}
      >
        {activeDoc ? (
          <Navbar
            isCollapsed={isCollapsed}
            onResetWidth={resetWidth}
            document={activeDoc}
          />
        ) : (
          <nav className="bg-background px-3 py-2 w-full">
            {isCollapsed && <MenuIcon role="button" onClick={resetWidth} className="h-6 w-6 text-muted-foreground cursor-pointer" />}
          </nav>
        )}
      </div>
    </>
  );
};
