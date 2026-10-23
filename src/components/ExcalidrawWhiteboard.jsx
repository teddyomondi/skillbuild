import React, { useState, useEffect } from 'react';
import Spinner from '@/components/ui/spinner.jsx';

/**
 * Excalidraw Digital Whiteboard
 * Pure open-source infinite canvas with native drawing, shape, text, and arrow tools.
 */
export default function ExcalidrawWhiteboard({
  initialElements = [],
  onBoardChange = null,
}) {
  const [ExcalidrawComp, setExcalidrawComp] = useState(null);

  useEffect(() => {
    let mounted = true;
    import('@excalidraw/excalidraw').then((mod) => {
      if (mounted) {
        setExcalidrawComp(() => mod.Excalidraw);
      }
    }).catch((err) => {
      console.error('Failed to load Excalidraw:', err);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ExcalidrawComp) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
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
