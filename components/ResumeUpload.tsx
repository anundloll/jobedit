'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface Props {
  onTextExtracted: (text: string, fileName: string) => void;
  fileName: string;
  hasResume: boolean;
  onClear: () => void;
}

export default function ResumeUpload({ onTextExtracted, fileName, hasResume, onClear }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', '');
      formData.append('jobTitle', '');

      // Extract text client-side via API for PDF/DOCX
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        // Fallback: try reading as plain text
        const text = await file.text();
        onTextExtracted(text, file.name);
      } else {
        const { text } = await res.json();
        onTextExtracted(text, file.name);
      }
    } catch {
      // Last resort plain text
      try {
        const text = await file.text();
        onTextExtracted(text, file.name);
      } catch {
        setError('Could not read file. Try pasting your resume text instead.');
      }
    } finally {
      setLoading(false);
    }
  }, [onTextExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: loading,
  });

  if (hasResume) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <CheckCircle size={16} color="var(--green)" />
        <FileText size={14} color="var(--text-dim)" />
        <span style={{ color: 'var(--text)', flex: 1, fontSize: 12 }}>{fileName}</span>
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Remove resume"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 6,
          padding: '24px 16px',
          textAlign: 'center',
          cursor: loading ? 'wait' : 'pointer',
          background: isDragActive ? 'rgba(240, 255, 68, 0.04)' : 'var(--surface)',
          transition: 'all 0.15s ease',
        }}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div style={{ color: 'var(--text-dim)' }}>
            <div className="spinner" style={{ marginBottom: 8 }} />
            Parsing resume...
          </div>
        ) : (
          <>
            <Upload size={20} color={isDragActive ? 'var(--accent)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
            <p style={{ color: isDragActive ? 'var(--accent)' : 'var(--text-dim)', margin: 0, fontSize: 12 }}>
              Drop PDF or DOCX here, or click to select
            </p>
          </>
        )}
      </div>
      {error && <p style={{ color: 'var(--red)', fontSize: 11, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
