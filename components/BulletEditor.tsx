'use client';

import { useState } from 'react';
import type { LocalScoreResult } from '@/lib/scoring';
import type { BulletSuggestion } from '@/lib/claude';
import { Copy, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  localScore: LocalScoreResult;
  bulletSuggestions: BulletSuggestion[] | null;
  onRequestRewrites: () => void;
  rewriteLoading: boolean;
}

export default function BulletEditor({ localScore, bulletSuggestions, onRequestRewrites, rewriteLoading }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const toggle = (name: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const weakBullets = localScore.sections.flatMap(s => s.bullets).filter(b => b.xyzScore < 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Rewrite CTA */}
      {weakBullets.length > 0 && !bulletSuggestions && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>
              {weakBullets.length} bullets need XYZ edits
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Uses 1 Claude API call to rewrite weak bullets
            </div>
          </div>
          <button
            onClick={onRequestRewrites}
            disabled={rewriteLoading}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: 4,
              padding: '8px 16px',
              cursor: rewriteLoading ? 'wait' : 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              opacity: rewriteLoading ? 0.6 : 1,
            }}
          >
            {rewriteLoading ? 'Rewriting...' : 'Rewrite with Claude →'}
          </button>
        </div>
      )}

      {/* Claude Suggestions */}
      {bulletSuggestions && bulletSuggestions.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 20,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            Rewrites — {bulletSuggestions.length} bullets
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bulletSuggestions.map((s, i) => (
              <div key={i} style={{
                borderLeft: '2px solid var(--border)',
                paddingLeft: 12,
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textDecoration: 'line-through' }}>
                  {s.original}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', flex: 1, lineHeight: 1.5 }}>
                    {s.rewrite}
                  </div>
                  <button
                    onClick={() => copy(s.rewrite, i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', flexShrink: 0 }}
                    title="Copy"
                  >
                    <Copy size={12} color={copiedIdx === i ? 'var(--green)' : undefined} />
                  </button>
                </div>
                {s.rationale && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                    {s.rationale}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section-by-section breakdown */}
      {localScore.sections.map((section, si) => {
        const isOpen = expandedSections.has(section.name);
        const weakCount = section.bullets.filter(b => b.xyzScore < 2).length;

        return (
          <div key={si} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => toggle(section.name)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                color: 'var(--text)',
                fontFamily: 'inherit',
                fontSize: 12,
                textAlign: 'left',
              }}
            >
              {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <span style={{ flex: 1 }}>{section.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {section.bullets.length} bullets
              </span>
              {weakCount > 0 && (
                <span style={{
                  fontSize: 10,
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: 'var(--amber)',
                  padding: '2px 6px',
                  borderRadius: 3,
                }}>
                  {weakCount} weak
                </span>
              )}
              {section.densityFlag && (
                <span style={{
                  fontSize: 10,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--red)',
                  padding: '2px 6px',
                  borderRadius: 3,
                }}>
                  low metrics
                </span>
              )}
            </button>

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.bullets.map((bullet, bi) => (
                  <div key={bi} style={{
                    padding: '8px 10px',
                    background: 'var(--surface-2)',
                    borderRadius: 4,
                    borderLeft: `2px solid ${bullet.xyzScore === 3 ? 'var(--green)' : bullet.xyzScore === 2 ? 'var(--accent)' : bullet.xyzScore === 1 ? 'var(--amber)' : 'var(--red)'}`,
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: bullet.issues.length ? 6 : 0 }}>
                      {bullet.text}
                    </div>
                    {bullet.issues.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {bullet.issues.map((issue, ii) => (
                          <div key={ii} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <AlertTriangle size={10} color="var(--amber)" />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {bullet.issues.length === 0 && (
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <CheckCircle size={10} color="var(--green)" />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>XYZ complete</span>
                      </div>
                    )}
                  </div>
                ))}
                {section.bullets.length === 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>No bullets detected in this section.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
