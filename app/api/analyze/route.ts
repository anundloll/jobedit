import { NextRequest, NextResponse } from 'next/server';
import { scoreResume } from '@/lib/scoring';
import { analyzeJobDescription, rewriteBullets } from '@/lib/claude';
import { extractTextFromBuffer } from '@/lib/parse-resume';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    const resumeText = formData.get('resumeText') as string | null;
    const jobDescription = formData.get('jobDescription') as string;
    const jobTitle = formData.get('jobTitle') as string;
    const rewrite = formData.get('rewrite') === 'true';

    let text = resumeText ?? '';

    if (file && !text) {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractTextFromBuffer(buffer, file.type);
    }

    if (!text) {
      return NextResponse.json({ error: 'No resume text provided' }, { status: 400 });
    }

    // Always run local scoring (free)
    const localScore = scoreResume(text);

    // JD matching via Claude (only if JD provided)
    let jdMatch = null;
    let bulletSuggestions = null;

    if (jobDescription && jobTitle) {
      jdMatch = await analyzeJobDescription(text, jobDescription, jobTitle);

      // Rewrite weak bullets if requested
      if (rewrite) {
        const weakBullets = localScore.sections
          .flatMap(s => s.bullets)
          .filter(b => b.xyzScore < 2)
          .map(b => b.text)
          .slice(0, 10); // limit to 10 to control tokens

        if (weakBullets.length > 0) {
          bulletSuggestions = await rewriteBullets(
            weakBullets,
            jobTitle,
            jdMatch.topRequirements
          );
        }
      }
    }

    return NextResponse.json({ localScore, jdMatch, bulletSuggestions, resumeText: text });
  } catch (err) {
    console.error('[analyze]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
