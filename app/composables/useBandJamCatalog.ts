export const STYLES = [
  "Blues",
  "Swing",
  "Pop Rock",
  "Disco",
  "Reggae",
  "6/8",
  "Funk",
  "Latin",
  "Country",
  "Waltz",
] as const;

export const INSTRUMENTS = [
  "C",
  "Bb",
  "Eb",
  "F",
  "Bass clef (upper)",
  "Bass line (Bass guitar)",
  "Bass line (Tuba), Harmony",
  "Drumkit",
  "Mallets",
] as const;

export const DIFFICULTIES = ["1", "2", "3"] as const;

export type Style = (typeof STYLES)[number];
export type Instrument = (typeof INSTRUMENTS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface AssetEntry {
  name: string;
  type: string;
  data: string;
  filePath?: string;
}

type WarmupInstrumentMap = Partial<Record<Instrument, { sheetFile?: string }>>;
type WarmupDifficultyMap = Record<
  Difficulty,
  { instruments: WarmupInstrumentMap }
>;
type WarmupMap = Record<Style, { levels: WarmupDifficultyMap }>;

// Placeholders removed: default warmups now have no built-in sheet files.
const DEFAULT_WARMUPS = buildDefaultWarmups();

function buildDefaultWarmups(): WarmupMap {
  const map = {} as WarmupMap;

  for (const style of STYLES) {
    map[style] = {
      levels: {} as Record<Difficulty, { instruments: WarmupInstrumentMap }>,
    };

    for (const difficulty of DIFFICULTIES) {
      map[style].levels[difficulty] = {
        instruments: {},
      };

      for (const instrument of INSTRUMENTS) {
        // No default sheetFile provided anymore.
        map[style].levels[difficulty].instruments[instrument] = {};
      }
    }
  }

  // preserve previous omission for Mallets in Waltz level 3
  delete map.Waltz.levels["3"].instruments.Mallets;
  return map;
}

export function getDefaultSheetEntry(
  style: string,
  instrument: string,
  difficulty: string,
): AssetEntry | null {
  const filePath =
    DEFAULT_WARMUPS?.[style as Style]?.levels?.[difficulty as Difficulty]
      ?.instruments?.[instrument as Instrument]?.sheetFile;

  if (!filePath) return null;

  return {
    name: "default-sheet",
    type: filePath.endsWith(".pdf") ? "application/pdf" : "image/*",
    data: filePath,
  };
}
