import { NextRequest, NextResponse } from 'next/server';
import { scoreResume } from '@/lib/scoring';
import { analyzeJobDescription, rewriteBullets } from '@/lib/claude';
import { extractTextFromBuffer } from '@/lib/parse-resume';
import { scoreLocalJD, localToJDMatchResult } from '@/lib/local-jd-scorer';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    const resumeText = formData.get('resumeText') as string | null;
    const jobDescription = formData.get('jobDescription') as string ?? '';
    const jobTitle = formData.get('jobTitle') as string ?? '';
    const rewrite = formData.get('rewrite') === 'true';
    // deepAnalysis=true means call Claude for JD matching; false = local only
    const deepAnalysis = formData.get('deepAnalysis') === 'true';

    let text = resumeText ?? '';

    if (file && !text) {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractTextFromBuffer(buffer, file.type);
    }

    if (!text) {
      return NextResponse.json({ error: 'No resume text provided' }, { status: 400 });
    }

    // Always run local scoring (free, instant)
    const localScore = scoreResume(text);

    // Local JD scoring — free, no API
    let localJDResult = null;
    let jdMatch = null;

    if (jobDescription) {
      localJDResult = scoreLocalJD(text, jobDescription, jobTitle);
      jdMatch = localToJDMatchResult(localJDResult);
    }

    // Deep Claude analysis — only when explicitly requested
    let claudeJDMatch = null;
    let bulletSuggestions = null;

    if (deepAnalysis && jobDescription && jobTitle) {
      claudeJDMatch = await analyzeJobDescription(text, jobDescription, jobTitle);
      // Merge: use Claude's nuanced overlap but supplement with local term data
      jdMatch = claudeJDMatch;
    }

    if (rewrite && jobDescription) {
      const weakBullets = localScore.sections
        .flatMap(s => s.bullets)
        .filter(b => b.xyzScore < 2)
        .map(b => b.text)
        .slice(0, 10);

      if (weakBullets.length > 0) {
        const requirements = claudeJDMatch?.topRequirements
          ?? localJDResult?.topRequirements
          ?? [];
        bulletSuggestions = await rewriteBullets(weakBullets, jobTitle, requirements);
      }
    }

    return NextResponse.json({
      localScore,
      localJDResult,
      jdMatch,
      bulletSuggestions,
      resumeText: text,
      usedLocalJD: !!localJDResult && !deepAnalysis,
    });
  } catch (err) {
    console.error('[analyze]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
