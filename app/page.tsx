import Link from 'next/link';
import { Target, Zap, FileText, MessageSquare, Mic, CheckCircle } from 'lucide-react';

const FREE_FEATURES = [
  {
    icon: <Zap size={15} color="var(--accent)" />,
    title: 'XYZ Validator',
    desc: 'Every bullet checked for Result + Metric + Action. Flags missing components instantly.',
  },
  {
    icon: <CheckCircle size={15} color="var(--accent)" />,
    title: 'Anti-AI Filter',
    desc: 'Flags 25+ banned tropes — delve, synergy, leverage, transformative. Clinical tone enforced.',
  },
  {
    icon: <Target size={15} color="var(--accent)" />,
    title: 'Scannability Check',
    desc: 'Summary length (3–5 sentences), page count, and critical keyword presence.',
  },
];

const API_FEATURES = [
  {
    icon: <Target size={15} color="var(--blue)" />,
    title: 'JD Match Score',
    desc: '5–7 direct requirements extracted. No transferable skills spin — actual overlap only.',
    cost: '$0.01',
  },
  {
    icon: <FileText size={15} color="var(--text-dim)" />,
    title: 'Bullet Rewrites',
    desc: 'Weak bullets rewritten to XYZ structure targeting role requirements. Active voice enforced.',
    cost: '$0.02',
  },
  {
    icon: <MessageSquare size={15} color="var(--text-dim)" />,
    title: 'CAR Interview Guide',
    desc: "Achievements mapped to each interviewer's background. Challenge-Action-Result format.",
    cost: '$0.04',
  },
  {
    icon: <Mic size={15} color="var(--text-dim)" />,
    title: 'TMAY Pitch',
    desc: '60–90 second pitch following Hook → Journey → Why Looking → Why This Company.',
    cost: '$0.01',
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={14} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.06em' }}>JOBEDIT</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.14em' }}>.DEV</span>
        </div>
        <Link
          href="/dashboard"
          style={{
            background: 'var(--accent)',
            color: '#000',
            padding: '7px 18px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.05em',
          }}
        >
          Open Dashboard →
        </Link>
      </header>

      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '56px 32px 64px', width: '100%' }}>
        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            fontSize: 9,
            color: 'var(--accent)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Director-Level Resume Intelligence
          </div>
          <h1 style={{
            fontSize: 'clamp(26px, 4.5vw, 44px)',
            fontWeight: 700,
            lineHeight: 1.15,
            margin: '0 0 16px',
            color: 'var(--text)',
          }}>
            Score your resume.<br />
            <span style={{ color: 'var(--accent)' }}>Ship the right version.</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.75, maxWidth: 500, margin: '0 0 28px' }}>
            XYZ bullet validation, JD overlap scoring, anti-AI checks, and CAR interview prep — built on the Job Search Accelerator methodology.
          </p>
          <Link
            href="/dashboard"
            style={{
              background: 'var(--accent)',
              color: '#000',
              padding: '12px 24px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
              letterSpacing: '0.05em',
            }}
          >
            ▸ Start for Free
          </Link>
        </div>

        {/* Free tier */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--green)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              background: 'rgba(34, 197, 94, 0.08)',
              padding: '3px 8px',
              borderRadius: 3,
              border: '1px solid rgba(34, 197, 94, 0.15)',
            }}>
              Free — runs locally
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {FREE_FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderTop: '2px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 6,
                padding: '16px 16px 14px',
              }}>
                <div style={{ marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text)' }}>{f.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API tier */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              background: 'var(--surface)',
              padding: '3px 8px',
              borderRadius: 3,
              border: '1px solid var(--border)',
            }}>
              Claude API — pay per use
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {API_FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '16px 16px 14px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text)', flex: 1 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.55, marginBottom: 10 }}>{f.desc}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{f.cost} per call</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom callout */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: 6,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>
            A full session — score, JD match, bullet rewrites, interview guide, and pitch — costs under <strong style={{ color: 'var(--text)' }}>$0.10</strong>. Anthropic gives $5 free credit on signup.
          </p>
          <Link
            href="/dashboard"
            style={{
              background: 'var(--accent)',
              color: '#000',
              padding: '10px 20px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}
          >
            Try it now →
          </Link>
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '14px 32px',
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
