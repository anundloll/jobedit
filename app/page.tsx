import Link from 'next/link';
import { Target, Zap, FileText, MessageSquare, Mic, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.06em' }}>JOBEDIT</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>.DEV</span>
        </div>
        <Link
          href="/dashboard"
          style={{
            background: 'var(--accent)',
            color: '#000',
            padding: '8px 20px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}
        >
          Open Dashboard →
        </Link>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, maxWidth: 800, margin: '0 auto', padding: '80px 32px 64px', width: '100%' }}>
        <div style={{ marginBottom: 64 }}>
          <div style={{
            fontSize: 10,
            color: 'var(--accent)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Resume Intelligence for Director-Level Professionals
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.2,
            margin: '0 0 20px',
            color: 'var(--text)',
          }}>
            Score your resume.<br />
            <span style={{ color: 'var(--accent)' }}>Ship the right version.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.8, maxWidth: 540, margin: '0 0 32px' }}>
            Automated XYZ bullet analysis, JD overlap scoring, anti-AI writing checks,
            and CAR interview prep — built on the Job Search Accelerator methodology.
          </p>
          <Link
            href="/dashboard"
            style={{
              background: 'var(--accent)',
              color: '#000',
              padding: '14px 28px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
              letterSpacing: '0.04em',
            }}
          >
            ▸ Start for Free
          </Link>
        </div>

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 64,
        }}>
          {[
            {
              icon: <Zap size={16} color="var(--accent)" />,
              title: 'XYZ Validator',
              desc: 'Every bullet checked for Result + Metric + Action. Flags missing components instantly.',
              cost: 'Free',
            },
            {
              icon: <Target size={16} color="var(--blue)" />,
              title: 'JD Match Score',
              desc: '5–7 overlapping requirements extracted. Direct experience only — no transferable skills spin.',
              cost: '~$0.01',
            },
            {
              icon: <FileText size={16} color="var(--green)" />,
              title: 'Bullet Rewrites',
              desc: 'Weak bullets rewritten to XYZ structure, targeting role requirements. Active voice enforced.',
              cost: '~$0.02',
            },
            {
              icon: <MessageSquare size={16} color="var(--amber)" />,
              title: 'CAR Interview Guide',
              desc: "Your achievements mapped to each interviewer's background. Challenge-Action-Result format.",
              cost: '~$0.04',
            },
            {
              icon: <Mic size={16} color="var(--red)" />,
              title: 'TMAY Pitch',
              desc: '60–90 second "Tell Me About Yourself" following Hook → Journey → Why Looking → Why Here.',
              cost: '~$0.01',
            },
            {
              icon: <CheckCircle size={16} color="var(--text-muted)" />,
              title: 'Anti-AI Filter',
              desc: 'Flags banned tropes: delve, synergy, leverage, transformative, and 20+ others. Clinical tone enforced.',
              cost: 'Free',
            },
          ].map((f, i) => (
            <div key={i} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
            }}>
              <div style={{ marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{f.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>{f.desc}</div>
              <div style={{
                fontSize: 10,
                color: f.cost === 'Free' ? 'var(--green)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {f.cost}
              </div>
            </div>
          ))}
        </div>

        {/* Cost breakdown */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 24,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            Built to save you credits
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8, margin: 0 }}>
            Scoring, XYZ validation, scannability, anti-AI detection, and formatting checks all run locally — zero API calls.
            Claude is invoked only for high-value tasks that require language understanding: JD matching, bullet rewrites, interview prep, and pitch generation.
            A full analysis with rewrites costs less than a cup of coffee.
          </p>
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>jobedit.dev</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Built for Director-level professionals in media &amp; ad tech</span>
      </footer>
    </div>
  );
}
