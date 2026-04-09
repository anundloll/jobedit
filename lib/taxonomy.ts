// Mega-taxonomy: 300+ terms for local JD scoring — zero API cost
// Each category maps to a domain; terms are matched against resume + JD text

export interface TaxonomyCategory {
  id: string;
  label: string;
  terms: string[];
  // Synonyms: if any synonym matches, the canonical term is considered matched
  synonyms?: Record<string, string[]>;
}

export const TAXONOMY: TaxonomyCategory[] = [
  // -------------------------------------------------------------------------
  // AD TECH / PROGRAMMATIC
  // -------------------------------------------------------------------------
  {
    id: 'adtech',
    label: 'Ad Tech / Programmatic',
    terms: [
      'DSP', 'SSP', 'RTB', 'programmatic', 'header bidding', 'OpenRTB',
      'yield optimization', 'ad serving', 'auction engine', 'impression model',
      'VAST', 'VPAID', 'ad exchange', 'ad network', 'demand-side platform',
      'supply-side platform', 'real-time bidding', 'private marketplace', 'PMP',
      'preferred deals', 'programmatic direct', 'floor price', 'bid shading',
      'cookie deprecation', 'identity resolution', 'deterministic matching',
      'probabilistic matching', 'unified ID', 'first-party data', 'third-party data',
      'data clean room', 'DMP', 'data management platform', 'CDP',
      'frequency capping', 'inventory management', 'ad fraud', 'brand safety',
      'viewability', 'IAS', 'DoubleVerify', 'MOAT', 'TAG certified',
    ],
    synonyms: {
      'DSP': ['demand-side platform', 'demand side platform'],
      'SSP': ['supply-side platform', 'supply side platform'],
      'RTB': ['real-time bidding', 'real time bidding'],
      'DMP': ['data management platform'],
      'CDP': ['customer data platform'],
    },
  },

  // -------------------------------------------------------------------------
  // STREAMING / CTV / VIDEO
  // -------------------------------------------------------------------------
  {
    id: 'ctv',
    label: 'CTV / Streaming / Video',
    terms: [
      'CTV', 'OTT', 'AVOD', 'SVOD', 'FAST', 'FAST channels', 'connected TV',
      'streaming video', 'linear TV', 'addressable TV', 'advanced TV',
      'ACR data', 'automatic content recognition', 'cross-screen measurement',
      'co-viewing', 'household graph', 'TV attribution', 'converged TV',
      'upfront', 'scatter market', 'NewFronts', 'Upfronts',
      'video intelligence', 'content targeting', 'contextual targeting',
      'dynamic ad insertion', 'DAI', 'server-side ad insertion', 'SSAI',
      'playout', 'content delivery network', 'CDN', 'live streaming',
      'VOD', 'TVOD', 'transactional video',
    ],
    synonyms: {
      'CTV': ['connected TV', 'connected television'],
      'OTT': ['over the top', 'over-the-top'],
      'AVOD': ['ad-supported video', 'advertising video on demand'],
      'SVOD': ['subscription video on demand'],
      'FAST': ['free ad-supported streaming', 'free ad-supported television'],
    },
  },

  // -------------------------------------------------------------------------
  // MEASUREMENT & ATTRIBUTION
  // -------------------------------------------------------------------------
  {
    id: 'measurement',
    label: 'Measurement & Attribution',
    terms: [
      'incrementality', 'multi-touch attribution', 'MTA', 'closed-loop measurement',
      'test and learn', 'sales lift', 'transaction datasets', 'store visit lift',
      'Nielsen', 'iSpot', 'Comscore', 'VideoAmp', 'cross-channel measurement',
      'brand lift', 'awareness lift', 'purchase intent', 'consideration lift',
      'last-click attribution', 'data-driven attribution', 'media mix modeling',
      'MMM', 'marketing mix model', 'reach and frequency', 'GRP', 'TRP',
      'CPM', 'CPC', 'CTR', 'ROAS', 'ROI', 'LTV', 'CAC', 'NPS',
      'behavioral intelligence', 'audience analytics', 'panel data',
      'first-party measurement', 'privacy-compliant measurement',
      'identity graph', 'clean room', 'Snowflake', 'AWS',
    ],
    synonyms: {
      'MTA': ['multi-touch attribution', 'multi touch attribution'],
      'MMM': ['media mix model', 'marketing mix model'],
      'NPS': ['net promoter score'],
      'ROAS': ['return on ad spend'],
    },
  },

  // -------------------------------------------------------------------------
  // EV / COMMERCE MEDIA / VIDEOEV-SPECIFIC
  // -------------------------------------------------------------------------
  {
    id: 'ev_commerce',
    label: 'EV & Commerce Media',
    terms: [
      'OCPP', 'OCPP 2.0.1', 'telemetry', 'CPO', 'charging point operator',
      'vehicle identity network', 'vehicle commerce', 'real-time sessions',
      'dynamic QR', 'V2G', 'vehicle-to-grid', 'battery state', 'hardware SDK',
      'EV charging', 'electric vehicle', 'charge session', 'EVSE',
      'smart charging', 'load management', 'energy management',
      'fleet management', 'retail media', 'commerce media', 'DOOH',
      'digital out-of-home', 'place-based media', 'proximity targeting',
      'dwell time', 'captive audience', 'point of sale', 'POS data',
    ],
  },

  // -------------------------------------------------------------------------
  // PRODUCT & STRATEGY
  // -------------------------------------------------------------------------
  {
    id: 'strategy',
    label: 'Product & Strategy',
    terms: [
      'roadmap execution', 'product roadmap', 'GTM strategy', 'go-to-market',
      'C-suite reporting', 'board reporting', 'executive presentation',
      'scenario planning', 'churn mitigation', 'NPS', '0-to-1 launch',
      'zero to one', 'ARR', 'MRR', 'annual recurring revenue',
      'B2B SaaS', 'enterprise sales', 'cross-functional alignment',
      'lifecycle experiments', 'partnership framework', 'strategic partnerships',
      'P&L management', 'P&L ownership', 'budget management', 'forecast',
      'revenue growth', 'market expansion', 'competitive intelligence',
      'stakeholder management', 'OKRs', 'KPIs', 'business development',
      'M&A', 'due diligence', 'integration', 'post-merger',
    ],
    synonyms: {
      'GTM': ['go-to-market', 'go to market'],
      'ARR': ['annual recurring revenue'],
      'MRR': ['monthly recurring revenue'],
    },
  },

  // -------------------------------------------------------------------------
  // SALES & PARTNERSHIPS
  // -------------------------------------------------------------------------
  {
    id: 'sales',
    label: 'Sales & Revenue',
    terms: [
      'consultative selling', 'solution selling', 'enterprise accounts',
      'agency relationships', 'holding company', 'GroupM', 'Publicis', 'IPG',
      'Omnicom', 'WPP', 'trading desk', 'managed service', 'self-serve',
      'upsell', 'cross-sell', 'renewal', 'win rate', 'pipeline management',
      'CRM', 'Salesforce', 'quota attainment', 'revenue targets',
      'deal structure', 'contract negotiation', 'RFP', 'proposal',
      'advertiser direct', 'brand direct', 'performance advertising',
      'brand advertising', 'scatter', 'upfront', 'guaranteed',
    ],
  },

  // -------------------------------------------------------------------------
  // TECHNICAL SKILLS
  // -------------------------------------------------------------------------
  {
    id: 'technical',
    label: 'Technical Skills',
    terms: [
      'SQL', 'Python', 'JavaScript', 'TypeScript', 'Tableau', 'Looker',
      'Power BI', 'Jira', 'Figma', 'Excel', 'Google Sheets',
      'AI tools', 'machine learning', 'data pipeline', 'ETL',
      'data rights', 'model training', 'API-first', 'REST API', 'GraphQL',
      'SDK', 'mobile SDK', 'iOS', 'Android', 'cloud infrastructure',
      'AWS', 'GCP', 'Azure', 'Snowflake', 'BigQuery', 'dbt',
      'privacy-compliant', 'GDPR', 'CCPA', 'consent management',
      'first-party data strategy', 'data governance',
    ],
  },

  // -------------------------------------------------------------------------
  // LEADERSHIP & MANAGEMENT
  // -------------------------------------------------------------------------
  {
    id: 'leadership',
    label: 'Leadership & Management',
    terms: [
      'team building', 'talent development', 'performance management',
      'hiring', 'recruiting', 'org design', 'restructuring', 'headcount',
      'people management', 'direct reports', 'skip-level', 'mentorship',
      'coaching', 'culture building', 'DEI', 'remote team', 'distributed team',
      'change management', 'transformation', 'turnaround', 'crisis management',
      'executive leadership', 'senior leadership', 'VP', 'SVP', 'C-suite',
    ],
  },

  // -------------------------------------------------------------------------
  // MEDIA COMPANIES & PLATFORMS (Arvin's background)
  // -------------------------------------------------------------------------
  {
    id: 'media_companies',
    label: 'Media Companies & Platforms',
    terms: [
      'Comcast', 'NBCUniversal', 'NBCU', 'Peacock', 'HBO', 'Warner Bros',
      'Discovery', 'Disney', 'Hulu', 'Netflix', 'Amazon', 'Apple',
      'Paramount', 'Viacom', 'Fox', 'ESPN', 'Turner', 'CNN',
      'FreeWheel', 'Effectv', 'One Platform', 'Spectrum',
      'Charter', 'Cox', 'Altice', 'Dish', 'DirecTV',
      'YouTube', 'Meta', 'Google', 'The Trade Desk', 'LiveRamp',
      'Mastercard', 'Visa', 'transaction data', 'purchase data',
    ],
  },
];

