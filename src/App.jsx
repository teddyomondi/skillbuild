import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Spinner from './components/ui/spinner.jsx';
import { ROADMAP_TRACKS } from './data/roadmapCurriculum.js';
import {
  loadLocalLearnerState,
  saveLearnerStateToSupabaseAndLocal,
  fetchLearnerStateFromSupabase,
  isSupabaseConfigured,
  setAuthenticatedLearnerId
} from './services/supabaseStore.js';
import {
  parseAppRoute,
  buildIdeRoute,
  buildCourseTrackRoute,
  navigateToRoute
} from './services/routeManager.js';
import AuthPage from './pages/AuthPage.jsx';
import SubjectsPage from './pages/SubjectsPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import { saveOnboardingData } from './services/adaptiveOnboardingEngine.js';

const CoursesPage = lazy(() => import('./pages/CoursesPage.jsx'));
const IdePage = lazy(() => import('./pages/IdePage.jsx'));
const MathBoardPage = lazy(() => import('./pages/MathBoardPage.jsx'));

function mergeCurriculumTracks(savedTracks = [], moduleWorkspaces = {}) {
  const validSavedTracks = (Array.isArray(savedTracks) ? savedTracks : [])
    .filter((track) => track && typeof track.id === 'string' && Array.isArray(track.nodes))
    .map((track) => ({
      ...track,
      nodes: track.nodes.filter((node) => node && typeof node.id === 'string'),
    }))
    .filter((track) => track.nodes.length > 0);
  const savedById = new Map(validSavedTracks.map((track) => [track.id, track]));
  const curriculumIds = new Set(ROADMAP_TRACKS.map((track) => track.id));

  const mergedCurriculum = ROADMAP_TRACKS.map((curriculumTrack) => {
    const savedTrack = savedById.get(curriculumTrack.id);
    if (!savedTrack) {
      // Check if any modules in this track were completed via moduleWorkspaces
      const updatedNodes = curriculumTrack.nodes.map((node) => {
        if (moduleWorkspaces?.[node.id]?.status === 'completed') {
          return { ...node, status: 'completed' };
        }
        return node;
      });
      return { ...curriculumTrack, nodes: updatedNodes };
    }

    const curriculumNodesById = new Map(
      curriculumTrack.nodes.map((node) => [node.id, node])
    );
    const validSavedNodes = savedTrack.nodes.filter((node) => node && typeof node.id === 'string');
    const savedNodeIds = new Set(validSavedNodes.map((node) => node.id));
    const existingNodes = validSavedNodes.map((savedNode) => {
      const curriculumNode = curriculumNodesById.get(savedNode.id);
      const isWorkspaceDone = moduleWorkspaces?.[savedNode.id]?.status === 'completed';
      const nodeStatus = isWorkspaceDone
        ? 'completed'
        : (savedNode.status || curriculumNode?.status || 'locked');

      return curriculumNode
        ? { ...curriculumNode, ...savedNode, status: nodeStatus }
        : { ...savedNode, status: nodeStatus };
    });
    const addedCurriculumNodes = curriculumTrack.nodes.filter(
      (node) => !savedNodeIds.has(node.id)
    ).map((node) => {
      if (moduleWorkspaces?.[node.id]?.status === 'completed') {
        return { ...node, status: 'completed' };
      }
      return node;
    });

    return {
      ...savedTrack,
      ...curriculumTrack,
      nodes: [...existingNodes, ...addedCurriculumNodes],
    };
  });

  const savedCustomTracks = validSavedTracks.filter(
    (track) => !curriculumIds.has(track.id) && track.nodes.length > 0
  );
  return [...mergedCurriculum, ...savedCustomTracks];
}

