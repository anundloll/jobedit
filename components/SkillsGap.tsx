'use client';

import { useState } from 'react';
import type { LocalJDResult } from '@/lib/local-jd-scorer';
import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  result: LocalJDResult;
  onDeepAnalysis: () => void;
  deepLoading: boolean;
  hasDeepResult: boolean;
}

export default function SkillsGap({ result, onDeepAnalysis, deepLoading, hasDeepResult }: Props) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scoreColor = result.overlapScore >= 70 ? 'var(--green)' : result.overlapScore >= 45 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary bar */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Local JD Match — free
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {result.overlapScore}
              <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>
              {result.termCount.overlap} / {result.termCount.jd} JD terms matched
            </div>
            {result.roleLevelLabel && (
              <div style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                background: 'var(--surface-2)',
                padding: '2px 8px',
                borderRadius: 3,
                display: 'inline-block',
              }}>
                {result.roleLevelLabel} guardrails active
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{
            height: '100%',
            width: `${result.overlapScore}%`,
            background: scoreColor,
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }} />
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '0 0 16px', lineHeight: 1.6 }}>
          {buildSummaryText(result)}
        </p>

        {/* Deep analysis CTA */}
        {!hasDeepResult && (
          <button
            onClick={onDeepAnalysis}
            disabled={deepLoading}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '8px 14px',
              cursor: deepLoading ? 'wait' : 'pointer',
              color: 'var(--text-dim)',
              fontSize: 11,
              fontFamily: 'inherit',
              opacity: deepLoading ? 0.6 : 1,
            }}
          >
            {deepLoading ? '▸ Running deep analysis...' : '▸ Run deep analysis with Claude (~$0.01)'}
          </button>
        )}
        {hasDeepResult && (
          <div style={{ fontSize: 10, color: 'var(--green)', letterSpacing: '0.06em' }}>
            ✓ Deep analysis complete — see Score tab for full breakdown
          </div>
        )}
      </div>

      {/* Role-level guardrails */}
      {result.guardrailChecks.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 20,
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 12 }}>
            {result.roleLevelLabel} Level Requirements
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.guardrailChecks.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {g.presentInResume
                  ? <CheckCircle2 size={12} color="var(--green)" />
                  : <XCircle size={12} color={g.presentInJD ? 'var(--red)' : 'var(--text-muted)'} />
                }
                <span style={{ fontSize: 11, color: g.presentInResume ? 'var(--text)' : 'var(--text-muted)' }}>
                  {g.term}
                </span>
                {g.presentInJD && !g.presentInResume && (
                  <span style={{
                    fontSize: 9,
                    color: 'var(--red)',
                    background: 'rgba(239,68,68,0.08)',
                    padding: '1px 6px',
                    borderRadius: 3,
                    letterSpacing: '0.06em',
                  }}>
                    IN JD — ADD TO RESUME
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            Skills by Category
          </span>
        </div>
        {result.categoryBreakdown.map(cat => (
          <div key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => toggle(cat.id)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                color: 'var(--text)',
                fontFamily: 'inherit',
              }}
            >
              {expandedCats.has(cat.id)
                ? <ChevronDown size={12} color="var(--text-muted)" />
                : <ChevronRight size={12} color="var(--text-muted)" />
              }
              <span style={{ fontSize: 11, flex: 1, textAlign: 'left' }}>{cat.label}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {cat.matched.length}/{cat.jdTerms.length}
              </span>
              {/* Mini bar */}
              <div style={{ width: 60, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${cat.score}%`,
                  background: cat.score >= 70 ? 'var(--green)' : cat.score >= 40 ? 'var(--amber)' : 'var(--red)',
                  borderRadius: 2,
                }} />
              </div>
              <span style={{
                fontSize: 10,
                color: cat.score >= 70 ? 'var(--green)' : cat.score >= 40 ? 'var(--amber)' : 'var(--red)',
                width: 32,
                textAlign: 'right',
              }}>
                {cat.score}%
              </span>
            </button>

            {expandedCats.has(cat.id) && (
              <div style={{ padding: '4px 20px 12px 40px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cat.matched.map(t => (
                  <div key={t} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <CheckCircle2 size={10} color="var(--green)" />
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{t}</span>
                  </div>
                ))}
                {cat.missing.map(t => (
                  <div key={t} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <XCircle size={10} color="var(--red)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>missing</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top missing terms */}
      {result.missingTerms.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
            Top gaps — add these to your resume
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.missingTerms.slice(0, 15).map(t => (
              <span key={t} style={{
                fontSize: 10,
                color: 'var(--red)',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                padding: '3px 8px',
                borderRadius: 3,
                letterSpacing: '0.04em',
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildSummaryText(r: LocalJDResult): string {
  const pct = r.overlapScore;
  const topGaps = r.missingTerms.slice(0, 3).join(', ');
  if (pct >= 75) return `Strong match. ${r.termCount.overlap} JD terms found in your resume. ${topGaps ? `Key gaps: ${topGaps}.` : 'No major gaps.'}`;
  if (pct >= 50) return `Moderate match. ${r.termCount.jd - r.termCount.overlap} JD terms are missing. Priority gaps: ${topGaps}.`;
  return `Low match. Only ${r.termCount.overlap} of ${r.termCount.jd} JD taxonomy terms appear in your resume. Add: ${topGaps}.`;
}
