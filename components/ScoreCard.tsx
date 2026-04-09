'use client';

import { useState } from 'react';
import ScoreRing from './ScoreRing';
import type { LocalScoreResult, AIWritingFlag } from '@/lib/scoring';
import type { JDMatchResult } from '@/lib/claude';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  localScore: LocalScoreResult;
  jdMatch: JDMatchResult | null;
}

const TYPE_LABEL: Record<AIWritingFlag['type'], string> = {
  word: 'WORD',
  phrase: 'PHRASE',
  structure: 'STRUCTURE',
};

const TYPE_COLOR: Record<AIWritingFlag['type'], string> = {
  word: 'var(--red)',
  phrase: 'var(--amber)',
  structure: 'var(--blue)',
};

export default function ScoreCard({ localScore, jdMatch }: Props) {
  const [aiExpanded, setAiExpanded] = useState(false);

  const overallScore = jdMatch
    ? Math.round(localScore.overallScore * 0.6 + jdMatch.overlapScore * 0.4)
    : localScore.overallScore;

  const wordFlags = localScore.aiWritingFlags?.filter(f => f.type === 'word') ?? [];
  const phraseFlags = localScore.aiWritingFlags?.filter(f => f.type === 'phrase') ?? [];
  const structFlags = localScore.aiWritingFlags?.filter(f => f.type === 'structure') ?? [];
  const totalAiFlags = localScore.aiWritingFlags?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Score rings */}
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
            <ScoreRing score={localScore.aiWritingScore ?? 100} label="Voice" size={56} />
            {jdMatch && <ScoreRing score={jdMatch.overlapScore} label="JD Match" size={56} />}
          </div>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-dim)', borderTop: '1px solid var(--border)', paddingTop: 12, lineHeight: 1.6 }}>
          {localScore.summary}
        </p>
      </div>

      {/* AI Writing Analysis — expanded */}
      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${totalAiFlags === 0 ? 'var(--border)' : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setAiExpanded(v => !v)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            color: 'var(--text)',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          {aiExpanded ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', flex: 1 }}>
            AI Writing Analysis
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {wordFlags.length > 0 && <Badge label={`${wordFlags.length} words`} color="var(--red)" />}
            {phraseFlags.length > 0 && <Badge label={`${phraseFlags.length} phrases`} color="var(--amber)" />}
            {structFlags.length > 0 && <Badge label={`${structFlags.length} structures`} color="var(--blue)" />}
            {totalAiFlags === 0 && <Badge label="Clean" color="var(--green)" />}
          </div>
        </button>

        {aiExpanded && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Score bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Voice score</span>
                <span style={{ fontSize: 10, color: localScore.aiWritingScore >= 80 ? 'var(--green)' : localScore.aiWritingScore >= 60 ? 'var(--amber)' : 'var(--red)' }}>
                  {localScore.aiWritingScore ?? 100}/100
                </span>
              </div>
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${localScore.aiWritingScore ?? 100}%`,
                  background: localScore.aiWritingScore >= 80 ? 'var(--green)' : localScore.aiWritingScore >= 60 ? 'var(--amber)' : 'var(--red)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>

            {totalAiFlags === 0 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <CheckCircle size={13} color="var(--green)" />
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>No AI writing signals detected. Voice reads as human.</span>
              </div>
            )}

            {/* Flags by type */}
            {[
              { label: 'Banned Words', flags: wordFlags, desc: 'These words immediately flag AI authorship — remove every instance.' },
              { label: 'AI Phrases', flags: phraseFlags, desc: 'Common AI vocabulary that weakens Director-level credibility.' },
              { label: 'Structural Tells', flags: structFlags, desc: 'Sentence patterns that signal automated writing.' },
            ].map(group => group.flags.length > 0 && (
              <div key={group.label}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  {group.label}
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 8px' }}>{group.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.flags.map((f, i) => (
                    <div key={i} style={{
                      padding: '8px 10px',
                      background: 'var(--surface-2)',
                      borderRadius: 4,
                      borderLeft: `2px solid ${TYPE_COLOR[f.type]}`,
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: f.context ? 4 : 0 }}>
                        <span style={{
                          fontSize: 9,
                          color: TYPE_COLOR[f.type],
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          flexShrink: 0,
                          marginTop: 1,
                        }}>
                          {TYPE_LABEL[f.type]}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{f.match}</span>
                      </div>
                      {f.context && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 3, paddingLeft: 32 }}>
                          {f.context}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', paddingLeft: 32 }}>{f.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JD Match breakdown */}
      {jdMatch && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            JD Overlap Analysis
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 16px' }}>{jdMatch.fitSummary}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jdMatch.matchedExperiences.map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 4,
                borderLeft: `2px solid ${m.strength === 'strong' ? 'var(--green)' : m.strength === 'partial' ? 'var(--amber)' : 'var(--red)'}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 2 }}>{m.requirement}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.evidence}</div>
                </div>
                <span style={{ fontSize: 10, color: m.strength === 'strong' ? 'var(--green)' : m.strength === 'partial' ? 'var(--amber)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {m.strength}
                </span>
              </div>
            ))}
          </div>
          {jdMatch.gaps.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--red)', margin: '0 0 8px' }}>Gaps to address</h4>
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

      {/* Instant checks */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          Instant Checks
        </h3>
        <Check ok={localScore.scannability.summaryOk} label={`Summary: ${localScore.scannability.summaryLength} sentences`} note={localScore.scannability.summaryOk ? 'Good (3–5)' : 'Target 3–5 sentences'} />
        <Check ok={localScore.scannability.pageCountOk} label={`Page estimate: ~${localScore.scannability.estimatedPageCount}p`} note={localScore.scannability.pageCountOk ? 'Within 2-page limit' : 'Trim to 2 pages for Director+'} />
        <Check ok={localScore.spellingIssues.length === 0} label={`Spelling: ${localScore.spellingIssues.length} issue(s)`} note={localScore.spellingIssues.length > 0 ? localScore.spellingIssues.map(s => s.word).join(', ') : 'Clean'} />
        {localScore.sections.filter(s => s.densityFlag).map((s, i) => (
          <Check key={i} ok={false} label={`${s.name}: metric density below 70%`} note={`${Math.round(s.metricDensity * 100)}% of bullets have numbers — target 7/10`} />
        ))}
      </div>
    </div>
  );
}

function Check({ ok, label, note }: { ok: boolean; label: string; note: string }) {
  const Icon = ok ? CheckCircle : AlertTriangle;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <Icon size={13} color={ok ? 'var(--green)' : 'var(--amber)'} style={{ marginTop: 1, flexShrink: 0 }} />
      <div>
        <span style={{ fontSize: 12, color: 'var(--text)' }}>{label}</span>
        {' — '}
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{note}</span>
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 9,
      color,
      background: `${color}18`,
      border: `1px solid ${color}30`,
      padding: '2px 7px',
      borderRadius: 3,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
}
