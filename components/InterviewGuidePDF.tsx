'use client';

// PDF export for Interview Guide using @react-pdf/renderer
// Loaded dynamically to avoid SSR issues

import { useCallback, useState } from 'react';
import type { InterviewGuide } from '@/lib/claude';
import { Download } from 'lucide-react';

interface Props {
  guide: InterviewGuide;
  targetRole: string;
  companyName: string;
}

export default function InterviewGuidePDFButton({ guide, targetRole, companyName }: Props) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const {
        Document, Page, Text, View, StyleSheet, pdf, Font,
      } = await import('@react-pdf/renderer');

      const styles = StyleSheet.create({
        page: {
          padding: 48,
          fontFamily: 'Helvetica',
          fontSize: 10,
          color: '#1a1a1a',
          lineHeight: 1.5,
        },
        header: {
          marginBottom: 24,
          borderBottom: '1 solid #e0e0e0',
          paddingBottom: 12,
        },
        title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#0a0a0a' },
        subtitle: { fontSize: 11, color: '#666' },
        section: { marginBottom: 20 },
        sectionTitle: {
          fontSize: 10,
          fontFamily: 'Helvetica-Bold',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: '#888',
          marginBottom: 10,
          borderBottom: '0.5 solid #e8e8e8',
          paddingBottom: 4,
        },
        carCard: {
          marginBottom: 14,
          padding: '10 12',
          backgroundColor: '#f8f8f8',
          borderLeft: '3 solid #c8d93a',
        },
        carTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0a0a0a' },
        carLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
        carText: { fontSize: 10, color: '#333', marginBottom: 6 },
        relevance: { fontSize: 9, color: '#555', fontStyle: 'italic', marginTop: 4, padding: '4 8', backgroundColor: '#fff' },
        questionCard: { marginBottom: 8, padding: '8 10', backgroundColor: '#f4f4f4' },
        questionText: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#1a1a1a' },
        bullet: { fontSize: 9, color: '#444', marginLeft: 8, marginBottom: 2 },
        footer: { position: 'absolute', bottom: 32, left: 48, right: 48, textAlign: 'center', fontSize: 8, color: '#bbb' },
      });

      const doc = (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Interview Preparation Guide</Text>
              <Text style={styles.subtitle}>
                {targetRole} at {companyName} · Interviewer: {guide.interviewerName} ({guide.interviewerTitle})
              </Text>
            </View>

            {/* Opening context */}
            {guide.openingContext && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Opening Strategy</Text>
                <Text style={{ fontSize: 10, color: '#333' }}>{guide.openingContext}</Text>
              </View>
            )}

            {/* CAR Stories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CAR Stories ({guide.carStories.length})</Text>
              {guide.carStories.map((story, i) => (
                <View key={i} style={styles.carCard}>
                  <Text style={styles.carTitle}>{story.achievement}</Text>
                  <Text style={styles.carLabel}>Challenge</Text>
                  <Text style={styles.carText}>{story.challenge}</Text>
                  <Text style={styles.carLabel}>Action</Text>
                  <Text style={styles.carText}>{story.action}</Text>
                  <Text style={styles.carLabel}>Result</Text>
                  <Text style={styles.carText}>{story.result}</Text>
                  <View style={styles.relevance}>
                    <Text style={{ fontSize: 9, color: '#666' }}>
                      Use when asked: {story.suggestedQuestion}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Anticipated Questions */}
            {guide.anticipatedQuestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Anticipated Questions</Text>
                {guide.anticipatedQuestions.map((q, i) => (
                  <View key={i} style={styles.questionCard}>
                    <Text style={styles.questionText}>{q.question}</Text>
                    <Text style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>
                      Use: {q.recommendedStory}
                    </Text>
                    {q.keyPoints.map((kp, j) => (
                      <Text key={j} style={styles.bullet}>· {kp}</Text>
                    ))}
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.footer}>Generated by jobedit.dev · Confidential</Text>
          </Page>
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-guide-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [guide, targetRole, companyName]);

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '8px 14px',
        cursor: generating ? 'wait' : 'pointer',
        color: 'var(--text-dim)',
        fontSize: 11,
        fontFamily: 'inherit',
        opacity: generating ? 0.6 : 1,
      }}
    >
      <Download size={12} />
      {generating ? 'Generating PDF...' : 'Export PDF'}
    </button>
  );
}
