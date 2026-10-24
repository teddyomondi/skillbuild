import React, { useState, useEffect } from 'react';
import OnboardingResumePage from './OnboardingResumePage.jsx';
import OnboardingCurriculumPage from './OnboardingCurriculumPage.jsx';
import OnboardingMismatchPage from './OnboardingMismatchPage.jsx';
import { buildOnboardingRoute, navigateToRoute, parseAppRoute } from '@/services/routeManager.js';
import { loadSavedOnboardingData } from '@/services/adaptiveOnboardingEngine.js';

export default function OnboardingPage({
  initialStep = 'resume',
  onCompleteOnboarding,
  onSkipToCourse,
  onBackToSubjects,
}) {
  const [currentStep, setCurrentStep] = useState(() => initialStep || 'resume');
  const [onboardingData, setOnboardingData] = useState(() => loadSavedOnboardingData() || {});

  useEffect(() => {
    const handlePopState = () => {
      const route = parseAppRoute(window.location.pathname);
      if (route.view === 'onboarding') {
        setCurrentStep(route.onboardingStep || 'resume');
        setOnboardingData(loadSavedOnboardingData() || {});
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const goToStep = (step) => {
    setCurrentStep(step);
    setOnboardingData(loadSavedOnboardingData() || {});
    navigateToRoute(buildOnboardingRoute(step), {
      title: step === 'resume' ? 'Upload Resume' : step === 'curriculum' ? 'Upload Curriculum' : 'Skills Mismatch',
    });
  };

  if (currentStep === 'curriculum') {
    return (
      <OnboardingCurriculumPage
        initialData={onboardingData}
        onNext={() => goToStep('mismatch')}
        onBack={() => goToStep('resume')}
      />
    );
  }

  if (currentStep === 'mismatch') {
    return (
      <OnboardingMismatchPage
        initialData={onboardingData}
        onBack={() => goToStep('curriculum')}
        onComplete={(customTrack) => {
          onCompleteOnboarding(customTrack);
        }}
      />
    );
  }

  // Default: Step 1 Resume
  return (
    <OnboardingResumePage
      initialData={onboardingData}
      onNext={() => goToStep('curriculum')}
      onSkip={onSkipToCourse}
      onBack={onBackToSubjects}
    />
  );
}
