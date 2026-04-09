// Local JD scorer — zero API cost
// Compares resume text vs. JD text using the taxonomy + stopword removal
// Score = (taxonomy terms found in both) / (taxonomy terms found in JD) * 100

import {
  TAXONOMY,
  TERM_TO_CATEGORY,
  CATEGORY_LABELS,
  ROLE_GUARDRAILS,
  detectRoleLevel,
} from './taxonomy';

export interface TermMatch {
  term: string;
  category: string;
  categoryLabel: string;
  inResume: boolean;
  inJD: boolean;
}

export interface CategoryBreakdown {
  id: string;
  label: string;
  jdTerms: string[];       // terms from this category found in JD
  matched: string[];       // matched in both resume + JD
  missing: string[];       // in JD but not resume
  score: number;           // 0–100 for this category
}

export interface GuardrailCheck {
  term: string;
  presentInResume: boolean;
  presentInJD: boolean;
}

export interface LocalJDResult {
  overlapScore: number;              // 0–100 overall
  topRequirements: string[];         // top 5–7 JD taxonomy terms
  matchedTerms: string[];            // in both JD + resume
  missingTerms: string[];            // in JD but NOT resume
  categoryBreakdown: CategoryBreakdown[];
  guardrailChecks: GuardrailCheck[];
  roleLevel: string | null;
  roleLevelLabel: string | null;
  termCount: { jd: number; resume: number; overlap: number };
}

// ---------------------------------------------------------------------------
// STOPWORDS — ignore these when tokenizing
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'that', 'this', 'these', 'those', 'it', 'its', 'you', 'your', 'we',
  'our', 'they', 'their', 'he', 'she', 'his', 'her', 'who', 'which',
  'what', 'how', 'when', 'where', 'why', 'all', 'each', 'every', 'any',
  'some', 'such', 'than', 'then', 'there', 'here', 'about', 'above',
  'after', 'also', 'between', 'during', 'through', 'into', 'over',
  'under', 'up', 'down', 'out', 'off', 'into', 'across',
]);

