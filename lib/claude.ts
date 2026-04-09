import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

// Anti-AI writing system instruction — based on Wikipedia:Signs_of_AI_Writing
const WRITING_STANDARDS = `
You are a career writing specialist for Director-level executives in media and ad tech.
Your output must be indistinguishable from a sharp human editor's work. This means following every rule below without exception.

━━━ BANNED VOCABULARY ━━━
Never use these words or phrases — they immediately signal AI authorship:

Tier 1 (hard ban): delve, tapestry, multifaceted, pioneering, bespoke, synergy, ideate, ideation, paradigm shift, thought leader, boil the ocean, move the needle, circle back, actionable insights, low-hanging fruit, bleeding edge, game-changing, deep dive, learnings, ecosystem, unlock, bandwidth

Tier 2 (AI signals): crucial, pivotal, vital, transformative, groundbreaking, renowned, meticulous, meticulously, intricate, intricacies, interplay, testament, indelible, enduring, vibrant, profound, noteworthy, boasts, showcasing, leveraging, robust, holistic, seamless, cutting-edge, impactful, value-add, best-in-class, world-class, garner, garnered, fostering, cultivating, championing, evolving landscape, dynamic landscape, rapidly evolving, align with, resonates with, passion for, passionate about, scalable solutions, thought leadership, spearheading initiatives

Copula avoidance (AI avoids "is/was" by using these — ban them): serves as, stands as, acts as, functions as

Elegant variation (AI synonyms for "I" — ban these): seasoned professional, accomplished executive, dynamic leader, results-driven, results-oriented, proven track record, dedicated professional, innovative thinker, strategic visionary, consummate professional, forward-thinking, detail-oriented

━━━ BANNED STRUCTURES ━━━
Never use these sentence patterns — they are structural AI tells:

1. "Not just X, but also Y" — false dichotomy construction. Make a direct claim instead.
2. Adjective triplets: "innovative, dynamic, and results-driven leader" — pick one specific fact or use none.
3. Hanging -ing clauses: "...ensuring success," "...highlighting impact," "...demonstrating value" — cut or restate as a direct result.
4. "Committed to..." or "Passionate about..." openers — replace with what you actually did.
5. "In order to" — replace with "to".
6. "A wide range of" / "a variety of" / "numerous" — replace with a specific number.
7. "Successfully [verb]ed" — "successfully" is redundant if you did it. Remove.
8. "Responsible for [noun]" openers — start with the verb instead.
9. "Helped to [verb]" — obscures direct contribution. Own the action.
10. "Worked with [person/team]" openers — say what you directed, built, or delivered.
11. "Utilized" — use "used". "Utilized" is corporate padding.
12. "Instrumental in" — indirect. Say what you did.
13. Em-dashes used decoratively (more than 2 per section).
14. Passive voice: "was managed," "were delivered," "has been recognized" — rewrite with active verbs.
15. Rule-of-three sentence endings: "...for efficiency, effectiveness, and impact."

━━━ REQUIRED STANDARDS ━━━
- Every bullet starts with a past-tense active verb (Directed, Built, Closed, Reduced, Generated, etc.)
- Every bullet contains a quantifiable metric ($, %, headcount, or deal count)
- Every bullet shows a business result — not just a task
- Tone: clinical, data-driven, specific. No motivational language. No adjectives that cannot be measured.
- If a claim cannot be verified with a number or a named company, cut or rewrite it.
- Write the way a sharp human hiring director writes: direct, specific, zero fat.
`;

export interface JDMatchResult {
  overlapScore: number;          // 0–100
  topRequirements: string[];     // 5–7 items
  matchedExperiences: MatchedExperience[];
  gaps: string[];
  fitSummary: string;
}

export interface MatchedExperience {
  requirement: string;
  evidence: string;
  strength: 'strong' | 'partial' | 'weak';
}

export interface BulletSuggestion {
  original: string;
  rewrite: string;
  rationale: string;
}

export interface InterviewGuide {
  interviewerName: string;
  interviewerTitle: string;
  carStories: CARStory[];
  anticipatedQuestions: AnticipatedQuestion[];
  openingContext: string;
}

export interface CARStory {
  achievement: string;
  challenge: string;
  action: string;
  result: string;
  relevantTo: string;
  suggestedQuestion: string;
}

export interface AnticipatedQuestion {
  question: string;
  recommendedStory: string;
  keyPoints: string[];
}

export interface TMayPitch {
  hook: string;
  journey: string;
  whyLooking: string;
  whyThisCompany: string;
  fullPitch: string;
  wordCount: number;
}

