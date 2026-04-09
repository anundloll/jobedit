// Deterministic scoring engine — zero API cost
// All logic runs locally via regex + heuristics

export interface BulletAnalysis {
  text: string;
  hasResult: boolean;    // X: quantifiable outcome
  hasMetric: boolean;    // Y: number/percent/dollar
  hasAction: boolean;    // Z: strong active verb
  xyzScore: number;      // 0–3
  issues: string[];
}

export interface SectionAnalysis {
  name: string;
  bullets: BulletAnalysis[];
  metricDensity: number;      // 0–1
  densityFlag: boolean;       // true if < 7/10 bullets have metrics
}

export interface ScannabilityAnalysis {
  summaryLength: number;
  summaryOk: boolean;
  estimatedPageCount: number;
  pageCountOk: boolean;
  criticalKeywordsFound: string[];
  criticalKeywordsMissing: string[];
  score: number;
}

export interface SpellingIssue {
  word: string;
  context: string;
  suggestions: string[];
}

export interface AIWritingFlag {
  type: 'word' | 'phrase' | 'structure';
  match: string;
  reason: string;
  context?: string;
}

export interface LocalScoreResult {
  overallScore: number;
  xyzScore: number;
  metricDensityScore: number;
  scannabilityScore: number;
  formattingScore: number;
  aiWritingScore: number;        // 0–100 (100 = human, 0 = pure AI)
  sections: SectionAnalysis[];
  scannability: ScannabilityAnalysis;
  spellingIssues: SpellingIssue[];
  aiTropeFlags: string[];        // legacy: simple word list
  aiWritingFlags: AIWritingFlag[]; // new: detailed flags with reason
  summary: string;
}

// ---------------------------------------------------------------------------
// VOCABULARY — banned words (expanded from Wikipedia Signs of AI Writing)
// ---------------------------------------------------------------------------

// Tier 1: Never acceptable in a resume
const AI_BANNED_TIER1 = [
  'delve', 'tapestry', 'multifaceted', 'pioneering', 'bespoke',
  'synergy', 'ideate', 'ideation', 'paradigm shift', 'thought leader',
  'boil the ocean', 'move the needle', 'circle back', 'actionable insights',
  'low-hanging fruit', 'bleeding edge', 'game-changing', 'deep dive',
  'learnings', 'ecosystem', 'unlock', 'bandwidth',
];

// Tier 2: AI signals that weaken a Director-level resume
const AI_BANNED_TIER2 = [
  // Inflated significance words (Wikipedia list)
  'crucial', 'pivotal', 'vital', 'transformative', 'groundbreaking', 'renowned',
  'meticulous', 'meticulously', 'intricate', 'intricacies', 'interplay',
  'testament', 'indelible', 'enduring', 'vibrant', 'profound', 'noteworthy',
  // Promotional/marketing tone
  'boasts', 'showcasing', 'leveraging', 'robust', 'holistic', 'seamless',
  'cutting-edge', 'impactful', 'value-add', 'best-in-class', 'world-class',
  // Copula avoidance words (AI uses these to avoid "is/was")
  'serves as', 'stands as', 'acts as', 'functions as',
  // Corporate filler
  'synergistic', 'paradigm', 'leverage', 'bespoke', 'scalable solutions',
  'thought leadership', 'passion for', 'passionate about',
  // Garner (classic AI tell)
  'garner', 'garnered',
  // Fostering/cultivating cluster
  'fostering', 'cultivating', 'championing', 'spearheading initiatives',
  // Landscape / evolving landscape
  'evolving landscape', 'dynamic landscape', 'rapidly evolving',
  // Align/resonate cluster
  'align with', 'resonates with', 'aligns perfectly',
];

// Tier 3: Elegant variation — AI synonyms for "I" or the person
const AI_ELEGANT_VARIATION = [
  'seasoned professional', 'accomplished executive', 'dynamic leader',
  'results-driven', 'results-oriented', 'proven track record',
  'dedicated professional', 'innovative thinker', 'strategic visionary',
  'consummate professional', 'forward-thinking', 'detail-oriented',
];

// ---------------------------------------------------------------------------
// STRUCTURAL PATTERNS (regex-based)
// ---------------------------------------------------------------------------

