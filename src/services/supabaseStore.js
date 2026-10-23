// ============================================================================
// SUPABASE BACKEND & PERSISTENCE SERVICE
// Stores and syncs:
// 1. Adaptive learning paths & dynamically generated custom modules (tracks_snapshot)
// 2. Active track & active module position (active_track_id, active_node_id)
// 3. Per-module student progress, live code edits (saved_files), attempts & tutor chat
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { ROADMAP_TRACKS } from '../data/roadmapCurriculum.js';
import { createDynamicDetourNode } from './socraticAiTutor.js';

const LOCAL_STATE_KEY = 'codepulse_learner_state_v1';
const LEARNER_ID_KEY = 'codepulse_learner_id_v1';
const SUPABASE_CONFIG_KEY = 'codepulse_supabase_config_v1';

let cachedSupabaseClient = null;
let cachedClientSignature = '';
let activeClerkUserId = null;

/**
 * Sets the authenticated Clerk user ID as the active learner ID for Supabase & local persistence.
 */
export function setAuthenticatedLearnerId(clerkUserId) {
  activeClerkUserId = clerkUserId || null;
  if (typeof window !== 'undefined' && clerkUserId) {
    try {
      window.localStorage.setItem(LEARNER_ID_KEY, clerkUserId);
    } catch {
      // ignore
    }
  }
}

/**
 * Returns or generates a persistent learner ID so progress is linked to this student
 * across browser sessions and in the Supabase `learner_profiles` & `learner_module_progress` tables.
 */
