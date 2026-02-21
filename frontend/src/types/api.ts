export type ClauseType =
  | 'indemnity'
  | 'liability_cap'
  | 'termination'
  | 'confidentiality'
  | 'ip_assignment'
  | 'governing_law'
  | 'data_protection'
  | 'force_majeure'
  | 'other';

export type Severity = 'high' | 'medium' | 'low' | 'info';

export interface ExtractedClause {
  clause_id: string;
  contract_id: string;
  clause_type: ClauseType;
  text: string;
  section_number: string;
  page_number: number;
  char_offset_start: number;
  char_offset_end: number;
  confidence: number;
}

export interface ContractMetadata {
  contract_id: string;
  filename: string;
  upload_timestamp: string;
  num_pages: number;
  num_clauses: number;
  clause_types_found: ClauseType[];
  text_length: number;
}

export interface ContractUploadResponse {
  contract_id: string;
  filename: string;
  num_clauses: number;
  clause_types_found: ClauseType[];
  message: string;
}

export interface SearchRequest {
  query: string;
  clause_types?: ClauseType[] | null;
  contract_ids?: string[] | null;
  top_k?: number;
}

export interface SearchHit {
  clause_id: string;
  contract_id: string;
  clause_type: ClauseType;
  text: string;
  score: number;
  section_number: string;
  page_number: number;
  highlights: string[];
}

export interface SearchResponse {
  query: string;
  total_hits: number;
  hits: SearchHit[];
}

export interface Finding {
  clause_type: ClauseType;
  severity: Severity;
  clause_text: string;
  template_text: string;
  deviation: string;
  risk: string;
  recommendation: string;
  confidence: number;
}

export interface RiskReport {
  contract_id: string;
  contract_filename: string;
  overall_risk_score: number;
  summary: string;
  findings: Finding[];
  coverage: Record<string, boolean>;
  missing_required_clauses: ClauseType[];
  num_high: number;
  num_medium: number;
  num_low: number;
}
