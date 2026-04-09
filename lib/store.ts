// Client-side state types shared across components

export interface AppState {
  resumeText: string;
  resumeFileName: string;
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  analyzing: boolean;
  localScore: import('./scoring').LocalScoreResult | null;
  jdMatch: import('./claude').JDMatchResult | null;
  bulletSuggestions: import('./claude').BulletSuggestion[] | null;
  interviewGuide: import('./claude').InterviewGuide | null;
  pitch: import('./claude').TMayPitch | null;
  error: string | null;
  activeTab: 'score' | 'bullets' | 'interview' | 'pitch';
}

export const defaultState: AppState = {
  resumeText: '',
  resumeFileName: '',
  jobDescription: '',
  jobTitle: '',
  companyName: '',
  analyzing: false,
  localScore: null,
  jdMatch: null,
  bulletSuggestions: null,
  interviewGuide: null,
  pitch: null,
  error: null,
  activeTab: 'score',
};