export function getOrCreateLearnerId() {
  if (activeClerkUserId) return activeClerkUserId;
  if (typeof window === 'undefined') return 'student-default';
  try {
    let existing = window.localStorage.getItem(LEARNER_ID_KEY);
    if (!existing) {
      existing = `learner_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      window.localStorage.setItem(LEARNER_ID_KEY, existing);
    }
    return existing;
  } catch {
    return 'student-default';
  }
}

/**
 * Loads Supabase URL & Anon Key directly from .env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
 */
export function loadSupabaseConfig() {
  const envUrl = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();
  return { supabaseUrl: envUrl, supabaseAnonKey: envKey };
}

export function isSupabaseConfigured(config = null) {
  const cfg = config || loadSupabaseConfig();
  return Boolean(
    cfg?.supabaseUrl &&
      cfg.supabaseUrl.startsWith('http') &&
      cfg?.supabaseAnonKey &&
      cfg.supabaseAnonKey.length > 15
  );
}

export function getSupabaseClient(config = null) {
  const cfg = config || loadSupabaseConfig();
  if (!isSupabaseConfigured(cfg)) return null;

  const sig = `${cfg.supabaseUrl}::${cfg.supabaseAnonKey}`;
  if (cachedSupabaseClient && cachedClientSignature === sig) {
    return cachedSupabaseClient;
  }

  try {
    cachedSupabaseClient = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    cachedClientSignature = sig;
    return cachedSupabaseClient;
  } catch (err) {
    console.warn('Supabase client init error:', err);
    return null;
  }
}

/**
 * Strips non-serializable functions (`evaluateSubmission`) before saving to JSON / Supabase `jsonb`,
 * while preserving all curriculum metadata, custom timelines, and starter files.
 */
export function serializeTracksForStorage(tracks = []) {
  return tracks.map((track) => ({
    ...track,
    nodes: (track.nodes || []).map((node) => ({
      ...node,
      challengeSpec: node.challengeSpec
        ? {
            prompt: node.challengeSpec.prompt,
            targetFile: node.challengeSpec.targetFile,
            conceptsTested: node.challengeSpec.conceptsTested || []
          }
        : undefined
    }))
  }));
}

/**
 * Re-attaches executable `evaluateSubmission` functions to both built-in curriculum nodes
 * AND dynamically generated custom path modules after loading from Supabase or localStorage.
 */
export function rehydrateTracksWithEvaluators(savedTracks = null) {
  if (!Array.isArray(savedTracks) || savedTracks.length === 0) {
    return ROADMAP_TRACKS;
  }
  const validTracks = savedTracks.filter(
    (track) => track && typeof track.id === 'string' && Array.isArray(track.nodes)
  );
  if (validTracks.length === 0) return ROADMAP_TRACKS;

  // Build a lookup map of all built-in nodes by ID
  const builtInNodeMap = new Map();
  for (const track of ROADMAP_TRACKS) {
    for (const node of track.nodes) {
      builtInNodeMap.set(node.id, node);
    }
  }

  return validTracks.map((savedTrack) => {
    const baseTrack = ROADMAP_TRACKS.find((t) => t.id === savedTrack.id) || savedTrack;
    const rehydratedNodes = savedTrack.nodes.filter(
      (node) => node && typeof node.id === 'string'
    ).map((savedNode) => {
      const builtIn = builtInNodeMap.get(savedNode.id);
      if (builtIn) {
        return {
          ...builtIn,
          ...savedNode,
          initialFiles: savedNode.initialFiles || builtIn.initialFiles,
          aiTimeline: savedNode.aiTimeline || builtIn.aiTimeline,
          challengeSpec: {
            ...builtIn.challengeSpec,
            ...(savedNode.challengeSpec || {}),
            evaluateSubmission: builtIn.challengeSpec?.evaluateSubmission
          }
        };
      }

      // Custom / Adaptive Detour Module: re-attach dynamic evaluator based on conceptTag & title
      const dynamicTemplate = createDynamicDetourNode(
        savedNode.conceptTag || 'js-functions-fundamentals',
        savedNode.title || 'Custom Concept Module',
        null
      );

      return {
        ...savedNode,
        challengeSpec: {
          ...(dynamicTemplate?.challengeSpec || {}),
          ...(savedNode.challengeSpec || {}),
          evaluateSubmission:
            dynamicTemplate?.challengeSpec?.evaluateSubmission ||
            ((code, runtimeOutput) => ({
              passed: Boolean(code && code.trim().length > 10 && runtimeOutput),
              socraticPraise: `Great work completing ${savedNode.title}!`,
              socraticHint: `Update the code in ${savedNode.challengeSpec?.targetFile || 'index.js'} and run it to test your solution.`
            }))
        }
      };
    });

    return {
      ...baseTrack,
      ...savedTrack,
      nodes: rehydratedNodes
    };
  });
}

/**
 * Loads the learner's saved state synchronously from localStorage for instant boot,
 * before async Supabase hydration completes.
 */
export function loadLocalLearnerState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      learnerId: parsed.learnerId || getOrCreateLearnerId(),
      activeTrackId: parsed.activeTrackId || 'frontend',
      activeNodeId: parsed.activeNodeId || 'html-semantic-structure',
      tracks: rehydrateTracksWithEvaluators(parsed.tracks),
      moduleWorkspaces: parsed.moduleWorkspaces || {},
      updatedAt: parsed.updatedAt || null
    };
  } catch (err) {
    console.warn('Failed to parse local learner state:', err);
    return null;
  }
}

/**
 * Saves the learner's state locally and syncs to Supabase (`learner_profiles` + `learner_module_progress`).
 */
export async function saveLearnerStateToSupabaseAndLocal({
  activeTrackId,
  activeNodeId,
  tracks,
  moduleWorkspaces = {},
  activeModulePayload = null,
  supabaseConfig = null
}) {
  const learnerId = getOrCreateLearnerId();
  const serializedTracks = serializeTracksForStorage(tracks);
  const nowIso = new Date().toISOString();

  // 1. Always persist immediately to localStorage so zero work is ever lost
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        LOCAL_STATE_KEY,
        JSON.stringify({
          learnerId,
          activeTrackId,
          activeNodeId,
          tracks: serializedTracks,
          moduleWorkspaces,
          updatedAt: nowIso
        })
      );
    } catch (err) {
      console.warn('Local state save warning:', err);
    }
  }

  // 2. If Supabase is configured, upsert profile + module progress to Supabase database
  const supabase = getSupabaseClient(supabaseConfig);
  if (!supabase) {
    return { syncedToSupabase: false, learnerId, updatedAt: nowIso };
  }

  try {
    const { error: profileError } = await supabase.from('learner_profiles').upsert(
      {
        learner_id: learnerId,
        active_track_id: activeTrackId,
        active_node_id: activeNodeId,
        tracks_snapshot: serializedTracks,
        updated_at: nowIso
      },
      { onConflict: 'learner_id' }
    );

    if (profileError) {
      throw profileError;
    }

    if (activeModulePayload && activeModulePayload.nodeId) {
      const { error: moduleError } = await supabase
        .from('learner_module_progress')
        .upsert(
          {
            learner_id: learnerId,
            track_id: activeModulePayload.trackId || activeTrackId,
            node_id: activeModulePayload.nodeId,
            node_title: activeModulePayload.nodeTitle || '',
            status: activeModulePayload.status || 'in-progress',
            is_custom_module: Boolean(activeModulePayload.isCustomModule),
            concept_tag: activeModulePayload.conceptTag || null,
            saved_files: activeModulePayload.files || {},
            attempt_count: activeModulePayload.attemptCount || 0,
            tutor_messages: (activeModulePayload.tutorMessages || []).slice(-25),
            custom_module_definition: activeModulePayload.customModuleDefinition || null,
            updated_at: nowIso
          },
          { onConflict: 'learner_id,track_id,node_id' }
        );

      if (moduleError) {
        throw moduleError;
      }
    }

    return { syncedToSupabase: true, learnerId, updatedAt: nowIso };
  } catch (err) {
    console.warn('Supabase sync error:', err?.message || err);
    return {
      syncedToSupabase: false,
      learnerId,
      error: err?.message || 'Supabase sync error',
      updatedAt: nowIso
    };
  }
}

/**
 * Fetches the learner's saved paths & module workspaces from Supabase on app startup
 * or when Supabase credentials are connected.
 */
export async function fetchLearnerStateFromSupabase(supabaseConfig = null) {
  const supabase = getSupabaseClient(supabaseConfig);
  if (!supabase) return null;

  const learnerId = getOrCreateLearnerId();

  try {
    const { data: profile, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return null;

    const { data: moduleRows, error: modulesError } = await supabase
      .from('learner_module_progress')
      .select('*')
      .eq('learner_id', learnerId);

    if (modulesError) throw modulesError;

    const moduleWorkspaces = {};
    for (const row of moduleRows || []) {
      moduleWorkspaces[row.node_id] = {
        files: row.saved_files && Object.keys(row.saved_files).length > 0 ? row.saved_files : null,
        attemptCount: row.attempt_count || 0,
        tutorMessages: Array.isArray(row.tutor_messages) ? row.tutor_messages : [],
        status: row.status,
        updatedAt: row.updated_at
      };
    }

    const hydratedTracks = rehydrateTracksWithEvaluators(profile.tracks_snapshot);

    // Also cache the freshly fetched Supabase state locally
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          LOCAL_STATE_KEY,
          JSON.stringify({
            learnerId,
            activeTrackId: profile.active_track_id || 'frontend',
            activeNodeId: profile.active_node_id || 'html-semantic-structure',
            tracks: profile.tracks_snapshot,
            moduleWorkspaces,
            updatedAt: profile.updated_at
          })
        );
      } catch {
        // ignore
      }
    }

    return {
      learnerId,
      activeTrackId: profile.active_track_id || 'frontend',
      activeNodeId: profile.active_node_id || 'html-semantic-structure',
      tracks: hydratedTracks,
      moduleWorkspaces,
      updatedAt: profile.updated_at
    };
  } catch (err) {
    console.warn('Failed to fetch learner state from Supabase:', err?.message || err);
    return null;
  }
}
