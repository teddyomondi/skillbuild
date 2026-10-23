import React from 'react';
import Spinner from '@/components/ui/spinner.jsx';
import SubjectSelection from '@/components/SubjectSelection.jsx';

export default function SubjectsPage({
  isClerkLoaded,
  clerkTimedOut,
  onSelectSubject
}) {
  if (!isClerkLoaded && !clerkTimedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-[#1F1F1F]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <SubjectSelection
      disabled={!isClerkLoaded && !clerkTimedOut}
      onSelect={onSelectSubject}
    />
  );
}
