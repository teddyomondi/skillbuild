import React from 'react';
import FrappeLmsDashboard from '@/components/FrappeLmsDashboard.jsx';

export default function CoursesPage({
  tracks,
  activeTrackId,
  setActiveTrackId,
  onLaunchLesson,
  onBackToSubjects,
  onOpenSyllabusEngine,
  onSyllabusGenerated,
  onOpenStudio,
  isSignedIn
}) {
  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const isCircuit = activeTrack?.workspaceType === 'circuit' || activeTrackId.includes('circuit');
  const isMath = activeTrack?.workspaceType === 'math' || activeTrackId === 'mathematics';

  const visibleTracks = tracks.filter((track) => {
    if (track.id === activeTrackId) return true;
    if (isCircuit) return track.workspaceType === 'circuit' || track.id.includes('circuit');
    if (isMath) return track.workspaceType === 'math' || track.id === 'mathematics';
    return track.id !== 'mathematics' && track.workspaceType !== 'circuit';
  });

  return (
    <FrappeLmsDashboard
      tracks={visibleTracks.length > 0 ? visibleTracks : tracks}
      activeTrackId={activeTrackId}
      setActiveTrackId={setActiveTrackId}
      onLaunchLesson={onLaunchLesson}
      onBackToSubjects={onBackToSubjects}
      onOpenSyllabusEngine={onOpenSyllabusEngine}
      onSyllabusGenerated={onSyllabusGenerated}
      onOpenStudio={onOpenStudio}
      forceMarketing={!isSignedIn}
    />
  );
}
