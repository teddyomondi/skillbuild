import { useState } from "react";
import { Item } from "./item";
import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";

const DocumentList = ({
  parentDocumentId = null,
  level = 0,
  shared = false,
  documents = [],
  activeDocumentId,
  onSelectDocument,
  onLaunchInIde,
}) => {
  const [expanded, setExpanded] = useState({
    "track-frontend": true,
    "track-backend": true,
    "track-fullstack-ai": true,
    "track-mathematics": true,
  });

  const onExpand = (documentId) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [documentId]: !prevExpanded[documentId],
    }));
  };

  const filtered = documents.filter(
    (doc) =>
      !doc.isArchived &&
      (doc.parentDocument || null) === parentDocumentId &&
      Boolean(doc.isShared) === Boolean(shared)
  );

  return (
    <>
      <p
        style={{ paddingLeft: level ? `${level * 12 + 25}px` : 12 }}
        className={cn(
        "hidden text-xs font-medium text-muted-foreground/80 py-1",
          expanded && filtered.length === 0 && "block",
          level === 0 && "hidden"
        )}
      >
        No modules yet
      </p>
      {filtered.map((document) => (
        <div key={document.id}>
          <Item
            id={document.id}
            onClick={() => {
              // Clicking a module under a course track opens the Learning Area (IDE) for that module!
              if (document.isLocked) return;
              if (document.isModuleDoc && document.trackId && document.nodeRef && onLaunchInIde) {
                onLaunchInIde(document.trackId, document.nodeRef);
              } else {
                onSelectDocument?.(document.id);
              }
            }}
            label={document.title}
            icon={FileIcon}
            documentIcon={document.icon}
            badgeText={document.badgeText}
            active={activeDocumentId === document.id}
            disabled={document.isLocked}
            level={level}
            onExpand={() => onExpand(document.id)}
            expanded={expanded[document.id]}
            onLaunchInIde={
              document.isModuleDoc && !document.isLocked && document.trackId && document.nodeRef
                ? () => onLaunchInIde?.(document.trackId, document.nodeRef)
                : undefined
            }
          />
          {expanded[document.id] && (
            <DocumentList
              parentDocumentId={document.id}
              level={level + 1}
              shared={shared}
              documents={documents}
              activeDocumentId={activeDocumentId}
              onSelectDocument={onSelectDocument}
              onLaunchInIde={onLaunchInIde}
            />
          )}
        </div>
      ))}
    </>
  );
};

export default DocumentList;
