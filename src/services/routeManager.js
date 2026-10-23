// ============================================================================
// APPLICATION URL ROUTER & HISTORY MANAGER
// Provides clean, deep-linkable URL routes with browser Back/Forward support:
// - /learn/:trackId/:nodeId          -> Live AI Coding IDE for a specific module
// - /courses                         -> Course progress and lesson path
// - /courses/:trackId                -> Course Track Overview & Module List
// - /welcome                         -> Platform Landing / Overview Page
// ============================================================================

export function buildIdeRoute(trackId = 'frontend', nodeId = 'html-semantic-structure') {
  const safeTrack = encodeURIComponent(trackId || 'frontend');
  const safeNode = encodeURIComponent(nodeId || 'html-semantic-structure');
  return `/learn/${safeTrack}/${safeNode}`;
}

export function buildCourseTrackRoute(trackId = 'frontend') {
  return `/courses/${encodeURIComponent(trackId || 'frontend')}`;
}

export function buildWelcomeRoute() {
  return '/welcome';
}

export function buildSignInRoute() {
  return '/sign-in';
}

export function buildSignUpRoute() {
  return '/sign-up';
}

export function buildOnboardingRoute() {
  return '/onboarding';
}

/**
 * Parses `window.location.pathname` into a structured route descriptor.
 */
export function parseAppRoute(pathname = '/') {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  const parts = cleanPath.split('/').filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });

  // 0. Clerk Authentication Routes: /sign-in/* and /sign-up/*
  if (parts[0] === 'sign-in') {
    return {
      view: 'auth',
      authMode: 'sign-in',
      path: cleanPath
    };
  }

  if (parts[0] === 'sign-up') {
    return {
      view: 'auth',
      authMode: 'sign-up',
      path: cleanPath
    };
  }

  // 0b. Onboarding Route: /onboarding
  if (parts[0] === 'onboarding') {
    return {
      view: 'onboarding',
      path: cleanPath
    };
  }

  if (parts[0] === 'subjects') {
    return {
      view: 'subjects',
      path: cleanPath
    };
  }

  // 1. /welcome
  if (parts[0] === 'welcome') {
    return {
      view: 'lms',
      subView: 'marketing',
      path: '/welcome'
    };
  }

  // Old page URLs now return to the course workspace.
  if (parts[0] === 'documents' || parts[0] === 'notes') {
    return {
      view: 'lms',
      subView: 'workspace',
      docType: 'track',
      documentId: 'track-frontend',
      trackId: 'frontend',
      isRootRedirect: true,
      path: '/courses/frontend'
    };
  }

  // 3. /courses or /courses/:trackId
  if (parts[0] === 'courses') {
    const trackId = parts[1] || null;
    if (trackId) {
      return {
        view: 'lms',
        subView: 'workspace',
        docType: 'track',
        trackId,
        documentId: `track-${trackId}`,
        path: cleanPath
      };
    }
    return {
      view: 'lms',
      subView: 'workspace',
      docType: 'root',
      trackId: 'frontend',
      documentId: 'track-frontend',
      path: '/courses'
    };
  }

  // 4. /learn/:trackId/:nodeId
  if (parts[0] === 'learn' && parts[1] && parts[2]) {
    const trackId = parts[1];
    const nodeId = parts[2];
    return {
      view: 'ide',
      trackId,
      nodeId,
      path: cleanPath
    };
  }

  // 5. Default `/` -> platform landing & marketing overview for visitors
  return {
    view: 'lms',
    subView: 'marketing',
    isRootRedirect: true,
    path: '/'
  };
}

/**
 * Updates the browser URL and document title without a full page reload.
 */
export function navigateToRoute(targetPath, { replace = false, title = '' } = {}) {
  if (typeof window === 'undefined') return;
  const normalizedTarget = (targetPath || '/').replace(/\/+$/, '') || '/';
  const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';

  if (title && typeof document !== 'undefined') {
    document.title = `${title} • Upskill`;
  }

  if (currentPath === normalizedTarget) return;

  if (replace) {
    window.history.replaceState({ path: normalizedTarget }, '', normalizedTarget);
  } else {
    window.history.pushState({ path: normalizedTarget }, '', normalizedTarget);
  }
}