interface StructuralPattern {
  pattern: RegExp;
  label: string;
  reason: string;
}

const AI_STRUCTURAL_PATTERNS: StructuralPattern[] = [
  // "Not just X, but also Y" — AI favorite false dichotomy
  {
    pattern: /not just .{3,40}, but (also )?/i,
    label: '"Not just X, but also Y"',
    reason: 'Classic AI contrast construction. Replace with a direct claim.',
  },
  // Rule of three adjective triads — "innovative, dynamic, and results-driven"
  {
    pattern: /\b\w+,\s+\w+,?\s+and\s+\w+\b(?=\s+(professional|leader|executive|manager|individual))/i,
    label: 'Adjective triad before title',
    reason: 'AI overuses adjective triplets before nouns. Pick one or use none.',
  },
  // Hanging -ing clauses at end of bullet ("...ensuring success", "...highlighting impact")
  {
    pattern: /,\s+(ensuring|highlighting|underscoring|demonstrating|reflecting|showcasing|emphasizing|fostering|cultivating|contributing to)\s+\w/i,
    label: 'Hanging -ing clause',
    reason: 'AI attaches floating -ing phrases to pad sentences. Cut or rephrase as a direct result.',
  },
  // "Committed to" opener
  {
    pattern: /^committed to\b/i,
    label: '"Committed to" opener',
    reason: 'Vague intent statement. Lead with what you actually did.',
  },
  // "Passionate about" opener
  {
    pattern: /\bpassionate about\b/i,
    label: '"Passionate about"',
    reason: 'Signals soft language over hard evidence. Replace with a result.',
  },
  // Excessive em-dash usage (more than 2 in a single bullet)
  {
    pattern: /([—–].*){3,}/,
    label: 'Em-dash overuse',
    reason: 'AI uses em-dashes as a tic. Rewrite as clean sentences.',
  },
  // "In order to" — AI verbosity
  {
    pattern: /\bin order to\b/i,
    label: '"In order to"',
    reason: 'Verbose. Replace with "to".',
  },
  // "A wide range of" / "a variety of" — AI padding
  {
    pattern: /\b(a wide range of|a variety of|numerous|various)\b/i,
    label: 'Vague quantity phrase',
    reason: 'Replace with an actual number.',
  },
  // "Successfully" — redundant qualifier
  {
    pattern: /\bsuccessfully\b/i,
    label: '"Successfully"',
    reason: 'Redundant. If you did it, it was successful. Remove.',
  },
  // "Responsible for" opener — passive construction
  {
    pattern: /^responsible for\b/i,
    label: '"Responsible for" opener',
    reason: 'Passive framing. Start with the verb instead.',
  },
  // "Helped to" — dilutes ownership
  {
    pattern: /\bhelped to\b/i,
    label: '"Helped to"',
    reason: 'Obscures your direct contribution. Own the action.',
  },
  // "Worked with" opener — vague
  {
    pattern: /^worked with\b/i,
    label: '"Worked with" opener',
    reason: 'Too vague. What was your role? Replace with what you directed, built, or delivered.',
  },
  // "Utilized" / "utilized" — AI prefers "utilized" over "used"
  {
    pattern: /\butilized?\b/i,
    label: '"Utilized"',
    reason: '"Used" is cleaner. "Utilized" is corporate filler.',
  },
  // "Instrumental in" — passive indirect phrasing
  {
    pattern: /\binstrumental in\b/i,
    label: '"Instrumental in"',
    reason: 'Indirect. Say what you did, not that you were "instrumental" in it.',
  },
];

// ---------------------------------------------------------------------------
// Active verb check
// ---------------------------------------------------------------------------
const STRONG_ACTIVE_VERBS = [
  /^directed/i, /^engineered/i, /^scaled/i, /^produced/i, /^built/i,
  /^led/i, /^launched/i, /^negotiated/i, /^drove/i, /^delivered/i,
  /^managed/i, /^created/i, /^developed/i, /^designed/i, /^implemented/i,
  /^generated/i, /^increased/i, /^reduced/i, /^saved/i, /^grew/i,
  /^oversaw/i, /^partnered/i, /^executed/i, /^secured/i,
  /^closed/i, /^won/i, /^authored/i, /^architected/i,
  /^streamlined/i, /^restructured/i, /^expanded/i, /^accelerated/i,
  /^established/i, /^recruited/i, /^trained/i, /^coached/i,
  /^transformed/i, /^consolidated/i, /^deployed/i, /^migrated/i,
  /^renegotiated/i, /^acquired/i, /^divested/i, /^integrated/i,
];

