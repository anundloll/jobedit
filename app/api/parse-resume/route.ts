import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer } from '@/lib/parse-resume';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromBuffer(buffer, file.type);

    return NextResponse.json({ text });
  } catch (err) {
    console.error('[parse-resume]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
