import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

// Anti-AI writing system instruction
const WRITING_STANDARDS = `
You are a career writing specialist for Director-level executives in media and ad tech.

STRICT WRITING RULES — enforce on every output:
- Active voice only. Every bullet and sentence leads with a past-tense active verb.
- BANNED WORDS (never use): delve, tapestry, multifaceted, pioneering, unlock, leverage, synergy, bespoke, transformative, robust, holistic, seamless, cutting-edge, game-changing, thought leader, ecosystem, paradigm, ideate, ideation, impactful, actionable insights, bandwidth, low-hanging fruit, value-add, boil the ocean, move the needle, bleeding edge.
- Clinical, data-driven tone. No motivational fluff or corporate platitudes.
- Every suggested bullet must contain: a strong active verb + a quantifiable metric + a clear business result.
- Format: clear, plain prose. No em-dashes used decoratively. No AI filler.
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
