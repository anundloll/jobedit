import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewGuide } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, interviewerLinkedIn, targetRole, companyName } = await req.json();

    if (!resumeText || !targetRole || !companyName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const guide = await generateInterviewGuide(
      resumeText,
      interviewerLinkedIn ?? '',
      targetRole,
      companyName
    );

    return NextResponse.json({ guide });
  } catch (err) {
    console.error('[interview-guide]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Guide generation failed' },
      { status: 500 }
    );
  }
}
