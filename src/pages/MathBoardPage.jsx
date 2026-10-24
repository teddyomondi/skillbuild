import React, { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button.jsx';
import Spinner from '@/components/ui/spinner.jsx';
import { cn } from '@/lib/utils.js';
import { ROADMAP_TRACKS } from '@/data/roadmapCurriculum.js';
import { buildIdeRoute, navigateToRoute } from '@/services/routeManager.js';
import { toast } from 'sonner';

const ExcalidrawWhiteboard = lazy(() => import('@/components/ExcalidrawWhiteboard.jsx'));

export default function MathBoardPage({
  tracks,
  setTracks,
  activeTrackId,
  setActiveTrackId,
  activeNodeId,
  setActiveNodeId,
  moduleWorkspaces,
  setModuleWorkspaces,
  onBackToCourses,
}) {
  const activeTrack = useMemo(() => {
    const candidate = tracks.find((track) => track.id === activeTrackId) || tracks.find((t) => t.id === 'mathematics') || tracks[0];
    const usableTrack = candidate?.nodes?.length ? candidate : ROADMAP_TRACKS[1] || ROADMAP_TRACKS[0];
    const nodes = usableTrack.nodes.filter((node) => node && typeof node.id === 'string');
    return {
      ...usableTrack,
      title: usableTrack.title || 'Mathematics',
      nodes: nodes.length ? nodes : [],
    };
  }, [tracks, activeTrackId]);

  const activeNode = useMemo(() => {
    const found = activeTrack.nodes.find((node) => node.id === activeNodeId);
    return found || activeTrack.nodes[0] || { id: 'math-intro', title: 'Mathematics Lesson' };
  }, [activeTrack, activeNodeId]);

  const currentModuleIndex = useMemo(
    () => activeTrack.nodes.findIndex((n) => n.id === activeNode.id),
    [activeTrack, activeNode]
  );

  const nextModule = useMemo(() => {
    if (currentModuleIndex >= 0 && currentModuleIndex < activeTrack.nodes.length - 1) {
      return activeTrack.nodes[currentModuleIndex + 1];
    }
    return null;
  }, [activeTrack, currentModuleIndex]);

  const boardDataRef = useRef(moduleWorkspaces[activeNode.id]?.boardData || null);

  const handleSelectNode = (node) => {
    setActiveNodeId(node.id);
    navigateToRoute(buildIdeRoute(activeTrack.id, node.id), {
      title: node.title.replace(/^\d+\.\s*/, ''),
    });
  };

  const handleCompleteLesson = () => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id !== activeTrack.id) return track;
        const targetIndex = track.nodes.findIndex((n) => n.id === activeNode.id);
        const updatedNodes = track.nodes.map((node, idx) => {
          if (node.id === activeNode.id) {
            return { ...node, status: 'completed' };
          }
          if (idx === targetIndex + 1 && (node.status === 'locked' || !node.status)) {
            return { ...node, status: 'in-progress' };
          }
          return node;
        });
        return { ...track, nodes: updatedNodes };
      })
    );

    setModuleWorkspaces((prev) => ({
      ...prev,
      [activeNode.id]: {
        ...(prev[activeNode.id] || {}),
        boardData: boardDataRef.current,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      },
    }));

    toast.success('Module completed! Next module unlocked.');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* TOP HEADER */}
      <header className="h-12 bg-background dark:bg-[#18181b] border-b border-border px-3.5 flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToCourses}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border hover:bg-secondary text-foreground shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            Courses
          </Button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-secondary/50 border border-border text-xs min-w-0">
            <span className="text-foreground font-semibold shrink-0">
              Module {currentModuleIndex + 1} of {activeTrack.nodes.length}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground font-medium truncate max-w-[280px]">
              {activeNode.title.replace(/^\d+\.\s*/, '')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleCompleteLesson}
            className="h-8 gap-1.5 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Module</span>
          </Button>

          {nextModule && (
            <Button
              size="sm"
              onClick={() => handleSelectNode(nextModule)}
              className="h-8 gap-1.5 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              <span>Next Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}

          <div className="ml-1 flex items-center">
            <UserButton afterSignOutUrl="/welcome" />
          </div>
        </div>
      </header>

      {/* FULL-SCREEN INFINITE EXCALIDRAW BOARD */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        <Suspense
          fallback={
            <div className="h-full w-full flex items-center justify-center bg-background dark:bg-[#121212]">
              <Spinner size="lg" />
            </div>
          }
        >
          <ExcalidrawWhiteboard
            initialElements={activeNode.initialBoard?.elements || []}
            onBoardChange={(data) => {
              boardDataRef.current = data;
            }}
          />
        </Suspense>
      </main>
    </div>
  );
}
