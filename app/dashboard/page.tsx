'use client';

import { useState, useCallback } from 'react';
import ResumeUpload from '@/components/ResumeUpload';
import ScoreCard from '@/components/ScoreCard';
import BulletEditor from '@/components/BulletEditor';
import InterviewGuide from '@/components/InterviewGuide';
import PitchGenerator from '@/components/PitchGenerator';
import type { LocalScoreResult } from '@/lib/scoring';
import type { JDMatchResult, BulletSuggestion, InterviewGuide as GuideType, TMayPitch } from '@/lib/claude';
import { FileText, Target, MessageSquare, Mic, AlertCircle, Zap, CheckCircle2, Circle } from 'lucide-react';

type Tab = 'score' | 'bullets' | 'interview' | 'pitch';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'score', label: 'Score', icon: <Zap size={12} /> },
  { id: 'bullets', label: 'Bullets', icon: <FileText size={12} /> },
  { id: 'interview', label: 'Interview', icon: <MessageSquare size={12} /> },
  { id: 'pitch', label: 'Pitch', icon: <Mic size={12} /> },
];

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginBottom: 10,
  paddingLeft: 8,
  borderLeft: '2px solid var(--border)',
  lineHeight: 1,
};

export default function Dashboard() {
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localScore, setLocalScore] = useState<LocalScoreResult | null>(null);
  const [jdMatch, setJdMatch] = useState<JDMatchResult | null>(null);
  const [bulletSuggestions, setBulletSuggestions] = useState<BulletSuggestion[] | null>(null);
  const [interviewGuide, setInterviewGuide] = useState<GuideType | null>(null);
  const [pitch, setPitch] = useState<TMayPitch | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('score');

  const handleTextExtracted = useCallback((text: string, fileName: string) => {
    setResumeText(text);
    setResumeFileName(fileName);
    setPasteMode(false);
    setLocalScore(null);
    setJdMatch(null);
    setBulletSuggestions(null);
    setError(null);
  }, []);

  const handleAnalyze = async () => {
    if (!resumeText) return;
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('resumeText', resumeText);
      fd.append('jobDescription', jobDescription);
      fd.append('jobTitle', jobTitle);
      fd.append('rewrite', 'false');

      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      setLocalScore(data.localScore);
      setJdMatch(data.jdMatch ?? null);
      setActiveTab('score');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRequestRewrites = async () => {
    if (!resumeText || !localScore) return;
    setRewriteLoading(true);
    try {
      const fd = new FormData();
      fd.append('resumeText', resumeText);
      fd.append('jobDescription', jobDescription);
      fd.append('jobTitle', jobTitle);
      fd.append('rewrite', 'true');

      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Rewrite failed');
      setBulletSuggestions(data.bulletSuggestions ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rewrite failed');
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleGenerateGuide = async ({ interviewerLinkedIn, targetRole, companyName: cn }: { interviewerLinkedIn: string; targetRole: string; companyName: string }) => {
    setGuideLoading(true);
    try {
      const res = await fetch('/api/interview-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, interviewerLinkedIn, targetRole, companyName: cn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Guide generation failed');
      setInterviewGuide(data.guide);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Guide generation failed');
    } finally {
      setGuideLoading(false);
    }
  };

  const handleGeneratePitch = async ({ targetRole, companyName: cn, jobDescription: jd }: { targetRole: string; companyName: string; jobDescription: string }) => {
    setPitchLoading(true);
    try {
      const res = await fetch('/api/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetRole, companyName: cn, jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Pitch generation failed');
      setPitch(data.pitch);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pitch generation failed');
    } finally {
      setPitchLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '8px 10px',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const hasResults = localScore !== null;
  const canAnalyze = !!resumeText && !analyzing;

  const steps = [
    { label: 'Add resume', done: !!resumeText },
    { label: 'Add job title + description', done: !!(jobTitle && jobDescription) },
    { label: 'Run analysis', done: hasResults },
  ];

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top nav */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={14} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.08em' }}>JOBEDIT</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>.DEV</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {s.done
                ? <CheckCircle2 size={11} color="var(--green)" />
                : <Circle size={11} color="var(--border)" />
              }
              <span style={{ fontSize: 10, color: s.done ? 'var(--text-dim)' : 'var(--text-muted)', letterSpacing: '0.04em' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel — inputs */}
        <aside style={{
          width: 248,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {/* Scrollable inputs */}
          <div style={{
            flex: 1,
            padding: '16px 16px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
          }}>
            {/* Resume section */}
            <div>
              <div style={SECTION_LABEL}>Resume</div>

              {!resumeText && !pasteMode && (
                <>
                  <ResumeUpload
                    onTextExtracted={handleTextExtracted}
                    fileName={resumeFileName}
                    hasResume={false}
                    onClear={() => { setResumeText(''); setResumeFileName(''); setLocalScore(null); setJdMatch(null); }}
                  />
                  <button
                    onClick={() => setPasteMode(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, fontFamily: 'inherit', marginTop: 8, padding: 0, letterSpacing: '0.04em' }}
                  >
                    paste text instead →
                  </button>
                </>
              )}

              {!resumeText && pasteMode && (
                <>
                  <textarea
                    style={{ ...inputStyle, height: 140, resize: 'vertical', fontSize: 11, lineHeight: 1.5 }}
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder="Paste resume text here..."
                    autoFocus
                  />
                  <button
                    onClick={() => setPasteMode(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, fontFamily: 'inherit', marginTop: 6, padding: 0, letterSpacing: '0.04em' }}
                  >
                    ← upload file instead
                  </button>
                </>
              )}

              {resumeText && (
                <ResumeUpload
                  onTextExtracted={handleTextExtracted}
                  fileName={resumeFileName || 'Pasted text'}
                  hasResume={true}
                  onClear={() => { setResumeText(''); setResumeFileName(''); setLocalScore(null); setJdMatch(null); setPasteMode(false); }}
                />
              )}
            </div>

            {/* Job Target section */}
            <div>
              <div style={SECTION_LABEL}>Job Target</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  style={inputStyle}
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="Job title"
                />
                <input
                  style={inputStyle}
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Company"
                />
                <textarea
                  style={{ ...inputStyle, height: 100, resize: 'vertical', lineHeight: 1.5 }}
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Job description — optional, enables JD match"
                />
              </div>
            </div>
          </div>

          {/* Pinned bottom — CTA + cost */}
          <div style={{
            padding: 16,
            borderTop: '1px solid var(--border)',
            background: 'var(--bg)',
            flexShrink: 0,
          }}>
            {error && (
              <div style={{
                display: 'flex',
                gap: 6,
                padding: '7px 9px',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: 4,
                border: '1px solid rgba(239, 68, 68, 0.15)',
                marginBottom: 10,
              }}>
                <AlertCircle size={11} color="var(--red)" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--red)', lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              style={{
                width: '100%',
                background: canAnalyze ? 'var(--accent)' : 'var(--surface-2)',
                color: canAnalyze ? '#000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 4,
                padding: '11px 16px',
                cursor: canAnalyze ? 'pointer' : 'not-allowed',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'inherit',
                letterSpacing: '0.06em',
                marginBottom: 12,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {analyzing ? '▸ Analyzing...' : '▸ Run Analysis'}
            </button>

            {/* Compact cost legend */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Score', cost: 'free' },
                { label: 'JD', cost: '$0.01' },
                { label: 'Rewrites', cost: '$0.02' },
                { label: 'Guide', cost: '$0.04' },
                { label: 'Pitch', cost: '$0.01' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 3, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{item.label}</span>
                  <span style={{ fontSize: 9, color: item.cost === 'free' ? 'var(--green)' : 'var(--text-muted)' }}>{item.cost}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right panel — results */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs — always visible */}
          <div style={{
            borderBottom: '1px solid var(--border)',
            padding: '0 16px',
            display: 'flex',
            gap: 0,
            flexShrink: 0,
          }}>
            {TABS.map(tab => {
              const needsResults = tab.id === 'score' || tab.id === 'bullets';
              const isDisabled = needsResults && !hasResults;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    padding: '10px 12px',
                    cursor: isDisabled ? 'default' : 'pointer',
                    color: isActive ? 'var(--accent)' : isDisabled ? 'var(--text-muted)' : 'var(--text-dim)',
                    fontSize: 10,
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: isDisabled ? 0.4 : 1,
                    transition: 'color 0.1s ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {!hasResults && (activeTab === 'score' || activeTab === 'bullets') && (
              <EmptyState hasResume={!!resumeText} hasJD={!!jobDescription} />
            )}

            {hasResults && activeTab === 'score' && (
              <ScoreCard localScore={localScore!} jdMatch={jdMatch} />
            )}

            {hasResults && activeTab === 'bullets' && (
              <BulletEditor
                localScore={localScore!}
                bulletSuggestions={bulletSuggestions}
                onRequestRewrites={handleRequestRewrites}
                rewriteLoading={rewriteLoading}
              />
            )}

            {activeTab === 'interview' && (
              <InterviewGuide
                guide={interviewGuide}
                resumeText={resumeText}
                onGenerate={handleGenerateGuide}
                generating={guideLoading}
              />
            )}

            {activeTab === 'pitch' && (
              <PitchGenerator
                pitch={pitch}
                resumeText={resumeText}
                jobTitle={jobTitle}
                companyName={companyName}
                jobDescription={jobDescription}
                onGenerate={handleGeneratePitch}
                generating={pitchLoading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ hasResume, hasJD }: { hasResume: boolean; hasJD: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 32,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Target size={20} color="var(--text-muted)" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>
          {!hasResume ? 'Add your resume to begin' : !hasJD ? 'Add a job description for full scoring' : 'Run analysis when ready'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Local scoring is instant. JD matching uses one Claude call.
        </div>
      </div>

      {/* What you'll get */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
        maxWidth: 440,
        width: '100%',
      }}>
        {[
          { label: 'XYZ Score', desc: 'Every bullet checked for result + metric + action', free: true },
          { label: 'JD Overlap', desc: '5–7 direct requirements matched to your experience', free: false },
          { label: 'Metric Density', desc: 'Flags sections below the 7/10 threshold', free: true },
          { label: 'Anti-AI Check', desc: '25+ banned tropes detected and flagged', free: true },
          { label: 'Scannability', desc: 'Summary length, page count, critical keywords', free: true },
          { label: 'Bullet Rewrites', desc: 'Weak bullets rewritten with active verbs + numbers', free: false },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '12px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
              <span style={{
                fontSize: 9,
                color: item.free ? 'var(--green)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {item.free ? 'free' : 'api'}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