// ---------------------------------------------------------------------------
// Main scorer
// ---------------------------------------------------------------------------
export function scoreLocalJD(
  resumeText: string,
  jdText: string,
  jobTitle: string = ''
): LocalJDResult {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jdText.toLowerCase();

  // --- 1. Find all taxonomy terms in JD ---
  const jdTerms = new Set<string>();
  for (const [term] of TERM_TO_CATEGORY) {
    if (containsTerm(jdLower, term)) {
      jdTerms.add(term);
    }
  }

  // --- 2. Find all taxonomy terms in resume ---
  const resumeTerms = new Set<string>();
  for (const [term] of TERM_TO_CATEGORY) {
    if (containsTerm(resumeLower, term)) {
      resumeTerms.add(term);
    }
  }

  // --- 3. Overlap ---
  const matched = [...jdTerms].filter(t => resumeTerms.has(t));
  const missing = [...jdTerms].filter(t => !resumeTerms.has(t));

  const overlapScore = jdTerms.size > 0
    ? Math.round((matched.length / jdTerms.size) * 100)
    : 0;

  // --- 4. Category breakdown ---
  const categoryMap = new Map<string, CategoryBreakdown>();
  for (const cat of TAXONOMY) {
    categoryMap.set(cat.id, {
      id: cat.id,
      label: cat.label,
      jdTerms: [],
      matched: [],
      missing: [],
      score: 0,
    });
  }

  for (const term of jdTerms) {
    const catId = TERM_TO_CATEGORY.get(term);
    if (!catId) continue;
    const cat = categoryMap.get(catId);
    if (!cat) continue;
    cat.jdTerms.push(term);
    if (resumeTerms.has(term)) cat.matched.push(term);
    else cat.missing.push(term);
  }

  const categoryBreakdown = [...categoryMap.values()]
    .filter(c => c.jdTerms.length > 0)
    .map(c => ({
      ...c,
      score: c.jdTerms.length > 0
        ? Math.round((c.matched.length / c.jdTerms.length) * 100)
        : 0,
    }))
    .sort((a, b) => b.jdTerms.length - a.jdTerms.length);

  // --- 5. Top requirements: missing terms ranked by JD term frequency ---
  // Weight: terms in high-density categories rank higher
  const topRequirements = rankTopRequirements(jdLower, [...jdTerms], matched);

  // --- 6. Role-level guardrails ---
  const roleLevel = detectRoleLevel(jobTitle);
  const guardrails = roleLevel ? ROLE_GUARDRAILS[roleLevel] : null;
  const guardrailChecks: GuardrailCheck[] = guardrails
    ? guardrails.requiredTerms.map(term => ({
        term,
        presentInResume: containsTerm(resumeLower, term.toLowerCase()),
        presentInJD: containsTerm(jdLower, term.toLowerCase()),
      }))
    : [];

  return {
    overlapScore,
    topRequirements,
    matchedTerms: matched,
    missingTerms: missing,
    categoryBreakdown,
    guardrailChecks,
    roleLevel,
    roleLevelLabel: roleLevel ? ROLE_GUARDRAILS[roleLevel]?.label ?? roleLevel : null,
    termCount: { jd: jdTerms.size, resume: resumeTerms.size, overlap: matched.length },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if text contains a term as a whole word/phrase (not substring of longer word).
 * Handles multi-word phrases and acronyms.
 */
function containsTerm(text: string, term: string): boolean {
  // For short acronyms (≤4 chars all-caps), use word boundary
  if (term.length <= 4 && term === term.toUpperCase() && /^[A-Z0-9.]+$/.test(term)) {
    return new RegExp(`\\b${escapeRegex(term.toLowerCase())}\\b`).test(text);
  }
  // For multi-word phrases or mixed-case terms
  return text.includes(term.toLowerCase());
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rank top 5–7 requirements from the JD:
 * - Prioritize terms that appear multiple times in JD (high frequency = high importance)
 * - Then terms the candidate is missing (gaps first)
 * - Cap at 7
 */
function rankTopRequirements(
  jdLower: string,
  jdTerms: string[],
  matched: string[]
): string[] {
  const matchedSet = new Set(matched);
  const scored = jdTerms.map(term => {
    // Count occurrences in JD
    const regex = new RegExp(escapeRegex(term), 'gi');
    const freq = (jdLower.match(regex) ?? []).length;
    const isGap = !matchedSet.has(term);
    return { term, score: freq * (isGap ? 2 : 1) }; // gaps weighted 2x
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(s => s.term);
}

// ---------------------------------------------------------------------------
// Convert LocalJDResult → JDMatchResult shape (for existing ScoreCard UI)
// ---------------------------------------------------------------------------
export function localToJDMatchResult(result: LocalJDResult) {
  return {
    overlapScore: result.overlapScore,
    topRequirements: result.topRequirements,
    matchedExperiences: result.matchedTerms.slice(0, 10).map(term => ({
      requirement: term,
      evidence: `Found in resume`,
      strength: 'strong' as const,
    })),
    gaps: result.missingTerms.slice(0, 8),
    fitSummary: buildFitSummary(result),
  };
}

function buildFitSummary(r: LocalJDResult): string {
  const pct = r.overlapScore;
  const topMissing = r.missingTerms.slice(0, 3).join(', ');
  const topMatch = r.matchedTerms.slice(0, 3).join(', ');

  let summary = '';
  if (pct >= 75) summary = `Strong overlap (${pct}%). `;
  else if (pct >= 50) summary = `Moderate overlap (${pct}%) — targeted additions will improve fit. `;
  else summary = `Low overlap (${pct}%) — significant gaps to address. `;

  if (topMatch) summary += `Matched: ${topMatch}. `;
  if (topMissing) summary += `Missing: ${topMissing}.`;

  if (r.roleLevelLabel) {
    const guardrailMissing = r.guardrailChecks
      .filter(g => !g.presentInResume && g.presentInJD)
      .map(g => g.term)
      .slice(0, 2);
    if (guardrailMissing.length > 0) {
      summary += ` ${r.roleLevelLabel}-level terms missing from resume: ${guardrailMissing.join(', ')}.`;
    }
  }

  return summary;
}
