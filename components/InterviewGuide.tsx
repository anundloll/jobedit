'use client';

import { useState } from 'react';
import type { InterviewGuide as GuideType } from '@/lib/claude';
import { Copy, ChevronDown, ChevronRight, User, MessageSquare } from 'lucide-react';

interface Props {
  guide: GuideType | null;
  resumeText: string;
  onGenerate: (data: { interviewerLinkedIn: string; targetRole: string; companyName: string }) => void;
  generating: boolean;
}

export default function InterviewGuide({ guide, resumeText, onGenerate, generating }: Props) {
  const [linkedIn, setLinkedIn] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '8px 10px',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Generate form */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          Generate CAR Interview Guide
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Target Role *
            </label>
            <input
              style={inputStyle}
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. VP of Media Sales"
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Company *
            </label>
            <input
              style={inputStyle}
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Netflix"
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Interviewer LinkedIn Profile (paste text or URL)
            </label>
            <textarea
              style={{ ...inputStyle, height: 80, resize: 'vertical' }}
              value={linkedIn}
              onChange={e => setLinkedIn(e.target.value)}
              placeholder="Paste the interviewer's LinkedIn profile text or URL..."
            />
          </div>
          <button
            onClick={() => onGenerate({ interviewerLinkedIn: linkedIn, targetRole, companyName })}
            disabled={generating || !resumeText || !targetRole || !companyName}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: 4,
              padding: '10px 20px',
              cursor: generating || !resumeText || !targetRole || !companyName ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              opacity: generating || !resumeText || !targetRole || !companyName ? 0.5 : 1,
              alignSelf: 'flex-start',
            }}
          >
            {generating ? 'Generating...' : 'Generate CAR Guide →'}
          </button>
        </div>
      </div>

      {/* Guide output */}
      {guide && (
        <>
          {/* Header */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <User size={20} color="var(--text-muted)" style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{guide.interviewerName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{guide.interviewerTitle}</div>
              {guide.openingContext && (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.6 }}>{guide.openingContext}</div>
              )}
            </div>
          </div>

          {/* CAR Stories */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              CAR Stories — {guide.carStories.length}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {guide.carStories.map((story, i) => (
                <div key={i} style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => toggle(i)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '10px 14px',
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
                    {expanded.has(i) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span style={{ flex: 1, fontWeight: 500 }}>{story.achievement}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{story.suggestedQuestion.slice(0, 40)}...</span>
                  </button>
                  {expanded.has(i) && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <CARField label="Challenge" text={story.challenge} />
                      <CARField label="Action" text={story.action} />
                      <CARField label="Result" text={story.result} />
                      <div style={{
                        padding: '8px 10px',
                        background: 'rgba(240, 255, 68, 0.05)',
                        borderRadius: 4,
                        borderLeft: '2px solid var(--accent)',
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Relevant to this interviewer
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{story.relevantTo}</div>
                      </div>
                      <div style={{
                        padding: '8px 10px',
                        background: 'var(--surface)',
                        borderRadius: 4,
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                      }}>
                        <MessageSquare size={11} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', flex: 1 }}>
                          <strong style={{ color: 'var(--text)' }}>Use when asked: </strong>
                          {story.suggestedQuestion}
                        </div>
                        <button
                          onClick={() => copy(`${story.achievement}\n\nChallenge: ${story.challenge}\n\nAction: ${story.action}\n\nResult: ${story.result}`, `story-${i}`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }}
                        >
                          <Copy size={11} color={copiedField === `story-${i}` ? 'var(--green)' : undefined} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Anticipated Questions */}
          {guide.anticipatedQuestions.length > 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Anticipated Questions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {guide.anticipatedQuestions.map((q, i) => (
                  <div key={i} style={{ borderLeft: '2px solid var(--border)', paddingLeft: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4, fontWeight: 500 }}>
                      {q.question}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Use: {q.recommendedStory}
                    </div>
                    {q.keyPoints.map((kp, j) => (
                      <div key={j} style={{ fontSize: 11, color: 'var(--text-dim)', paddingLeft: 8 }}>
                        · {kp}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CARField({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}
