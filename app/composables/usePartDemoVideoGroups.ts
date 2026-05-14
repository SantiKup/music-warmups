/**
 * Defines groups of instruments for Part Demo Video uploads.
 * When uploading a Part Demo Video to a group, it applies to all instruments in that group.
 */

import type { Instrument } from "~/composables/useBandJamCatalog";

export const PART_DEMO_VIDEO_GROUPS = [
  {
    id: "A",
    name: "Group A - Brass/Woodwinds & Mallets",
    instruments: [
      "C",
      "Bb",
      "Eb",
      "F",
      "Bass clef (Upper)",
      "Mallets",
    ] as const,
  },
  {
    id: "B",
    name: "Group B - Drums",
    instruments: ["Drumkit"] as const,
  },
  {
    id: "C",
    name: "Group C - Bass Line",
    instruments: ["Bass line (Bass guitar)"] as const,
  },
  {
    id: "D",
    name: "Group D - Harmony",
    instruments: ["Harmony (Guitar/Piano)"] as const,
  },
] as const;

export type PartDemoVideoGroupId =
  (typeof PART_DEMO_VIDEO_GROUPS)[number]["id"];

/**
 * Get the group ID for a given instrument
 */
export function getGroupIdForInstrument(
  instrument: Instrument,
): PartDemoVideoGroupId | null {
  for (const group of PART_DEMO_VIDEO_GROUPS) {
    if ((group.instruments as readonly Instrument[]).includes(instrument)) {
      return group.id as PartDemoVideoGroupId;
    }
  }
  return null;
}

/**
 * Get all group IDs for display
 */
export function getGroupIds(): PartDemoVideoGroupId[] {
  return PART_DEMO_VIDEO_GROUPS.map((g) => g.id) as PartDemoVideoGroupId[];
}

/**
 * Get group name by ID
 */
export function getGroupName(groupId: PartDemoVideoGroupId): string {
  const group = PART_DEMO_VIDEO_GROUPS.find((g) => g.id === groupId);
  return group?.name || groupId;
}

/**
 * Get instruments in a group
 */
export function getInstrumentsInGroup(
  groupId: PartDemoVideoGroupId,
): readonly Instrument[] {
  const group = PART_DEMO_VIDEO_GROUPS.find((g) => g.id === groupId);
  return (group?.instruments || []) as readonly Instrument[];
}