const METRIC_PATTERN = /(\$[\d,.]+[MBKmkb]?|\d+[\d,.]*\s*%|[\d,.]+[x]|\d+[\d,.]*\s*(million|billion|thousand|M|B|K|mm)|\d+\+?\s*(clients?|accounts?|campaigns?|markets?|brands?|deals?))/i;
const RESULT_PATTERN = /(result|saving|increased|grew|reduced|improved|achieved|delivered|generated|produced|drove|returned|gained|cut|eliminated|boosted|surpass|exceeded|outperform)/i;

const CHARS_PER_PAGE = 3200;

const CRITICAL_KEYWORDS = [
  'Director', 'VP', 'Strategy', 'Revenue', 'P&L', 'Comcast', 'HBO',
  'NBCUniversal', 'Media', 'Ad Tech', 'Programmatic', 'CTV',
];

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------
export function scoreResume(text: string): LocalScoreResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = parseSections(lines);

  const bulletAnalyses = sections.flatMap(s => s.bullets);
  const totalBullets = bulletAnalyses.length;

  const xyzPassing = bulletAnalyses.filter(b => b.xyzScore >= 2).length;
  const xyzScore = totalBullets > 0 ? Math.round((xyzPassing / totalBullets) * 100) : 0;

  const bulletsWithMetrics = bulletAnalyses.filter(b => b.hasMetric).length;
  const metricDensityScore = totalBullets > 0 ? Math.round((bulletsWithMetrics / totalBullets) * 100) : 0;

  const scannability = analyzeScannability(text, lines);
  const spellingIssues = checkCommonErrors(text);
  const { flags: aiWritingFlags, score: aiWritingScore } = detectAIWriting(text, lines);

  // Legacy simple list for backward compat
  const aiTropeFlags = aiWritingFlags.filter(f => f.type === 'word').map(f => f.match);

  const formattingScore = calcFormattingScore(text, lines, scannability);

  const overallScore = Math.round(
    xyzScore * 0.30 +
    metricDensityScore * 0.25 +
    scannability.score * 0.20 +
    formattingScore * 0.10 +
    aiWritingScore * 0.15
  );

  return {
    overallScore,
    xyzScore,
    metricDensityScore,
    scannabilityScore: scannability.score,
    formattingScore,
    aiWritingScore,
    sections,
    scannability,
    spellingIssues,
    aiTropeFlags,
    aiWritingFlags,
    summary: buildSummary(overallScore, xyzScore, metricDensityScore, scannability, aiWritingFlags),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSections(lines: string[]): SectionAnalysis[] {
  const sections: SectionAnalysis[] = [];
  const sectionHeaders = /^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EDUCATION|SKILLS|SUMMARY|OBJECTIVE|CERTIFICATIONS|AWARDS|ACHIEVEMENTS)/i;

  let currentSection: SectionAnalysis | null = null;

  for (const line of lines) {
    if (sectionHeaders.test(line) || (line.length < 40 && line === line.toUpperCase() && line.length > 3)) {
      if (currentSection) sections.push(currentSection);
      currentSection = { name: line, bullets: [], metricDensity: 0, densityFlag: false };
    } else if (currentSection && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\u2022/.test(line))) {
      const cleanLine = line.replace(/^[•\-\*\u2022]\s*/, '');
      currentSection.bullets.push(analyzeBullet(cleanLine));
    } else if (currentSection && line.match(/^[A-Z][^.!?]*[.!?]?$/) && line.length > 30 && line.length < 200) {
      currentSection.bullets.push(analyzeBullet(line));
    }
  }

  if (currentSection) sections.push(currentSection);

  return sections.map(s => {
    const bulletCount = s.bullets.length;
    const withMetrics = s.bullets.filter(b => b.hasMetric).length;
    const metricDensity = bulletCount > 0 ? withMetrics / bulletCount : 0;
    return { ...s, metricDensity, densityFlag: bulletCount >= 5 && metricDensity < 0.7 };
  });
}

