import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";
import { useAuth } from "@clerk/clerk-react";
import { Sparkles, Wand2, GraduationCap, Brain } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { SearchCommand } from "@/components/search-command";
import { SettingsModal } from "@/components/modals/settings-modal";
import SyllabusImportModal from "@/components/modals/SyllabusImportModal";
import AcademicLedgerDashboard from "@/components/AcademicLedgerDashboard";
import PlatformIntelligenceDashboard from "@/components/PlatformIntelligenceDashboard";
import { Navigation } from "@/components/notion-main/navigation";
import Navbar from "@/components/notion-marketing/Navbar";
import Heading from "@/components/notion-marketing/Heading";
import Heroes from "@/components/notion-marketing/Heroes";
import { HowItWorks } from "@/components/notion-marketing/HowItWorks";
import { Pricing } from "@/components/notion-marketing/Pricing";
import { FAQ } from "@/components/notion-marketing/FAQ";
import { CTA } from "@/components/notion-marketing/CTA";
import Footer from "@/components/notion-marketing/Footer";
import CourseProgressPath from "@/components/CourseProgressPath";
import {
  buildCourseTrackRoute,
  navigateToRoute,
  parseAppRoute,
} from "@/services/routeManager.js";

function makeCurriculumDocuments(tracks) {
  const trackIconMap = {
    frontend: "🌐",
    backend: "⚡",
    "fullstack-ai": "🧠",
    mathematics: "📐",
    "caltech-embedded-iot": "⚡",
  };

  const safeTracks = (Array.isArray(tracks) ? tracks : []).filter(
    (track) => track && typeof track.id === "string" && Array.isArray(track.nodes)
  ).map((track) => ({
    ...track,
    nodes: track.nodes.filter((node) => node && typeof node.id === "string"),
  }));

  return safeTracks.flatMap((track) => {
    const completedCount = track.nodes.filter((node) => node.status === "completed").length;
    const trackId = `track-${track.id}`;
    const trackDocument = {
      id: trackId,
      title: track.title.split("(")[0].trim(),
      icon: trackIconMap[track.id] || (track.workspaceType === "circuit" ? "⚡" : track.workspaceType === "math" ? "📐" : "🌐"),
      parentDocument: null,
      isShared: true,
      isCurriculum: true,
      isTrackDoc: true,
      trackId: track.id,
      trackRef: track,
      badgeText: `${completedCount}/${track.nodes.length}`,
    };
    const moduleDocuments = track.nodes.map((node, index) => ({
      id: `node-${track.id}-${node.id}`,
      title: node.title.replace(/^\d+\.\s*/, ""),
      icon: node.workspaceType === "circuit" || track.workspaceType === "circuit" ? "⚡" : node.isMathBoard || track.id === "mathematics" || track.workspaceType === "math" ? "📐" : undefined,
      parentDocument: trackId,
      isShared: true,
      isCurriculum: true,
      isModuleDoc: true,
      trackId: track.id,
      nodeRef: node,
      isLocked: node.status === "locked" || (index > 0 && track.nodes[index - 1].status !== "completed"),
      badgeText: node.status === "completed" ? "Done" : undefined,
    }));
    return [trackDocument, ...moduleDocuments];
  });
}

