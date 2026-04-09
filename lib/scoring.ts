// Deterministic scoring engine — zero API cost
// All logic runs locally via regex + heuristics

export interface BulletAnalysis {
  text: string;
  hasResult: boolean;    // X: quantifiable outcome
  hasMetric: boolean;    // Y: number/percent/dollar
  hasAction: boolean;    // Z: strong active verb
  xyzScore: number;      // 0–3
  issues: string[];
  suggestion?: string;
}

export interface SectionAnalysis {
  name: string;
  bullets: BulletAnalysis[];
  metricDensity: number;      // 0–1
  densityFlag: boolean;       // true if < 7/10 bullets have metrics
}

export interface ScannabilityAnalysis {
  summaryLength: number;        // sentence count
  summaryOk: boolean;           // 3–5 sentences
  estimatedPageCount: number;
  pageCountOk: boolean;
  criticalKeywordsFound: string[];
  criticalKeywordsMissing: string[];
  score: number;                // 0–100
}

export interface SpellingIssue {
  word: string;
  context: string;
  suggestions: string[];
}

export interface LocalScoreResult {
  overallScore: number;         // 0–100
  xyzScore: number;             // 0–100
  metricDensityScore: number;   // 0–100
  scannabilityScore: number;    // 0–100
  formattingScore: number;      // 0–100
  sections: SectionAnalysis[];
  scannability: ScannabilityAnalysis;
  spellingIssues: SpellingIssue[];
  aiTropeFlags: string[];
  summary: string;
}

// --- Constants ---
const AI_BANNED_WORDS = [
  'delve', 'tapestry', 'multifaceted', 'pioneering', 'unlock', 'leverage',
  'synergy', 'bespoke', 'transformative', 'robust', 'holistic', 'seamless',
  'cutting-edge', 'game-changing', 'thought leader', 'ecosystem', 'paradigm',
  'ideate', 'ideation', 'learnings', 'impactful', 'circle back', 'deep dive',
  'move the needle', 'boil the ocean', 'actionable insights', 'bandwidth',
  'low-hanging fruit', 'value-add', 'bleeding edge',
];

const STRONG_ACTIVE_VERBS = [
  /^directed/i, /^engineered/i, /^scaled/i, /^produced/i, /^built/i,
  /^led/i, /^launched/i, /^negotiated/i, /^drove/i, /^delivered/i,
  /^managed/i, /^created/i, /^developed/i, /^designed/i, /^implemented/i,
  /^generated/i, /^increased/i, /^reduced/i, /^saved/i, /^grew/i,
  /^spearheaded/i, /^oversaw/i, /^partnered/i, /^executed/i, /^secured/i,
  /^closed/i, /^won/i, /^authored/i, /^architected/i, /^transformed/i,
  /^streamlined/i, /^restructured/i, /^expanded/i, /^accelerated/i,
];

const METRIC_PATTERN = /(\$[\d,.]+[MBKmkb]?|\d+[\d,.]*\s*%|[\d,.]+[x]|\d+[\d,.]*\s*(million|billion|thousand|M|B|K|mm)|\d+\+?\s*(clients?|accounts?|campaigns?|markets?|brands?|deals?))/i;

const RESULT_PATTERN = /(result|saving|saving|increased|grew|reduced|improved|achieved|delivered|generated|produced|drove|returned|gained|cut|eliminated|boosted|surpass|exceeded|outperform)/i;

// Rough character-per-page estimate for a standard resume layout
const CHARS_PER_PAGE = 3200;

const CRITICAL_KEYWORDS = [
  'Director', 'VP', 'Strategy', 'Revenue', 'P&L', 'Comcast', 'HBO',
  'NBCUniversal', 'Media', 'Ad Tech', 'Programmatic', 'CTV',
];