// --- JD Analysis ---
export async function analyzeJobDescription(
  resumeText: string,
  jobDescription: string,
  jobTitle: string
): Promise<JDMatchResult> {
  const prompt = `
You are evaluating a Director-level candidate's resume against a specific job description.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeText}

Analyze the direct experience overlap (NOT transferable skills — actual overlap only).

Return a JSON object with this exact structure:
{
  "overlapScore": <number 0-100, based on direct experience match>,
  "topRequirements": [<5-7 specific requirements extracted from the JD>],
  "matchedExperiences": [
    {
      "requirement": "<requirement from JD>",
      "evidence": "<specific evidence from resume, use exact numbers/companies when available>",
      "strength": "<strong|partial|weak>"
    }
  ],
  "gaps": [<requirements in JD with no direct evidence in resume>],
  "fitSummary": "<2-3 sentences, clinical and direct, no AI tropes>"
}

Only return valid JSON, no markdown fencing.
`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: WRITING_STANDARDS,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text) as JDMatchResult;
}

// --- Bullet rewrites ---
export async function rewriteBullets(
  bullets: string[],
  jobTitle: string,
  topRequirements: string[]
): Promise<BulletSuggestion[]> {
  const prompt = `
Rewrite each resume bullet to pass the XYZ test:
- X = quantifiable result
- Y = metric (%, $, or count)
- Z = strong active verb

Target role: ${jobTitle}
Key requirements to address: ${topRequirements.slice(0, 5).join('; ')}

Bullets to rewrite:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Return JSON array with this structure:
[
  {
    "original": "<original bullet>",
    "rewrite": "<rewritten bullet — must start with active verb, include metric, show result>",
    "rationale": "<one sentence explaining what was changed and why>"
  }
]

Only return valid JSON, no markdown fencing.
`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: WRITING_STANDARDS,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  return JSON.parse(text) as BulletSuggestion[];
}

// --- CAR Interview Guide ---
export async function generateInterviewGuide(
  resumeText: string,
  interviewerLinkedIn: string,
  targetRole: string,
  companyName: string
): Promise<InterviewGuide> {
  const prompt = `
Generate a CAR (Challenge, Action, Result) interview guide.

CANDIDATE RESUME:
${resumeText}

INTERVIEWER LINKEDIN PROFILE:
${interviewerLinkedIn}

TARGET ROLE: ${targetRole} at ${companyName}

Map the candidate's biggest career achievements to what would matter most to THIS interviewer based on their background, seniority, and likely priorities.

Return JSON with this structure:
{
  "interviewerName": "<name from LinkedIn or 'Interviewer'>",
  "interviewerTitle": "<title from LinkedIn>",
  "openingContext": "<2 sentences on how to open the conversation with this person based on their background>",
  "carStories": [
    {
      "achievement": "<achievement title, e.g. '$9M HBO cost savings'>",
      "challenge": "<the business problem or challenge>",
      "action": "<specific actions the candidate took — active verbs, no fluff>",
      "result": "<quantified outcome>",
      "relevantTo": "<why this story resonates with THIS interviewer specifically>",
      "suggestedQuestion": "<interview question this story answers best>"
    }
  ],
  "anticipatedQuestions": [
    {
      "question": "<likely question from this interviewer based on their background>",
      "recommendedStory": "<which CAR story to use>",
      "keyPoints": ["<point 1>", "<point 2>", "<point 3>"]
    }
  ]
}

Include 4-6 CAR stories and 5-8 anticipated questions. Only return valid JSON.
`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: WRITING_STANDARDS,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return JSON.parse(text) as InterviewGuide;
}

// --- Tell Me About Yourself pitch ---
export async function generateTMAYPitch(
  resumeText: string,
  targetRole: string,
  companyName: string,
  jobDescription: string
): Promise<TMayPitch> {
  const prompt = `
Write a "Tell Me About Yourself" pitch for a Director-level candidate.

STRUCTURE (follow exactly):
1. Hook: One compelling sentence — most impressive recent result
2. Journey: 2-3 sentences tracing career arc with quantified milestones
3. Why Looking: 1-2 sentences on motivation (authentic, not generic)
4. Why This Company: 1-2 sentences tied to specific company/role details

CONSTRAINTS:
- 60–90 seconds when read aloud (120–160 words)
- No passive voice
- Every claim must be grounded in the resume
- Must feel human, not like a cover letter

CANDIDATE RESUME:
${resumeText}

TARGET ROLE: ${targetRole} at ${companyName}
JOB DESCRIPTION EXCERPT: ${jobDescription.slice(0, 500)}

Return JSON:
{
  "hook": "<hook sentence>",
  "journey": "<journey paragraph>",
  "whyLooking": "<why looking sentences>",
  "whyThisCompany": "<why this company sentences>",
  "fullPitch": "<complete pitch, all sections joined naturally>",
  "wordCount": <number>
}

Only return valid JSON.
`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: WRITING_STANDARDS,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return JSON.parse(text) as TMayPitch;
}