export default function FrappeLmsDashboard({
  tracks,
  activeTrackId,
  setActiveTrackId,
  onLaunchLesson,
  onBackToSubjects,
  onOpenSyllabusEngine,
  onSyllabusGenerated,
  onOpenStudio,
  forceMarketing = false,
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [isAcademicLedgerOpen, setIsAcademicLedgerOpen] = useState(false);
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);
  const handleOpenSyllabus = onOpenSyllabusEngine || (() => setIsSyllabusModalOpen(true));
  const marketingScrollRef = useRef(null);
  const initialRoute = useMemo(
    () => parseAppRoute(typeof window !== "undefined" ? window.location.pathname : "/courses"),
    []
  );
  const documents = useMemo(() => makeCurriculumDocuments(tracks), [tracks]);
  const initialTrackId = initialRoute.trackId || activeTrackId || tracks[0]?.id || "frontend";
  const [activeDocumentId, setActiveDocumentId] = useState(() =>
    initialRoute.docType === "track"
      ? initialRoute.documentId
      : `track-${initialTrackId}`
  );
  const activeDocument = documents.find((document) => document.id === activeDocumentId)
    || documents.find((document) => document.id === `track-${activeTrackId}`)
    || documents.find((document) => document.isTrackDoc);

  const handleLaunchNode = useCallback((trackId, node) => {
    const track = tracks.find((candidate) => candidate.id === trackId);
    if (!track || !node) return;
    const nodeIndex = track.nodes.findIndex((candidate) => candidate.id === node.id);
    if (nodeIndex < 0 || node.status === "locked" || (nodeIndex > 0 && track.nodes[nodeIndex - 1].status !== "completed")) return;
    onLaunchLesson?.(track.id, node);
  }, [onLaunchLesson, tracks]);

  const handleEnterWorkspace = useCallback(() => {
    if (onBackToSubjects) {
      navigateToRoute("/subjects", { title: "Choose a subject" });
      onBackToSubjects();
    } else {
      navigateToRoute(buildCourseTrackRoute(activeTrackId || tracks[0]?.id || "frontend"), {
        title: "Courses",
      });
    }
  }, [activeTrackId, tracks, onBackToSubjects]);

  const handleSelectDocument = useCallback((documentId) => {
    const selected = documents.find((document) => document.id === documentId);
    if (!selected) return;
    if (selected.isModuleDoc) {
      handleLaunchNode(selected.trackId, selected.nodeRef);
      return;
    }
    setActiveDocumentId(selected.id);
    setActiveTrackId?.(selected.trackId);
    navigateToRoute(buildCourseTrackRoute(selected.trackId), { title: selected.title });
  }, [documents, handleLaunchNode, setActiveTrackId]);

  const handleLaunchModule = useCallback((node) => {
    handleLaunchNode(activeDocument?.trackId, node);
  }, [activeDocument, handleLaunchNode]);

  useEffect(() => {
    if (activeTrackId) {
      const trackDocId = `track-${activeTrackId}`;
      if (documents.some((document) => document.id === trackDocId)) {
        setActiveDocumentId(trackDocId);
      }
    }
  }, [activeTrackId, documents]);

  useEffect(() => {
    const handlePopState = () => {
      const route = parseAppRoute(window.location.pathname);
      if (route.trackId) {
        const trackDocumentId = `track-${route.trackId}`;
        if (documents.some((document) => document.id === trackDocumentId)) {
          setActiveDocumentId(trackDocumentId);
          setActiveTrackId?.(route.trackId);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [documents, setActiveTrackId]);

  useEffect(() => {
    if (isSignedIn && initialRoute.isRootRedirect && window.location.pathname !== "/welcome") {
      navigateToRoute(buildCourseTrackRoute(initialTrackId), {
        replace: true,
        title: "Courses",
      });
    }
  }, [initialRoute.isRootRedirect, initialTrackId, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-[#1F1F1F]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (forceMarketing || !isSignedIn) {
    return (
      <div
        ref={marketingScrollRef}
        className="h-screen w-screen overflow-y-auto bg-background text-foreground font-sans select-none"
      >
        <Toaster position="bottom-center" />
        <Navbar scrollContainerRef={marketingScrollRef} onEnterWorkspace={handleEnterWorkspace} />
        <main className="min-h-full">
          <div className="min-h-full flex flex-col pt-28">
            <div className="flex flex-col items-center justify-center md:justify-start md:gap-y-5 flex-1 text-center">
              <Heading onEnterWorkspace={handleEnterWorkspace} />
              <Heroes />
            </div>
            <HowItWorks scrollContainerRef={marketingScrollRef} onEnterWorkspace={handleEnterWorkspace} />
            <Pricing onEnterWorkspace={handleEnterWorkspace} />
            <FAQ />
            <CTA scrollContainerRef={marketingScrollRef} onEnterWorkspace={handleEnterWorkspace} />
            <Footer onEnterWorkspace={handleEnterWorkspace} />
          </div>
        </main>
      </div>
    );
  }

  const currentTrack = activeDocument?.trackRef;
  const completedCount = currentTrack?.nodes.filter((node) => node.status === "completed").length || 0;
  const totalNodes = currentTrack?.nodes.length || 0;
  const isMathsDashboard = currentTrack?.id === "mathematics";

  return (
    <div className="h-screen w-screen flex bg-background dark:bg-[#1F1F1F] text-foreground overflow-hidden">
      <Toaster position="bottom-center" />
      <Navigation
        documents={documents}
        activeDocumentId={activeDocument?.id}
        onSelectDocument={handleSelectDocument}
        onLaunchInIde={handleLaunchNode}
        onBackToSubjects={onBackToSubjects}
        onOpenSyllabusEngine={handleOpenSyllabus}
        onOpenStudio={onOpenStudio}
      />
      <main className="flex-1 h-full overflow-y-auto">
        <SearchCommand
          documents={documents}
          tracks={tracks}
          onSelectDocument={handleSelectDocument}
          onLaunchLesson={handleLaunchNode}
        />
        <SettingsModal />
        <SyllabusImportModal
          isOpen={isSyllabusModalOpen}
          onClose={() => setIsSyllabusModalOpen(false)}
          onCourseGenerated={(genTrack) => {
            setIsSyllabusModalOpen(false);
            onSyllabusGenerated?.(genTrack);
          }}
        />

        {isAcademicLedgerOpen && (
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl">
              <AcademicLedgerDashboard onClose={() => setIsAcademicLedgerOpen(false)} />
            </div>
          </div>
        )}

        {isIntelligenceOpen && (
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl">
              <PlatformIntelligenceDashboard onClose={() => setIsIntelligenceOpen(false)} />
            </div>
          </div>
        )}

        <div className="mx-auto max-w-5xl px-6 pb-20 pt-24 sm:px-10">
          {currentTrack ? (
            <>
              <header className="mb-8 flex items-end justify-between gap-4 border-b border-border/70 pb-5">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {isMathsDashboard ? "Maths courses" : currentTrack.workspaceType === "circuit" ? "Circuit & Embedded Labs" : "Course progress"}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isMathsDashboard
                      ? "Learn with graphs, shapes, vectors, and the digital board."
                      : currentTrack.workspaceType === "circuit"
                      ? "Program microcontrollers with Wokwi simulation, virtual pins, and live serial telemetry."
                      : currentTrack.title.split("(")[0].trim()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAcademicLedgerOpen(true)}
                    className="h-8 gap-1.5 px-3 text-xs font-semibold border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 shadow-xs"
                    title="Official Practical Lab Grading Ledger & System of Record"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Grading Ledger</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsIntelligenceOpen(true)}
                    className="h-8 gap-1.5 px-3 text-xs font-semibold border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 shadow-xs"
                    title="Dual-Loop Intelligence: Personal Cognitive Profile & Platform Fleet Analytics"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>Fleet Brain</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onOpenStudio}
                    className="h-8 gap-1.5 px-3 text-xs font-semibold border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-xs"
                    title="10-Minute STEM Challenge Builder"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Lab Studio</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleOpenSyllabus}
                    className="h-8 gap-1.5 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Plug Syllabus</span>
                  </Button>
                  <div className="shrink-0 rounded-full bg-secondary px-4 py-2 text-sm font-medium tabular-nums">
                    <span className="text-foreground">{completedCount}</span>
                    <span className="text-muted-foreground"> / {totalNodes}</span>
                  </div>
                </div>
              </header>
              <CourseProgressPath nodes={currentTrack.nodes} onSelectModule={handleLaunchModule} />
            </>
          ) : (
            <div className="py-10 text-muted-foreground">No course is available yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
