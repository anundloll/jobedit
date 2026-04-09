'use client';

import { useState, useCallback } from 'react';
import ResumeUpload from '@/components/ResumeUpload';
import ScoreCard from '@/components/ScoreCard';
import BulletEditor from '@/components/BulletEditor';
import InterviewGuide from '@/components/InterviewGuide';
import PitchGenerator from '@/components/PitchGenerator';
import type { LocalScoreResult } from '@/lib/scoring';
import type { JDMatchResult, BulletSuggestion, InterviewGuide as GuideType, TMayPitch } from '@/lib/claude';
import { FileText, Target, MessageSquare, Mic, AlertCircle, Zap } from 'lucide-react';

type Tab = 'score' | 'bullets' | 'interview' | 'pitch';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'score', label: 'Score', icon: <Zap size={13} /> },
  { id: 'bullets', label: 'Bullets', icon: <FileText size={13} /> },
  { id: 'interview', label: 'Interview', icon: <MessageSquare size={13} /> },
  { id: 'pitch', label: 'Pitch', icon: <Mic size={13} /> },
];

export default function Dashboard() {
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
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

  const inputStyle = {
    width: '100%',
    background: '#111',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '8px 10px',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
  };

  const hasResults = localScore !== null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>JOBEDIT</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>.DEV</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          DIRECTOR-LEVEL RESUME INTELLIGENCE
        </span>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel — inputs */}
        <aside style={{
          width: 320,
          borderRight: '1px solid var(--border)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Resume
            </div>
            <ResumeUpload
              onTextExtracted={handleTextExtracted}
              fileName={resumeFileName}
              hasResume={!!resumeText}
              onClear={() => { setResumeText(''); setResumeFileName(''); setLocalScore(null); setJdMatch(null); }}
            />
            {resumeText && !resumeFileName && (
              <div style={{ marginTop: 8 }}>
                <textarea
                  style={{ ...inputStyle, height: 120, resize: 'vertical', fontSize: 11 }}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Or paste resume text here..."
                />
              </div>
            )}
            {!resumeText && (
              <div style={{ marginTop: 8 }}>
                <textarea
                  style={{ ...inputStyle, height: 100, resize: 'vertical', fontSize: 11 }}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Or paste resume text directly..."
                />
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Job Target
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                style={inputStyle}
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Job title (e.g. VP of Media Sales)"
              />
              <input
                style={inputStyle}
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Company name"
              />
              <textarea
                style={{ ...inputStyle, height: 120, resize: 'vertical' }}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste job description here (optional — enables JD match scoring)"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !resumeText}
            style={{
              background: resumeText ? 'var(--accent)' : 'var(--surface-2)',
              color: resumeText ? '#000' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 4,
              padding: '12px 16px',
              cursor: analyzing || !resumeText ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
              opacity: analyzing ? 0.7 : 1,
            }}
          >
            {analyzing ? '▸ Analyzing...' : '▸ Run Analysis'}
          </button>

          {error && (
            <div style={{
              display: 'flex',
              gap: 6,
              padding: '8px 10px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 4,
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <AlertCircle size={12} color="var(--red)" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>
            </div>
          )}

          {/* Cost indicator */}
          <div style={{
            marginTop: 'auto',
            padding: '10px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              API Usage
            </div>
            {[
              { label: 'Local scoring', cost: 'Free', active: true },
              { label: 'JD matching', cost: '~$0.01', active: !!jobDescription },
              { label: 'Bullet rewrites', cost: '~$0.02', active: false },
              { label: 'Interview guide', cost: '~$0.04', active: false },
              { label: 'TMAY pitch', cost: '~$0.01', active: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: item.active ? 'var(--text-dim)' : 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: 10, color: item.cost === 'Free' ? 'var(--green)' : 'var(--text-muted)' }}>{item.cost}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Right panel — results */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          {hasResults && (
            <div style={{
              borderBottom: '1px solid var(--border)',
              padding: '0 24px',
              display: 'flex',
              gap: 0,
              flexShrink: 0,
            }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'color 0.1s ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {!hasResults && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 16,
                color: 'var(--text-muted)',
              }}>
                <Target size={40} color="var(--border)" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>Upload your resume and run analysis</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Local scoring is instant and free. JD matching uses one Claude call.
                  </div>
                </div>
              </div>
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
