import { useEffect } from "react";
import { File, Play } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export const SearchCommand = ({
  documents = [],
  tracks = [],
  onSelectDocument,
  onLaunchLesson,
}) => {
  const toggle = useSearch((store) => store.toggle);
  const isOpen = useSearch((store) => store.isOpen);
  const onClose = useSearch((store) => store.onClose);

  useEffect(() => {
    const keyDown = (e) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", keyDown);
    return () => document.removeEventListener("keydown", keyDown);
  }, [toggle]);

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder="Search courses, modules, and notes..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {tracks.length > 0 && (
          <CommandGroup heading="Interactive Learning Modules">
            {tracks.flatMap((track) =>
              track.nodes.map((node) => (
                <CommandItem
                  key={`${track.id}-${node.id}`}
                  value={`${track.title} ${node.title} ${node.description}`}
                  title={node.title}
                  onSelect={() => {
                    onClose();
                    onLaunchLesson?.(track.id, node);
                  }}
                >
                  <Play className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="font-medium">{node.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground truncate">
                    — {track.title.split("(")[0]}
                  </span>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        )}
        <CommandGroup heading="Workspace Documents">
          {documents
            .filter((d) => !d.isArchived)
            .map((document) => (
              <CommandItem
                key={document.id}
                value={`${document.id}-${document.title}`}
                title={document.title}
                onSelect={() => {
                  onSelectDocument?.(document.id);
                  onClose();
                }}
              >
                {document.icon ? (
                  <p className="mr-2 text-[18px]">{document.icon}</p>
                ) : (
                  <File className="mr-2 h-4 w-4" />
                )}
                <span>{document.title}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