export default function App() {
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setClerkTimedOut(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Initial route from URL
  const initialRoute = useMemo(
    () =>
      parseAppRoute(
        typeof window !== 'undefined' ? window.location.pathname : '/'
      ),
    []
  );

  const [currentView, setCurrentView] = useState(() => initialRoute.view || 'lms');
  const [onboardingStep, setOnboardingStep] = useState(
    () => initialRoute.onboardingStep || 'resume'
  );
  const [authMode, setAuthMode] = useState(() => initialRoute.authMode || 'sign-in');

  // Curriculum & workspace state
  const [tracks, setTracks] = useState(() => ROADMAP_TRACKS);
  const [activeTrackId, setActiveTrackId] = useState(
    () => initialRoute.trackId || 'frontend'
  );
  const [activeNodeId, setActiveNodeId] = useState(
    () => initialRoute.nodeId || 'html-semantic-structure'
  );
  const [moduleWorkspaces, setModuleWorkspaces] = useState({});

  // Account hydration state
  const [isHydrated, setIsHydrated] = useState(false);
  const activeLearnerIdRef = useRef(null);

  // Sync user progress tied directly to their authenticated account
  useEffect(() => {
    if (!isClerkLoaded && !clerkTimedOut) return;

    const currentUserId = isSignedIn && clerkUser?.id ? clerkUser.id : null;

    // Prevent re-hydrating the same user
    if (currentUserId === activeLearnerIdRef.current && isHydrated) {
      return;
    }

    activeLearnerIdRef.current = currentUserId;
    setAuthenticatedLearnerId(currentUserId);

    let cancelled = false;

    if (currentUserId) {
      setIsHydrated(false);

      // 1. Instantly load local cache for this specific user if available
      const localCached = loadLocalLearnerState(currentUserId);
      if (localCached) {
        if (localCached.tracks?.length) {
          setTracks(mergeCurriculumTracks(localCached.tracks, localCached.moduleWorkspaces));
        }
        if (localCached.moduleWorkspaces) {
          setModuleWorkspaces(localCached.moduleWorkspaces);
        }
        if (localCached.activeTrackId) {
          setActiveTrackId(localCached.activeTrackId);
        }
        if (localCached.activeNodeId) {
          setActiveNodeId(localCached.activeNodeId);
        }
      }

      // 2. Fetch authoritative state from Supabase for this user's account
      if (isSupabaseConfigured()) {
        fetchLearnerStateFromSupabase(null, currentUserId).then((remoteState) => {
          if (cancelled) return;

          if (remoteState && remoteState.exists) {
            // User has existing progress in Supabase!
            const merged = mergeCurriculumTracks(remoteState.tracks || [], remoteState.moduleWorkspaces);
            setTracks(merged);
            setModuleWorkspaces(remoteState.moduleWorkspaces || {});
            if (remoteState.activeTrackId) {
              setActiveTrackId(remoteState.activeTrackId);
            }
            if (remoteState.activeNodeId) {
              setActiveNodeId(remoteState.activeNodeId);
            }
          } else if (remoteState && !remoteState.exists) {
            // New user account: save initial profile to Supabase
            saveLearnerStateToSupabaseAndLocal({
              activeTrackId: initialRoute.trackId || 'frontend',
              activeNodeId: initialRoute.nodeId || 'html-semantic-structure',
              tracks: ROADMAP_TRACKS,
              moduleWorkspaces: {},
              learnerIdOverride: currentUserId,
              displayName: clerkUser?.fullName || clerkUser?.firstName || 'Student'
            });
          }

          setIsHydrated(true);
        });
      } else {
        setIsHydrated(true);
      }
    } else {
      // User signed out: reset workspace to defaults so next user doesn't see old progress
      setTracks(ROADMAP_TRACKS);
      setModuleWorkspaces({});
      setIsHydrated(true);
    }

    return () => {
      cancelled = true;
    };
  }, [isClerkLoaded, clerkTimedOut, isSignedIn, clerkUser?.id]);

  // Auto-save learner progress (only once account state has been hydrated)
  useEffect(() => {
    if (!isHydrated || !isSignedIn || !clerkUser?.id) return;

    const currentUserId = clerkUser.id;
    const timer = setTimeout(async () => {
      await saveLearnerStateToSupabaseAndLocal({
        activeTrackId,
        activeNodeId,
        tracks,
        moduleWorkspaces,
        learnerIdOverride: currentUserId,
        displayName: clerkUser?.fullName || clerkUser?.firstName || 'Student'
      });
    }, 650);

    return () => clearTimeout(timer);
  }, [tracks, activeTrackId, activeNodeId, moduleWorkspaces, isHydrated, isSignedIn, clerkUser?.id]);

  // Auth redirect handler: when user finishes signing in, guide them to /subjects
  const prevSignedInRef = useRef(isSignedIn);
  useEffect(() => {
    if (!isClerkLoaded && !clerkTimedOut) return;
    if (!prevSignedInRef.current && isSignedIn) {
      const currentPath = window.location.pathname;
      if (
        currentPath.startsWith('/sign-in') ||
        currentPath.startsWith('/sign-up')
      ) {
        navigateToRoute('/subjects', {
          replace: true,
          title: 'Choose a subject'
        });
        setCurrentView('subjects');
      }
    }
    prevSignedInRef.current = isSignedIn;
  }, [isClerkLoaded, clerkTimedOut, isSignedIn]);

  useEffect(() => {
    if (!isClerkLoaded && !clerkTimedOut) return;
    if (currentView === 'auth' && isSignedIn) {
      navigateToRoute('/subjects', {
        replace: true,
        title: 'Choose a subject'
      });
      setCurrentView('subjects');
    }
  }, [isClerkLoaded, clerkTimedOut, isSignedIn, currentView]);

  // Browser navigation popstate listener
  useEffect(() => {
    const handlePopState = () => {
      const route = parseAppRoute(window.location.pathname);
      if (route.view === 'auth') {
        setAuthMode(route.authMode || 'sign-in');
        setCurrentView('auth');
        return;
      }
      if (route.view === 'onboarding') {
        setOnboardingStep(route.onboardingStep || 'resume');
        setCurrentView('onboarding');
        return;
      }
      if (route.view === 'subjects') {
        if (!isSignedIn) {
          setAuthMode('sign-in');
          setCurrentView('auth');
          return;
        }
        setCurrentView('subjects');
        return;
      }
      if (route.view === 'lms') {
        if (route.trackId) {
          setActiveTrackId(route.trackId);
        }
        setCurrentView('lms');
        return;
      }
      if (route.view === 'ide') {
        if (route.trackId) setActiveTrackId(route.trackId);
        if (route.nodeId) setActiveNodeId(route.nodeId);
        setCurrentView('ide');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSignedIn]);

  const handleLaunchLesson = useCallback((trackId, node) => {
    setActiveTrackId(trackId);
    setActiveNodeId(node.id);
    navigateToRoute(buildIdeRoute(trackId, node.id), {
      title: node.title.replace(/^\d+\.\s*/, '')
    });
    setCurrentView('ide');
  }, []);

  const handleSelectSubject = useCallback(async (trackId) => {
    const selectedTrack = tracks.find((track) => track.id === trackId) || tracks[0];
    setActiveTrackId(trackId);
    setActiveNodeId(selectedTrack?.nodes?.[0]?.id || null);

    // Save chosen subject as target domain for adaptive analysis
    await saveOnboardingData({ targetDomain: trackId });

    // Directly enter the step-by-step onboarding flow for the selected subject
    navigateToRoute('/onboarding/resume', { title: 'Upload Resume' });
    setOnboardingStep('resume');
    setCurrentView('onboarding');
  }, [tracks]);

  const handleBackToCourses = useCallback(() => {
    const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];
    navigateToRoute(buildCourseTrackRoute(activeTrackId), {
      title: activeTrack?.title ? activeTrack.title.split('(')[0].trim() : 'Courses'
    });
    setCurrentView('lms');
  }, [activeTrackId, tracks]);

  const handleBackToSubjects = useCallback(() => {
    navigateToRoute('/subjects', { title: 'Choose a subject' });
    setCurrentView('subjects');
  }, []);

  const handleCompleteOnboarding = useCallback((synthesizedTrack) => {
    if (!synthesizedTrack) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('codepulse_kenya_onboarding_completed', 'true');
    }
    setTracks((prev) => [
      synthesizedTrack,
      ...prev.filter((t) => t.id !== synthesizedTrack.id)
    ]);
    setActiveTrackId(synthesizedTrack.id);
    setActiveNodeId(synthesizedTrack.nodes[0]?.id || null);
    navigateToRoute(buildCourseTrackRoute(synthesizedTrack.id), {
      replace: true,
      title: synthesizedTrack.title ? synthesizedTrack.title.split('(')[0].trim() : 'Custom Course'
    });
    setCurrentView('lms');
  }, []);

  // ROUTE 0: Step-by-Step Adaptive Onboarding (`/onboarding`, `/onboarding/resume`, `/onboarding/curriculum`, `/onboarding/mismatch`)
  if (currentView === 'onboarding') {
    return (
      <OnboardingPage
        initialStep={onboardingStep}
        onCompleteOnboarding={handleCompleteOnboarding}
        onSkipToCourse={() => {
          const targetTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];
          navigateToRoute(buildCourseTrackRoute(targetTrack.id), {
            title: targetTrack.title.split('(')[0].trim()
          });
          setCurrentView('lms');
        }}
        onBackToSubjects={handleBackToSubjects}
      />
    );
  }

  // ROUTE 1: Auth Page (`/sign-in`, `/sign-up`)
  if (currentView === 'auth') {
    return (
      <AuthPage
        authMode={authMode}
        isClerkLoaded={isClerkLoaded}
        clerkTimedOut={clerkTimedOut}
      />
    );
  }

  // ROUTE 2: Subject Selection Page (`/subjects`)
  if (currentView === 'subjects') {
    if (!isClerkLoaded && !clerkTimedOut) {
      return (
        <AuthPage
          authMode="sign-in"
          isClerkLoaded={false}
          clerkTimedOut={false}
        />
      );
    }
    if (!isSignedIn) {
      setAuthMode('sign-in');
      navigateToRoute('/sign-in', { title: 'Sign in' });
      setCurrentView('auth');
      return null;
    }
    return (
      <SubjectsPage
        isClerkLoaded={isClerkLoaded}
        clerkTimedOut={clerkTimedOut}
        onSelectSubject={handleSelectSubject}
      />
    );
  }

  // ROUTE 3: Courses & LMS Dashboard (`/courses`, `/courses/:trackId`, `/welcome`, `/`)
  if (currentView === 'lms' || !isSignedIn) {
    return (
      <Suspense
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-[#191919]">
            <Spinner size="lg" />
          </div>
        }
      >
        <CoursesPage
          tracks={tracks}
          activeTrackId={activeTrackId}
          setActiveTrackId={setActiveTrackId}
          onLaunchLesson={handleLaunchLesson}
          onBackToSubjects={handleBackToSubjects}
          isSignedIn={isSignedIn}
        />
      </Suspense>
    );
  }

  // ROUTE 4: Interactive Learning Environment (`/learn/:trackId/:nodeId`)
  if (activeTrackId === 'mathematics') {
    return (
      <Suspense
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-[#191919]">
            <Spinner size="lg" />
          </div>
        }
      >
        <MathBoardPage
          tracks={tracks}
          setTracks={setTracks}
          activeTrackId={activeTrackId}
          setActiveTrackId={setActiveTrackId}
          activeNodeId={activeNodeId}
          setActiveNodeId={setActiveNodeId}
          moduleWorkspaces={moduleWorkspaces}
          setModuleWorkspaces={setModuleWorkspaces}
          onBackToCourses={handleBackToCourses}
        />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-[#191919]">
          <Spinner size="lg" />
        </div>
      }
    >
      <IdePage
        tracks={tracks}
        setTracks={setTracks}
        activeTrackId={activeTrackId}
        setActiveTrackId={setActiveTrackId}
        activeNodeId={activeNodeId}
        setActiveNodeId={setActiveNodeId}
        moduleWorkspaces={moduleWorkspaces}
        setModuleWorkspaces={setModuleWorkspaces}
        onBackToCourses={handleBackToCourses}
      />
    </Suspense>
  );
}