function analyzeBullet(text: string): BulletAnalysis {
  const issues: string[] = [];
  const hasMetric = METRIC_PATTERN.test(text);
  const hasResult = RESULT_PATTERN.test(text) || hasMetric;
  const hasAction = STRONG_ACTIVE_VERBS.some(r => r.test(text));

  if (!hasAction) issues.push('Start with a strong active verb (e.g., Directed, Scaled, Delivered)');
  if (!hasMetric) issues.push('Add a quantifiable metric ($, %, or count)');
  if (!hasResult) issues.push('Clarify the business result or impact');

  const xyzScore = [hasResult, hasMetric, hasAction].filter(Boolean).length;
  return { text, hasResult, hasMetric, hasAction, xyzScore, issues };
}

function analyzeScannability(text: string, _lines: string[]): ScannabilityAnalysis {
  const summaryMatch = text.match(/SUMMARY|OBJECTIVE|PROFILE/i);
  let summaryText = '';
  if (summaryMatch) {
    const idx = text.indexOf(summaryMatch[0]);
    summaryText = text.slice(idx, idx + 800);
  } else {
    summaryText = text.slice(0, 600);
  }

  const sentences = summaryText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summaryLength = sentences.length;
  const summaryOk = summaryLength >= 3 && summaryLength <= 5;
  const estimatedPageCount = Math.max(1, Math.round(text.length / CHARS_PER_PAGE));
  const pageCountOk = estimatedPageCount <= 2;

  const criticalKeywordsFound = CRITICAL_KEYWORDS.filter(kw => new RegExp(kw, 'i').test(text));
  const criticalKeywordsMissing = CRITICAL_KEYWORDS.filter(kw => !new RegExp(kw, 'i').test(text));

  let score = 60;
  if (summaryOk) score += 15;
  else if (summaryLength < 3) score -= 10;
  else score -= 5;
  if (pageCountOk) score += 15;
  else score -= 20;
  score += Math.min(10, criticalKeywordsFound.length * 2);

  return { summaryLength, summaryOk, estimatedPageCount, pageCountOk, criticalKeywordsFound, criticalKeywordsMissing, score: Math.max(0, Math.min(100, score)) };
}