// --- Main scoring function ---
export function scoreResume(text: string): LocalScoreResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = parseSections(lines);

  const bulletAnalyses = sections.flatMap(s => s.bullets);
  const totalBullets = bulletAnalyses.length;

  // XYZ Score
  const xyzPassing = bulletAnalyses.filter(b => b.xyzScore >= 2).length;
  const xyzScore = totalBullets > 0 ? Math.round((xyzPassing / totalBullets) * 100) : 0;

  // Metric Density Score
  const bulletsWithMetrics = bulletAnalyses.filter(b => b.hasMetric).length;
  const metricDensityScore = totalBullets > 0 ? Math.round((bulletsWithMetrics / totalBullets) * 100) : 0;

  // Scannability
  const scannability = analyzeScannability(text, lines);

  // Spelling issues (common resume errors)
  const spellingIssues = checkCommonErrors(text);

  // AI tropes
  const aiTropeFlags = detectAITropes(text);

  // Formatting score (heuristic based on structure)
  const formattingScore = calcFormattingScore(text, lines, scannability);

  // Overall weighted score
  const overallScore = Math.round(
    xyzScore * 0.35 +
    metricDensityScore * 0.25 +
    scannability.score * 0.25 +
    formattingScore * 0.15
  );

  return {
    overallScore,
    xyzScore,
    metricDensityScore,
    scannabilityScore: scannability.score,
    formattingScore,
    sections,
    scannability,
    spellingIssues,
    aiTropeFlags,
    summary: buildSummary(overallScore, xyzScore, metricDensityScore, scannability, aiTropeFlags),
  };
}

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
      // Sentence that looks like a bullet without a symbol
      currentSection.bullets.push(analyzeBullet(line));
    }
  }

  if (currentSection) sections.push(currentSection);

  // Calculate density per section
  return sections.map(s => {
    const bulletCount = s.bullets.length;
    const withMetrics = s.bullets.filter(b => b.hasMetric).length;
    const metricDensity = bulletCount > 0 ? withMetrics / bulletCount : 0;
    return {
      ...s,
      metricDensity,
      densityFlag: bulletCount >= 5 && metricDensity < 0.7,
    };
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

function analyzeScannability(text: string, lines: string[]): ScannabilityAnalysis {
  // Find summary block (first ~5 sentences after name)
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

  // Estimate pages
  const estimatedPageCount = Math.max(1, Math.round(text.length / CHARS_PER_PAGE));
  const pageCountOk = estimatedPageCount <= 2;

  // Critical keywords
  const criticalKeywordsFound = CRITICAL_KEYWORDS.filter(kw =>
    new RegExp(kw, 'i').test(text)
  );
  const criticalKeywordsMissing = CRITICAL_KEYWORDS.filter(kw =>
    !new RegExp(kw, 'i').test(text)
  );

  // Scannability score
  let score = 60;
  if (summaryOk) score += 15;
  else if (summaryLength < 3) score -= 10;
  else score -= 5;
  if (pageCountOk) score += 15;
  else score -= 20;
  score += Math.min(10, criticalKeywordsFound.length * 2);

  return {
    summaryLength,
    summaryOk,
    estimatedPageCount,
    pageCountOk,
    criticalKeywordsFound,
    criticalKeywordsMissing,
    score: Math.max(0, Math.min(100, score)),
  };
}

function checkCommonErrors(text: string): SpellingIssue[] {
  const issues: SpellingIssue[] = [];

  const commonErrors: Record<string, string[]> = {
    'recieve': ['receive'],
    'acheive': ['achieve'],
    'managment': ['management'],
    'experiance': ['experience'],
    'leadrship': ['leadership'],
    'develope': ['develop'],
    'developement': ['development'],
    'stratagey': ['strategy'],
    'straegy': ['strategy'],
    'srategy': ['strategy'],
    'negociate': ['negotiate'],
    'negociation': ['negotiation'],
    'buisness': ['business'],
    'departement': ['department'],
    'implmented': ['implemented'],
    'partnered with': [], // check for passive construction
    'responsable': ['responsible'],
    'profesional': ['professional'],
  };

  for (const [typo, suggestions] of Object.entries(commonErrors)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      const contextMatch = text.match(new RegExp(`.{0,30}${typo}.{0,30}`, 'gi'));
      issues.push({
        word: typo,
        context: contextMatch?.[0] ?? typo,
        suggestions,
      });
    }
  }

  return issues;
}

function detectAITropes(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const word of AI_BANNED_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      found.push(word);
    }
  }
  return found;
}

function calcFormattingScore(text: string, lines: string[], scannability: ScannabilityAnalysis): number {
  let score = 70;

  // Check for dates (good formatting)
  if (/\d{4}\s*[–\-]\s*(\d{4}|present)/i.test(text)) score += 10;

  // Check for consistent bullet usage
  const bulletLines = lines.filter(l => /^[•\-\*\u2022]/.test(l));
  if (bulletLines.length > 3) score += 10;

  // Page count penalty
  if (!scannability.pageCountOk) score -= 20;

  // Penalty for very short resume
  if (text.length < 1000) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function buildSummary(
  overall: number,
  xyz: number,
  density: number,
  scannability: ScannabilityAnalysis,
  aiFlags: string[]
): string {
  const parts: string[] = [];

  if (overall >= 80) parts.push('Strong resume with minor improvements needed.');
  else if (overall >= 60) parts.push('Solid foundation — targeted edits will significantly improve results.');
  else parts.push('Resume needs structural work before submitting to Director+ roles.');

  if (xyz < 60) parts.push(`${100 - xyz}% of bullets are missing XYZ structure.`);
  if (density < 70) parts.push('Metric density is below the 7/10 threshold — add numbers.');
  if (!scannability.summaryOk) parts.push(`Summary is ${scannability.summaryLength} sentences — target 3–5.`);
  if (!scannability.pageCountOk) parts.push(`Estimated ${scannability.estimatedPageCount} pages — trim to 2 for Director level.`);
  if (aiFlags.length > 0) parts.push(`AI tropes detected: ${aiFlags.slice(0, 3).join(', ')}.`);

  return parts.join(' ');
}