// -------------------------------------------------------------------------
// Flat lookup helpers
// -------------------------------------------------------------------------

/** All terms across all categories, lowercased, mapped to category id */
export const TERM_TO_CATEGORY: Map<string, string> = new Map();

for (const cat of TAXONOMY) {
  for (const term of cat.terms) {
    TERM_TO_CATEGORY.set(term.toLowerCase(), cat.id);
  }
  if (cat.synonyms) {
    for (const [canonical, syns] of Object.entries(cat.synonyms)) {
      for (const syn of syns) {
        TERM_TO_CATEGORY.set(syn.toLowerCase(), cat.id);
      }
      // canonical → category too
      TERM_TO_CATEGORY.set(canonical.toLowerCase(), cat.id);
    }
  }
}

/** Category label lookup */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  TAXONOMY.map(c => [c.id, c.label])
);

// -------------------------------------------------------------------------
// Role-level contextual guardrails
// -------------------------------------------------------------------------

export interface RoleGuardrail {
  requiredTerms: string[];
  label: string;
}

export const ROLE_GUARDRAILS: Record<string, RoleGuardrail> = {
  director: {
    label: 'Director',
    requiredTerms: [
      'C-suite reporting', 'scenario planning', 'P&L', 'cross-functional alignment',
      'roadmap execution', 'stakeholder management', 'budget management',
    ],
  },
  vp: {
    label: 'VP / SVP',
    requiredTerms: [
      'P&L ownership', 'board reporting', 'org design', 'revenue growth',
      'M&A', 'executive leadership', 'GTM strategy', 'ARR',
    ],
  },
  manager: {
    label: 'Manager',
    requiredTerms: [
      'team building', 'performance management', 'hiring', 'KPIs',
      'stakeholder management', 'cross-functional alignment',
    ],
  },
};

export function detectRoleLevel(jobTitle: string): string | null {
  const lower = jobTitle.toLowerCase();
  if (/\b(svp|evp|chief|cto|cmo|cro|coo|ceo)\b/.test(lower)) return 'vp';
  if (/\bvp\b|\bvice president/.test(lower)) return 'vp';
  if (/\bdirector\b/.test(lower)) return 'director';
  if (/\bmanager\b/.test(lower)) return 'manager';
  return null;
}
