import { VerdictType } from '../types/forensic';

export const NALLA_CHIRI_COMMENTS = [
  "തങ്കപ്പെട്ട മനസ്സിൻ്റെ ഉടമ!",
  "ഹാ ഹാ നോക്കെടി നോക്ക്, അവന്റെ ചിരി കണ്ടില്ലേ!",
  "ഡേയ് ഡേയ്... ഉണ്ണിക്കുട്ടൻ!",
  "നൈൻ... ഞാൻ എവിടെയോ കണ്ടിട്ടുണ്ടല്ലോ... എടാ സണ്ണിക്കുട്ടാ, നീയല്ലേ ഇത്?",
];

export const KALLA_CHIRI_COMMENTS = [
  "തോമസ്സൂട്ടി വിട്ടോടാ... ഇതൊരു കള്ളി ചിരിയാണേയ്! വിട്ടോടാ!",
  "എന്തൊരു പ്രഹസനമാണ് സജി!",
  "നീ എന്താ ആളെ വാടിയാക്കാൻ നോക്കുന്നതോ?",
  "എന്താടാ ഈ ചിരി? നീ എന്തോ ഒപ്പിക്കാൻ പോണുണ്ടല്ലോ!",
  "മോനേ... ആ ചിരിയിൽ എന്തോ പന്തികേടുണ്ട്!",
  "ഡാ... നീ എന്തോ വലിയ പ്ലാൻ ഇട്ടിട്ടുണ്ടല്ലോ!",
  "നീ എന്നെ പറ്റിക്കാൻ നോക്കുവാണോ ഡാ?",
];

export const NO_CHIRI_COMMENTS = [
  "ചിരിക്കെടാ അപ്പുക്കുട്ടാ, ചിരിക്ക്!",
  "എന്ത് പറ്റി കുട്ടാ, നന്നായി ചിരിക്ക്!",
  "എന്താ മോനേ, സങ്കടമാണോ?",
  "എന്ത് ഊള ചിരിയാടാ മോനേ!",
];

// Memory to avoid repeating the exact same comment twice in a row
const lastCommentIndexMap: Record<string, number> = {};

export function getRandomInspectorComment(verdict: VerdictType): string {
  let pool: string[] = [];
  switch (verdict) {
    case 'YATHARTHA_CHIRI':
      pool = NALLA_CHIRI_COMMENTS;
      break;
    case 'KALLA_CHIRI':
      pool = KALLA_CHIRI_COMMENTS;
      break;
    case 'NO_SMILE':
    default:
      pool = NO_CHIRI_COMMENTS;
      break;
  }

  if (pool.length === 0) return "";
  if (pool.length === 1) return pool[0];

  const lastIndex = lastCommentIndexMap[verdict] ?? -1;
  let newIndex = Math.floor(Math.random() * pool.length);

  // Avoid repeating the previous index if possible
  if (newIndex === lastIndex) {
    newIndex = (newIndex + 1) % pool.length;
  }

  lastCommentIndexMap[verdict] = newIndex;
  return pool[newIndex];
}
