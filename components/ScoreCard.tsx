'use client';

import ScoreRing from './ScoreRing';
import type { LocalScoreResult } from '@/lib/scoring';
import type { JDMatchResult } from '@/lib/claude';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Props {
  localScore: LocalScoreResult;
  jdMatch: JDMatchResult | null;
}

export default function ScoreCard({ localScore, jdMatch }: Props) {
  const overallScore = jdMatch
    ? Math.round(localScore.overallScore * 0.6 + jdMatch.overlapScore * 0.4)
    : localScore.overallScore;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overall + sub-scores */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <ScoreRing score={overallScore} label="Overall" size={80} strokeWidth={6} />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <ScoreRing score={localScore.xyzScore} label="XYZ" size={56} />
            <ScoreRing score={localScore.metricDensityScore} label="Metrics" size={56} />
            <ScoreRing score={localScore.scannabilityScore} label="Scan" size={56} />
            <ScoreRing score={localScore.formattingScore} label="Format" size={56} />
            {jdMatch && <ScoreRing score={jdMatch.overlapScore} label="JD Match" size={56} />}
          </div>
        </div>

        {/* Summary */}
        <p style={{
          marginTop: 16,
          fontSize: 12,
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          lineHeight: 1.6,
        }}>
          {localScore.summary}
        </p>
      </div>

      {/* JD Match breakdown */}
      {jdMatch && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 20,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            JD Overlap Analysis
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 16px' }}>{jdMatch.fitSummary}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jdMatch.matchedExperiences.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 10,
                padding: '8px 10px',
                background: 'var(--surface-2)',
                borderRadius: 4,
                borderLeft: `2px solid ${m.strength === 'strong' ? 'var(--green)' : m.strength === 'partial' ? 'var(--amber)' : 'var(--red)'}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 2 }}>{m.requirement}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.evidence}</div>
                </div>
                <span style={{
                  fontSize: 10,
                  color: m.strength === 'strong' ? 'var(--green)' : m.strength === 'partial' ? 'var(--amber)' : 'var(--red)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}>
                  {m.strength}
                </span>
              </div>
            ))}
          </div>

          {jdMatch.gaps.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--red)', margin: '0 0 8px' }}>
                Gaps to address
              </h4>
              {jdMatch.gaps.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                  <AlertTriangle size={11} color="var(--red)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{g}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Local flags */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <h3 style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          Instant Checks
        </h3>

        <Check
          ok={localScore.scannability.summaryOk}
          label={`Summary: ${localScore.scannability.summaryLength} sentences`}
          note={localScore.scannability.summaryOk ? 'Good (3–5)' : 'Target 3–5 sentences'}
        />
        <Check
          ok={localScore.scannability.pageCountOk}
          label={`Page estimate: ~${localScore.scannability.estimatedPageCount}p`}
          note={localScore.scannability.pageCountOk ? 'Within 2-page limit' : 'Trim to 2 pages for Director+'}
        />
        <Check
          ok={localScore.spellingIssues.length === 0}
          label={`Spelling: ${localScore.spellingIssues.length} issue(s) found`}
          note={localScore.spellingIssues.length > 0
            ? localScore.spellingIssues.map(s => s.word).join(', ')
            : 'Clean'}
        />
        <Check
          ok={localScore.aiTropeFlags.length === 0}
          label={`AI tropes: ${localScore.aiTropeFlags.length} detected`}
          note={localScore.aiTropeFlags.length > 0
            ? localScore.aiTropeFlags.slice(0, 5).join(', ')
            : 'None found'}
        />

        {localScore.sections.filter(s => s.densityFlag).map((s, i) => (
          <Check
            key={i}
            ok={false}
            label={`${s.name}: metric density below 70%`}
            note={`${Math.round(s.metricDensity * 100)}% of bullets have numbers — target 7/10`}
          />
        ))}
      </div>
    </div>
  );
}

function Check({ ok, label, note }: { ok: boolean; label: string; note: string }) {
  const Icon = ok ? CheckCircle : AlertTriangle;
  const color = ok ? 'var(--green)' : 'var(--amber)';
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <Icon size={13} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
      <div>
        <span style={{ fontSize: 12, color: 'var(--text)' }}>{label}</span>
        {' — '}
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{note}</span>
      </div>
    </div>
  );
}
