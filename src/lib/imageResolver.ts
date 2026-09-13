import { VerdictType } from '../types/forensic';

export const RESULT_IMAGE_PAIRS: Record<VerdictType, string[]> = {
  YATHARTHA_CHIRI: ['nallachiri', 'nallachiri2'],
  KALLA_CHIRI: ['Kalla Chiri', 'Kalla Chiri2'],
  NO_SMILE: ['no chiri', 'no chiri (2)'],
};

/**
 * Manifest of real meme assets in public/picture/
 */
export const ACTUAL_MEME_ASSETS: string[] = [
  'kalla chiri.gif',
  'Kalla Chiri2.jpeg',
  'nallachiri.jpeg',
  'nallachiri2.jpeg',
  'no chiri (2).jpeg',
  'no chiri.jpeg',
];

const lastSelectedImageMap: Record<string, string> = {};

/**
 * Returns a randomly selected image basename for the verdict,
 * avoiding immediate repetition if pair has multiple options.
 */
export function getRandomMemeImageBasename(verdict: VerdictType): string {
  const options = RESULT_IMAGE_PAIRS[verdict] || ['nallachiri'];
  if (options.length === 1) return options[0];

  const lastImage = lastSelectedImageMap[verdict];
  const candidates = options.filter((img) => img !== lastImage);
  const selected = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : options[Math.floor(Math.random() * options.length)];

  lastSelectedImageMap[verdict] = selected;
  return selected;
}

/**
 * Normalizes a string for loose comparison (lowercase, trimmed, collapsed whitespace)
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Generates candidate relative URLs for a given image basename.
 * Works with case differences, spaces, parentheses, and various extensions.
 * Browser-compatible and works in both dev & production builds.
 */
export function getImageCandidateUrls(basename: string): string[] {
  const rawUrls: string[] = [];
  const normalizedRequestedBase = normalizeName(basename);

  // 1. Look for exact or loose matches in the actual manifest first
  for (const assetFile of ACTUAL_MEME_ASSETS) {
    const lastDotIndex = assetFile.lastIndexOf('.');
    const assetBaseName = lastDotIndex !== -1 ? assetFile.substring(0, lastDotIndex) : assetFile;
    
    if (normalizeName(assetBaseName) === normalizedRequestedBase) {
      rawUrls.push(`/picture/${assetFile}`);
      rawUrls.push(`/picture/${encodeURI(assetFile)}`);
      rawUrls.push(`/picture/${encodeURIComponent(assetFile)}`);
    }
  }

  // 2. Generate fallback extension candidates
  const extensions = ['gif', 'jpeg', 'jpg', 'png', 'webp'];
  extensions.forEach((ext) => {
    rawUrls.push(`/picture/${basename}.${ext}`);
    rawUrls.push(`/picture/${encodeURI(basename)}.${ext}`);
    rawUrls.push(`/picture/${basename.toLowerCase()}.${ext}`);
    rawUrls.push(`/picture/${encodeURI(basename.toLowerCase())}.${ext}`);
  });

  // 3. Raw basename as URL (if already contains extension)
  rawUrls.push(`/picture/${basename}`);
  rawUrls.push(`/picture/${encodeURI(basename)}`);

  // Deduplicate while preserving priority order
  const uniqueUrls: string[] = [];
  const seen = new Set<string>();

  for (const url of rawUrls) {
    if (!seen.has(url)) {
      seen.add(url);
      uniqueUrls.push(url);
    }
  }

  return uniqueUrls;
}

