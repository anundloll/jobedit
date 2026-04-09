'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ResumeUpload from '@/components/ResumeUpload';
import ScoreCard from '@/components/ScoreCard';
import BulletEditor from '@/components/BulletEditor';
import InterviewGuide from '@/components/InterviewGuide';
import PitchGenerator from '@/components/PitchGenerator';
import SkillsGap from '@/components/SkillsGap';
import { scoreResume } from '@/lib/scoring';
import { scoreLocalJD } from '@/lib/local-jd-scorer';
import type { LocalScoreResult } from '@/lib/scoring';
import type { LocalJDResult } from '@/lib/local-jd-scorer';
import type { JDMatchResult, BulletSuggestion, InterviewGuide as GuideType, TMayPitch } from '@/lib/claude';
import { FileText, Target, MessageSquare, Mic, AlertCircle, Zap, CheckCircle2, Circle, BarChart2 } from 'lucide-react';

type Tab = 'score' | 'skills' | 'bullets' | 'interview' | 'pitch';

const TABS: { id: Tab; label: string; icon: React.ReactNode; requiresAnalysis: boolean }[] = [
  { id: 'score',     label: 'Score',     icon: <Zap size={12} />,        requiresAnalysis: true },
  { id: 'skills',    label: 'Skills',    icon: <BarChart2 size={12} />,   requiresAnalysis: false },
  { id: 'bullets',   label: 'Bullets',   icon: <FileText size={12} />,    requiresAnalysis: true },
  { id: 'interview', label: 'Interview', icon: <MessageSquare size={12} />, requiresAnalysis: false },
  { id: 'pitch',     label: 'Pitch',     icon: <Mic size={12} />,         requiresAnalysis: false },
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
  const [deepLoading, setDeepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Full analysis results (after Run Analysis)
  const [localScore, setLocalScore] = useState<LocalScoreResult | null>(null);
  const [jdMatch, setJdMatch] = useState<JDMatchResult | null>(null);
  const [hasDeepResult, setHasDeepResult] = useState(false);
  const [bulletSuggestions, setBulletSuggestions] = useState<BulletSuggestion[] | null>(null);
  const [interviewGuide, setInterviewGuide] = useState<GuideType | null>(null);
  const [pitch, setPitch] = useState<TMayPitch | null>(null);

  // Live local score (debounced, updates as user types)
  const [liveScore, setLiveScore] = useState<LocalScoreResult | null>(null);
  const [liveJD, setLiveJD] = useState<LocalJDResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('score');

  // Debounced live scoring — runs entirely in-browser, zero API cost
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (resumeText.length > 200) {
        const scored = scoreResume(resumeText);
        setLiveScore(scored);
        if (jobDescription) {
          const jd = scoreLocalJD(resumeText, jobDescription, jobTitle);
          setLiveJD(jd);
        } else {
          setLiveJD(null);
        }
      } else {
        setLiveScore(null);
        setLiveJD(null);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [resumeText, jobDescription, jobTitle]);

  const handleTextExtracted = useCallback((text: string, fileName: string) => {
    setResumeText(text);
    setResumeFileName(fileName);
    setPasteMode(false);
    setLocalScore(null);
    setJdMatch(null);
    setBulletSuggestions(null);
    setHasDeepResult(false);
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
      fd.append('deepAnalysis', 'false'); // local scoring only

      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      setLocalScore(data.localScore);
      setJdMatch(data.jdMatch ?? null);
      if (data.localJDResult) setLiveJD(data.localJDResult);
      setActiveTab('score');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeepAnalysis = async () => {
    if (!resumeText || !jobDescription || !jobTitle) return;
    setDeepLoading(true);
    try {
      const fd = new FormData();
      fd.append('resumeText', resumeText);
      fd.append('jobDescription', jobDescription);
      fd.append('jobTitle', jobTitle);
      fd.append('rewrite', 'false');
      fd.append('deepAnalysis', 'true');

      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Deep analysis failed');

      if (data.jdMatch) setJdMatch(data.jdMatch);
      setHasDeepResult(true);
      setActiveTab('score');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deep analysis failed');
    } finally {
      setDeepLoading(false);
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
      fd.append('deepAnalysis', 'false');

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
  const displayScore = localScore ?? liveScore;
  const displayJD = liveJD;

  // Live mini-score for sidebar
  const liveOverall = liveScore?.overallScore ?? null;
  const liveAI = liveScore?.aiWritingScore ?? null;

  const steps = [
    { label: 'Resume', done: !!resumeText },
    { label: 'Job target', done: !!(jobTitle && jobDescription) },
    { label: 'Analyzed', done: hasResults },
  ];

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Nav */}
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
              {s.done ? <CheckCircle2 size={11} color="var(--green)" /> : <Circle size={11} color="var(--border)" />}
              <span style={{ fontSize: 10, color: s.done ? 'var(--text-dim)' : 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: 248,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

            {/* Resume input */}
            <div>
              <div style={SECTION_LABEL}>Resume</div>
              {!resumeText && !pasteMode && (
                <>
                  <ResumeUpload onTextExtracted={handleTextExtracted} fileName={resumeFileName} hasResume={false} onClear={() => { setResumeText(''); setResumeFileName(''); setLocalScore(null); setJdMatch(null); }} />
                  <button onClick={() => setPasteMode(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, fontFamily: 'inherit', marginTop: 8, padding: 0, letterSpacing: '0.04em' }}>
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
                  <button onClick={() => setPasteMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, fontFamily: 'inherit', marginTop: 6, padding: 0, letterSpacing: '0.04em' }}>
                    ← upload file instead
                  </button>
                </>
              )}
              {resumeText && (
                <ResumeUpload onTextExtracted={handleTextExtracted} fileName={resumeFileName || 'Pasted text'} hasResume={true} onClear={() => { setResumeText(''); setResumeFileName(''); setLocalScore(null); setJdMatch(null); setPasteMode(false); setLiveScore(null); setLiveJD(null); }} />
              )}
            </div>

            {/* Job target */}
            <div>
              <div style={SECTION_LABEL}>Job Target</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input style={inputStyle} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Job title" />
                <input style={inputStyle} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company" />
                <textarea
                  style={{ ...inputStyle, height: 100, resize: 'vertical', lineHeight: 1.5 }}
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Job description — optional, enables JD match"
                />
              </div>
            </div>

            {/* Live score preview */}
            {liveOverall !== null && (
              <div style={{
                padding: '10px 12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Live Score
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <MiniScore label="Overall" value={liveOverall} />
                  {liveAI !== null && <MiniScore label="Voice" value={liveAI} />}
                  {liveJD && <MiniScore label="JD Match" value={liveJD.overlapScore} />}
                </div>
              </div>
            )}
          </div>

          {/* Pinned bottom */}
          <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
            {error && (
              <div style={{ display: 'flex', gap: 6, padding: '7px 9px', background: 'rgba(239,68,68,0.08)', borderRadius: 4, border: '1px solid rgba(239,68,68,0.15)', marginBottom: 10 }}>
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
                border: 'none', borderRadius: 4, padding: '11px 16px',
                cursor: canAnalyze ? 'pointer' : 'not-allowed',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                letterSpacing: '0.06em', marginBottom: 12,
                transition: 'background 0.15s ease',
              }}
            >
              {analyzing ? '▸ Analyzing...' : '▸ Run Analysis'}
            </button>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Score', cost: 'free' },
                { label: 'JD local', cost: 'free' },
                { label: 'Deep JD', cost: '$0.01' },
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

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', flexShrink: 0 }}>
            {TABS.map(tab => {
              const isDisabled = tab.requiresAnalysis && !hasResults;
              const isActive = activeTab === tab.id;
              // Skills tab is always available if there's a JD
              const skillsAvailable = tab.id === 'skills' && (!!liveJD || !!displayJD);
              const effectiveDisabled = tab.id === 'skills' ? !skillsAvailable : isDisabled;
              return (
                <button
                  key={tab.id}
                  onClick={() => !effectiveDisabled && setActiveTab(tab.id)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    padding: '10px 12px',
                    cursor: effectiveDisabled ? 'default' : 'pointer',
                    color: isActive ? 'var(--accent)' : effectiveDisabled ? 'var(--text-muted)' : 'var(--text-dim)',
                    fontSize: 10, fontFamily: 'inherit',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: effectiveDisabled ? 0.4 : 1,
                    transition: 'color 0.1s ease',
                  }}
                >
                  {tab.icon}{tab.label}
                  {tab.id === 'skills' && liveJD && (
                    <span style={{
                      fontSize: 9,
                      color: liveJD.overlapScore >= 70 ? 'var(--green)' : liveJD.overlapScore >= 45 ? 'var(--amber)' : 'var(--red)',
                    }}>
                      {liveJD.overlapScore}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {activeTab === 'score' && !hasResults && (
              <EmptyState hasResume={!!resumeText} hasJD={!!jobDescription} />
            )}
            {activeTab === 'score' && hasResults && (
              <ScoreCard localScore={localScore!} jdMatch={jdMatch} />
            )}
            {activeTab === 'skills' && liveJD && (
              <SkillsGap
                result={liveJD}
                onDeepAnalysis={handleDeepAnalysis}
                deepLoading={deepLoading}
                hasDeepResult={hasDeepResult}
              />
            )}
            {activeTab === 'skills' && !liveJD && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>
                Add a job description to see skills gap analysis
              </div>
            )}
            {activeTab === 'bullets' && hasResults && (
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

function MiniScore({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? 'var(--green)' : value >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}

function EmptyState({ hasResume, hasJD }: { hasResume: boolean; hasJD: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Target size={20} color="var(--text-muted)" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>
          {!hasResume ? 'Add your resume to begin' : !hasJD ? 'Add a job description to unlock JD matching' : 'Run analysis when ready'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {hasJD ? 'Skills tab is already live — check JD match now →' : 'Local scoring is instant and free.'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxWidth: 440, width: '100%' }}>
        {[
          { label: 'XYZ Score', desc: 'Every bullet checked for result + metric + action', free: true },
          { label: 'JD Skills Match', desc: '300+ term taxonomy — scores overlap instantly', free: true },
          { label: 'Metric Density', desc: 'Flags sections below the 7/10 threshold', free: true },
          { label: 'Anti-AI Check', desc: '3 tiers: words, phrases, structural patterns', free: true },
          { label: 'Deep JD Analysis', desc: 'Nuanced overlap with context understanding', free: false },
          { label: 'Bullet Rewrites', desc: 'Weak bullets rewritten with active verbs + numbers', free: false },
        ].map((item, i) => (
          <div key={i} style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
              <span style={{ fontSize: 9, color: item.free ? 'var(--green)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
