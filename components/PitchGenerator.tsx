'use client';

import { useState } from 'react';
import type { TMayPitch } from '@/lib/claude';
import { Copy, Volume2 } from 'lucide-react';

interface Props {
  pitch: TMayPitch | null;
  resumeText: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  onGenerate: (data: { targetRole: string; companyName: string; jobDescription: string }) => void;
  generating: boolean;
}

export default function PitchGenerator({ pitch, resumeText, jobTitle, companyName, jobDescription, onGenerate, generating }: Props) {
  const [role, setRole] = useState(jobTitle);
  const [company, setCompany] = useState(companyName);
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

  const sectionStyle = {
    padding: '14px 16px',
    background: 'var(--surface-2)',
    borderRadius: 6,
    borderLeft: '2px solid var(--border)',
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
        <h3 style={{ margin: '0 0 6px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          Tell Me About Yourself — 60–90 Second Pitch
        </h3>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 16px' }}>
          Hook → Journey → Why Looking → Why This Company
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Target Role *
            </label>
            <input
              style={inputStyle}
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. VP of Media Sales"
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Company *
            </label>
            <input
              style={inputStyle}
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Netflix"
            />
          </div>
        </div>
        <button
          onClick={() => onGenerate({ targetRole: role, companyName: company, jobDescription })}
          disabled={generating || !resumeText || !role || !company}
          style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: 4,
            padding: '10px 20px',
            cursor: generating || !resumeText || !role || !company ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'inherit',
            opacity: generating || !resumeText || !role || !company ? 0.5 : 1,
          }}
        >
          {generating ? 'Generating...' : 'Generate Pitch →'}
        </button>
      </div>

      {pitch && (
        <>
          {/* Full pitch */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Full Pitch
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pitch.wordCount} words</span>
                <button
                  onClick={() => copy(pitch.fullPitch)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Copy size={12} color={copied ? 'var(--green)' : undefined} />
                  <span style={{ fontSize: 10, fontFamily: 'inherit', color: copied ? 'var(--green)' : 'var(--text-muted)' }}>
                    {copied ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>
            <p style={{
              fontSize: 13,
              color: 'var(--text)',
              lineHeight: 1.8,
              margin: 0,
              padding: '16px',
              background: 'var(--surface-2)',
              borderRadius: 6,
              fontFamily: 'Georgia, serif',
            }}>
              {pitch.fullPitch}
            </p>
          </div>

          {/* Sections breakdown */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              Section Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PitchSection label="Hook" text={pitch.hook} color="var(--accent)" />
              <PitchSection label="Journey" text={pitch.journey} color="var(--blue)" />
              <PitchSection label="Why Looking" text={pitch.whyLooking} color="var(--amber)" />
              <PitchSection label="Why This Company" text={pitch.whyThisCompany} color="var(--green)" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PitchSection({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--surface-2)',
      borderRadius: 6,
      borderLeft: `2px solid ${color}`,
    }}>
      <div style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}
