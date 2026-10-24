import React, { useState, useEffect } from 'react';
import Spinner from '@/components/ui/spinner.jsx';
import '@excalidraw/excalidraw/index.css';

/**
 * Excalidraw Digital Whiteboard
 * Pure open-source infinite canvas with native drawing, shape, text, and arrow tools.
 */
export default function ExcalidrawWhiteboard({
  initialElements = [],
  onBoardChange = null,
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
    <div className="relative h-full w-full min-h-[400px] overflow-hidden">
      <ExcalidrawComp
        initialData={{
          elements: initialElements || [],
          appState: {
            viewBackgroundColor: '#18181b',
            theme: 'dark',
            gridSize: 20,
          },
        }}
        onChange={(elements, appState) => {
          onBoardChange?.({ elements, appState });
        }}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: { saveFileToDisk: true },
            loadScene: true,
            saveToActiveFile: false,
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: { saveFileToDisk: true },
            loadScene: true,
            saveToActiveFile: false,
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
}
