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
  const isCircuitTrack = (track) =>
    track?.workspaceType === 'circuit' ||
    track?.id?.includes('circuit') ||
    track?.id?.includes('embedded') ||
    track?.id?.includes('iot');

  const isMathTrack = (track) =>
    track?.id === 'mathematics' || track?.workspaceType === 'math';

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const isCurrentCircuit = isCircuitTrack(activeTrack) || activeTrackId?.includes('circuit') || activeTrackId?.includes('embedded');
  const isCurrentMath = isMathTrack(activeTrack);

  // Strictly segregate tracks so Circuits and Mathematics are NEVER mixed into Programming
  const visibleTracks = tracks.filter((track) => {
    if (isCurrentCircuit) return isCircuitTrack(track);
    if (isCurrentMath) return isMathTrack(track);
    return !isCircuitTrack(track) && !isMathTrack(track);
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
