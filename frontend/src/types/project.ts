// --- Enums ---

export type RequirementType = 'fr' | 'qa' | 'constraints' | 'other';

export type ProjectModule = 'requirements' | 'design' | 'testcase';

export type ProjectStatus = 'active' | 'archived';

// --- Project ---

export interface Project {
  project_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  product_type: string | null;
  modules: ProjectModule[];
  member_count: number;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
  domain?: string | null;
  product_type?: string | null;
  modules: ProjectModule[];
}

export interface ProjectUpdate {
  name?: string | null;
  description?: string | null;
  domain?: string | null;
  product_type?: string | null;
  modules?: ProjectModule[] | null;
}

export interface ProjectListResponse {
  projects: Project[];
}

// --- Requirement ---

// --- Section (요구사항 그룹) ---

export interface Section {
  section_id: string;
  name: string;
  type: RequirementType;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SectionCreate {
  name: string;
  type: RequirementType;
}

export interface SectionUpdate {
  name: string;
}

export interface SectionReorderRequest {
  ordered_ids: string[];
}

export interface SectionListResponse {
  sections: Section[];
}

export interface Requirement {
  requirement_id: string;
  display_id: string;
  order_index: number;
  type: RequirementType;
  original_text: string;
  refined_text: string | null;
  is_selected: boolean;
  status: string;
  section_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequirementReorderRequest {
  ordered_ids: string[];
}

export interface RequirementCreate {
  type: RequirementType;
  original_text: string;
  section_id?: string | null;
}

export interface RequirementUpdate {
  original_text?: string | null;
  refined_text?: string | null;
  is_selected?: boolean | null;
  section_id?: string | null;
}

export interface RequirementListResponse {
  requirements: Requirement[];
}

export interface RequirementSelectionUpdate {
  requirement_ids: string[];
  is_selected: boolean;
}

export interface RequirementSaveResponse {
  version: number;
  saved_count: number;
  saved_at: string;
}

// --- AI Assist ---

export interface RefineRequest {
  text: string;
  type: RequirementType;
}

export interface RefineResponse {
  original_text: string;
  refined_text: string;
  type: RequirementType;
}

export interface SuggestRequest {
  requirement_ids: string[];
}

export interface Suggestion {
  type: RequirementType;
  text: string;
  reason: string;
}

export interface SuggestResponse {
  suggestions: Suggestion[];
}

// --- Glossary ---

export interface GlossaryItem {
  glossary_id: string;
  term: string;
  definition: string;
  product_group: string | null;
}

export interface GlossaryCreate {
  term: string;
  definition: string;
  product_group?: string | null;
}

export interface GlossaryUpdate {
  term?: string | null;
  definition?: string | null;
  product_group?: string | null;
}

export interface GlossaryListResponse {
  glossary: GlossaryItem[];
}

export interface GlossaryGenerateResponse {
  generated_glossary: GlossaryCreate[];
}

// --- Chat (대화 모드) ---

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExtractedRequirement {
  type: RequirementType;
  text: string;
  reason: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  extracted_requirements: ExtractedRequirement[];
}

// --- Review ---

export interface ReviewRequest {
  requirement_ids: string[];
}

export interface ReviewIssue {
  issue_id: string;
  type: 'conflict' | 'duplicate';
  description: string;
  related_requirements: string[];
  hint: string; // 해결 힌트 1줄
}

export interface ReviewSummary {
  total_issues: number;
  conflicts: number;
  duplicates: number;
  ready_for_next: boolean;
  feedback: string;
}

export interface ReviewResponse {
  review_id: string;
  issues: ReviewIssue[];
  summary: ReviewSummary;
}

export interface LatestReviewResponse {
  review_id: string;
  created_at: string;
  reviewed_requirement_ids: string[];
  issues: ReviewIssue[];
  summary: ReviewSummary;
}

// --- Project Settings ---

export interface ProjectSettings {
  llm_model: string;
  language: string;
  export_format: string;
  diagram_tool: string;
}

export interface ProjectSettingsUpdate {
  llm_model?: string | null;
  language?: string | null;
  export_format?: string | null;
  diagram_tool?: string | null;
}

// --- Knowledge Source (mock - backend not yet implemented) ---

export type KnowledgeSourceFileType = 'pdf' | 'md' | 'docx' | 'xlsx' | 'pptx';
export type KnowledgeSourceStatus = 'processing' | 'ready' | 'error';

export interface KnowledgeSource {
  id: string;
  name: string;
  file_type: KnowledgeSourceFileType;
  size_bytes: number;
  uploaded_at: string;
  status: KnowledgeSourceStatus;
}

// --- Common ---

export interface ErrorDetail {
  code: string;
  message: string;
  detail?: string | null;
}

export interface ErrorResponse {
  error: ErrorDetail;
}
