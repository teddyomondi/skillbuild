import React from 'react';
import FrappeLmsDashboard from '@/components/FrappeLmsDashboard.jsx';

export default function CoursesPage({
  tracks,
  activeTrackId,
  setActiveTrackId,
  onLaunchLesson,
  onBackToSubjects,
  isSignedIn
}) {
  const visibleTracks = activeTrackId === 'mathematics'
    ? tracks.filter((track) => track.id === 'mathematics')
    : tracks.filter((track) => track.id !== 'mathematics');

  return (
    <FrappeLmsDashboard
      tracks={visibleTracks}
      activeTrackId={activeTrackId}
      setActiveTrackId={setActiveTrackId}
      onLaunchLesson={onLaunchLesson}
      onBackToSubjects={onBackToSubjects}
      forceMarketing={!isSignedIn}
    />
  );
}
