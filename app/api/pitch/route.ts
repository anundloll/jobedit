import { NextRequest, NextResponse } from 'next/server';
import { generateTMAYPitch } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, targetRole, companyName, jobDescription } = await req.json();

    if (!resumeText || !targetRole || !companyName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pitch = await generateTMAYPitch(
      resumeText,
      targetRole,
      companyName,
      jobDescription ?? ''
    );

    return NextResponse.json({ pitch });
  } catch (err) {
    console.error('[pitch]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Pitch generation failed' },
      { status: 500 }
    );
  }
}