function detectAIWriting(text: string, lines: string[]): { flags: AIWritingFlag[]; score: number } {
  const flags: AIWritingFlag[] = [];
  const lower = text.toLowerCase();

  // Tier 1 — hard bans
  for (const word of AI_BANNED_TIER1) {
    if (lower.includes(word.toLowerCase())) {
      const ctx = extractContext(text, word);
      flags.push({ type: 'word', match: word, reason: 'Tier 1 AI trope — immediately flags automated writing.', context: ctx });
    }
  }

  // Tier 2 — strong signals
  for (const word of AI_BANNED_TIER2) {
    if (lower.includes(word.toLowerCase())) {
      const ctx = extractContext(text, word);
      flags.push({ type: 'phrase', match: word, reason: 'Common AI vocabulary — weakens Director-level credibility.', context: ctx });
    }
  }

  // Tier 3 — elegant variation
  for (const phrase of AI_ELEGANT_VARIATION) {
    if (lower.includes(phrase.toLowerCase())) {
      const ctx = extractContext(text, phrase);
      flags.push({ type: 'phrase', match: phrase, reason: 'AI synonym for "I" or the person — replace with specific achievements.', context: ctx });
    }
  }

  // Structural patterns — run on each line/bullet
  const allLines = lines.concat([text]); // also check full text for multi-line patterns
  for (const line of lines) {
    for (const sp of AI_STRUCTURAL_PATTERNS) {
      if (sp.pattern.test(line)) {
        flags.push({ type: 'structure', match: sp.label, reason: sp.reason, context: line.slice(0, 80) });
      }
    }
  }
  // Also check full text for em-dash overuse across the whole document
  const emDashCount = (text.match(/[—–]/g) ?? []).length;
  if (emDashCount > 6) {
    flags.push({ type: 'structure', match: `Em-dash count: ${emDashCount}`, reason: 'AI uses em-dashes as a stylistic tic. More than 6 in a resume is a signal.', });
  }

  // Passive voice detection (simple heuristic: "was [verb]ed by", "were [verb]ed")
  const passiveMatches = text.match(/\b(was|were|been|is|are)\s+\w+ed\b/gi) ?? [];
  if (passiveMatches.length > 3) {
    flags.push({ type: 'structure', match: `Passive voice: ${passiveMatches.length} instances`, reason: 'Passive constructions dilute ownership. Rewrite with active verbs.' });
  }

  // Dedup flags by match
  const seen = new Set<string>();
  const deduped = flags.filter(f => {
    const key = f.match.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Score: start at 100, penalise per flag
  const penalty = deduped.reduce((acc, f) => {
    if (f.type === 'word') return acc + 8;         // tier 1: hard hit
    if (f.type === 'phrase') return acc + 4;        // tier 2/3: moderate
    if (f.type === 'structure') return acc + 6;     // structural: meaningful
    return acc;
  }, 0);

  return { flags: deduped, score: Math.max(0, Math.min(100, 100 - penalty)) };
}

function extractContext(text: string, phrase: string): string {
  const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - 25);
  const end = Math.min(text.length, idx + phrase.length + 25);
  return '...' + text.slice(start, end).trim() + '...';
}

function checkCommonErrors(text: string): SpellingIssue[] {
  const issues: SpellingIssue[] = [];
  const commonErrors: Record<string, string[]> = {
    'recieve': ['receive'],
    'acheive': ['achieve'],
    'managment': ['management'],
    'experiance': ['experience'],
    'leadrship': ['leadership'],
    'developement': ['development'],
    'stratagey': ['strategy'],
    'negociate': ['negotiate'],
    'negociation': ['negotiation'],
    'buisness': ['business'],
    'departement': ['department'],
    'implmented': ['implemented'],
    'responsable': ['responsible'],
    'profesional': ['professional'],
    'occured': ['occurred'],
    'seperate': ['separate'],
    'accomodate': ['accommodate'],
  };
  for (const [typo, suggestions] of Object.entries(commonErrors)) {
    if (new RegExp(`\\b${typo}\\b`, 'gi').test(text)) {
      const ctxMatch = text.match(new RegExp(`.{0,30}${typo}.{0,30}`, 'gi'));
      issues.push({ word: typo, context: ctxMatch?.[0] ?? typo, suggestions });
    }
  }
  return issues;
}

function calcFormattingScore(text: string, lines: string[], scannability: ScannabilityAnalysis): number {
  let score = 70;
  if (/\d{4}\s*[–\-]\s*(\d{4}|present)/i.test(text)) score += 10;
  const bulletLines = lines.filter(l => /^[•\-\*\u2022]/.test(l));
  if (bulletLines.length > 3) score += 10;
  if (!scannability.pageCountOk) score -= 20;
  if (text.length < 1000) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function buildSummary(
  overall: number,
  xyz: number,
  density: number,
  scannability: ScannabilityAnalysis,
  aiFlags: AIWritingFlag[]
): string {
  const parts: string[] = [];

  if (overall >= 80) parts.push('Strong resume with minor improvements needed.');
  else if (overall >= 60) parts.push('Solid foundation — targeted edits will significantly improve results.');
  else parts.push('Resume needs structural work before submitting to Director+ roles.');

  if (xyz < 60) parts.push(`${100 - xyz}% of bullets are missing XYZ structure.`);
  if (density < 70) parts.push('Metric density is below the 7/10 threshold — add numbers.');
  if (!scannability.summaryOk) parts.push(`Summary is ${scannability.summaryLength} sentences — target 3–5.`);
  if (!scannability.pageCountOk) parts.push(`Estimated ${scannability.estimatedPageCount} pages — trim to 2 for Director level.`);

  const wordFlags = aiFlags.filter(f => f.type === 'word' || f.type === 'phrase').slice(0, 3);
  const structFlags = aiFlags.filter(f => f.type === 'structure').slice(0, 2);

  if (wordFlags.length > 0) parts.push(`AI vocabulary detected: ${wordFlags.map(f => f.match).join(', ')}.`);
  if (structFlags.length > 0) parts.push(`Structural AI tells: ${structFlags.map(f => f.match).join('; ')}.`);

  return parts.join(' ');
}
