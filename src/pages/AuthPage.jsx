import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import Spinner from '@/components/ui/spinner.jsx';

export default function AuthPage({ authMode = 'sign-in', isClerkLoaded = true, clerkTimedOut = false }) {
  if (!isClerkLoaded && !clerkTimedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-[#1F1F1F]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dark:bg-[#1F1F1F]">
      {authMode === 'sign-up' ? (
        <SignUp fallbackRedirectUrl="/subjects" forceRedirectUrl="/subjects" />
      ) : (
        <SignIn fallbackRedirectUrl="/subjects" forceRedirectUrl="/subjects" />
      )}
    </div>
  );
}
