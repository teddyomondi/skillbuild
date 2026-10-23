import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
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
import KenyanIndustryOnboarding from './components/KenyanIndustryOnboarding.jsx';
import AuthPage from './pages/AuthPage.jsx';
import SubjectsPage from './pages/SubjectsPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import IdePage from './pages/IdePage.jsx';

function mergeCurriculumTracks(savedTracks = []) {
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
    if (!savedTrack) return curriculumTrack;

    const curriculumNodesById = new Map(
      curriculumTrack.nodes.map((node) => [node.id, node])
    );
    const validSavedNodes = savedTrack.nodes.filter((node) => node && typeof node.id === 'string');
    const savedNodeIds = new Set(validSavedNodes.map((node) => node.id));
    const existingNodes = validSavedNodes.map((savedNode) => {
      const curriculumNode = curriculumNodesById.get(savedNode.id);
      return curriculumNode
        ? { ...savedNode, ...curriculumNode, status: savedNode.status || curriculumNode.status }
        : savedNode;
    });
    const addedCurriculumNodes = curriculumTrack.nodes.filter(
      (node) => !savedNodeIds.has(node.id)
    );

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

  useEffect(() => {
    if (clerkUser?.id) {
      setAuthenticatedLearnerId(clerkUser.id);
    }
  }, [clerkUser?.id]);

  // Initial state hydration
  const initialSavedState = useMemo(() => loadLocalLearnerState(), []);
  const initialRoute = useMemo(
    () =>
      parseAppRoute(
        typeof window !== 'undefined' ? window.location.pathname : '/'
      ),
    []
  );

  const [currentView, setCurrentView] = useState(() =>
    initialRoute.view === 'onboarding' ? 'lms' : initialRoute.view || 'lms'
  );
  const [authMode, setAuthMode] = useState(() => initialRoute.authMode || 'sign-in');
  const [showOnboardingModal, setShowOnboardingModal] = useState(
    () => initialRoute.view === 'onboarding'
  );

  const [tracks, setTracks] = useState(() =>
    mergeCurriculumTracks(initialSavedState?.tracks || ROADMAP_TRACKS)
  );
  const [activeTrackId, setActiveTrackId] = useState(
    () => initialRoute.trackId || 'frontend'
  );
  const [activeNodeId, setActiveNodeId] = useState(
    () =>
      initialRoute.nodeId ||
      initialSavedState?.activeNodeId ||
      'html-semantic-structure'
  );
  const [moduleWorkspaces, setModuleWorkspaces] = useState(
    () => initialSavedState?.moduleWorkspaces || {}
  );

  // Sync with remote Supabase store
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    fetchLearnerStateFromSupabase().then((remoteState) => {
      if (cancelled || !remoteState) return;
      setTracks(mergeCurriculumTracks(remoteState.tracks || []));
      setModuleWorkspaces(remoteState.moduleWorkspaces || {});

      const targetTrackId = initialRoute.trackId || (initialRoute.isRootRedirect ? 'mathematics' : remoteState.activeTrackId || 'mathematics');
      const targetNodeId = initialRoute.nodeId || (targetTrackId === remoteState.activeTrackId ? remoteState.activeNodeId : null);
      setActiveTrackId(targetTrackId);
      if (targetNodeId) setActiveNodeId(targetNodeId);

      if (initialRoute.isRootRedirect) {
        navigateToRoute(buildCourseTrackRoute(targetTrackId), {
          replace: true
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-save learner state
  useEffect(() => {
    const timer = setTimeout(async () => {
      await saveLearnerStateToSupabaseAndLocal({
        activeTrackId,
        activeNodeId,
        tracks,
        moduleWorkspaces
      });
    }, 650);

    return () => clearTimeout(timer);
  }, [tracks, activeTrackId, activeNodeId, moduleWorkspaces]);

  // Auth redirect handler
  const prevSignedInRef = useRef(isSignedIn);
  useEffect(() => {
    if (!isClerkLoaded && !clerkTimedOut) return;
    if (!prevSignedInRef.current && isSignedIn) {
      const currentPath = window.location.pathname;
      if (
        currentPath === '/' ||
        currentPath === '/welcome' ||
        currentPath.startsWith('/sign-in') ||
        currentPath.startsWith('/sign-up') ||
        currentPath === '/subjects'
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
      return;
    }
    if (!isSignedIn) return;

    if (initialRoute.isRootRedirect && initialRoute.view !== 'subjects') {
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
        setShowOnboardingModal(true);
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

  const handleSelectSubject = useCallback((trackId) => {
    const selectedTrack = tracks.find((track) => track.id === trackId) || tracks[0];
    setActiveTrackId(trackId);
    setActiveNodeId(selectedTrack.nodes[0]?.id || null);
    navigateToRoute(buildCourseTrackRoute(trackId), {
      title: selectedTrack.title.split('(')[0].trim()
    });
    setCurrentView('lms');
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
    setShowOnboardingModal(false);
    setTracks((prev) => [
      synthesizedTrack,
      ...prev.filter((t) => t.id !== synthesizedTrack.id)
    ]);
    setActiveTrackId(synthesizedTrack.id);
    navigateToRoute('/subjects', { replace: true, title: 'Choose a subject' });
    setCurrentView('subjects');
  }, []);

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
      <>
        <CoursesPage
          tracks={tracks}
          activeTrackId={activeTrackId}
          setActiveTrackId={setActiveTrackId}
          onLaunchLesson={handleLaunchLesson}
          onBackToSubjects={handleBackToSubjects}
          isSignedIn={isSignedIn}
        />
        {showOnboardingModal && (
          <KenyanIndustryOnboarding
            initialLearnerName={clerkUser?.fullName || clerkUser?.firstName || 'Learner'}
            onCancel={() => setShowOnboardingModal(false)}
            onCompleteOnboarding={handleCompleteOnboarding}
          />
        )}
      </>
    );
  }

  // ROUTE 4: Interactive Learning IDE (`/learn/:trackId/:nodeId`)
  return (
    <>
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
      {showOnboardingModal && (
        <KenyanIndustryOnboarding
          initialLearnerName={clerkUser?.fullName || clerkUser?.firstName || 'Learner'}
          onCancel={() => setShowOnboardingModal(false)}
          onCompleteOnboarding={handleCompleteOnboarding}
        />
      )}
    </>
  );
}
