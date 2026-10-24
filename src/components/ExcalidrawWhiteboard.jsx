import React, { useState, useEffect, useMemo } from 'react';
import Spinner from '@/components/ui/spinner.jsx';
import '@excalidraw/excalidraw/index.css';

/**
 * Excalidraw Digital Whiteboard
 * Open-source infinite canvas with native drawing, shape, text, and arrow tools.
 * Custom styled to hide default Excalidraw hamburger and library UI.
 */
export default function ExcalidrawWhiteboard({
  initialElements = [],
  onBoardChange = null,
  renderTopRightUI = null,
  children = null,
}) {
  const [ExcalidrawComp, setExcalidrawComp] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let mounted = true;
    import('@excalidraw/excalidraw')
      .then((mod) => {
        if (mounted) {
          setExcalidrawComp(() => mod.Excalidraw);
        }
      })
      .catch((err) => {
        console.error('Failed to load Excalidraw:', err);
        if (mounted) setLoadError(err.message || 'Failed to load Excalidraw');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const initialData = useMemo(() => ({
    elements: initialElements || [],
    appState: {
      viewBackgroundColor: '#18181b',
      theme: 'dark',
      gridSize: 20,
    },
  }), []);

  if (loadError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p className="text-sm font-medium text-destructive mb-2">Error loading whiteboard</p>
        <p className="text-xs">{loadError}</p>
      </div>
    );
  }

  if (!ExcalidrawComp) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="excalidraw-custom-wrapper relative h-full w-full overflow-hidden">
      <style>{`
        /* Hide Excalidraw default hamburger menu and library sidebar buttons */
        .excalidraw-custom-wrapper .main-menu-trigger,
        .excalidraw-custom-wrapper [data-testid="main-menu-trigger"],
        .excalidraw-custom-wrapper button[aria-label="Main menu"],
        .excalidraw-custom-wrapper .sidebar-trigger,
        .excalidraw-custom-wrapper [data-testid="sidebar-trigger"],
        .excalidraw-custom-wrapper button[aria-label="Library"],
        .excalidraw-custom-wrapper .dropdown-menu-button {
          display: none !important;
        }
      `}</style>
      <ExcalidrawComp
        initialData={initialData}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: false,
          },
        }}
        renderTopRightUI={renderTopRightUI}
        onChange={(elements, appState) => {
          onBoardChange?.({ elements, appState });
        }}
      >
        {children}
      </ExcalidrawComp>
    </div>
  );
}
