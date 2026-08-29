export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CodeFile {
  name: string;
  path: string;
  language: string;
  size: string;
  linesCount: number;
  content: string;
  isExcluded?: boolean;
  exclusionReason?: string;
  category: 'controller' | 'service' | 'repository' | 'schema' | 'config' | 'security';
}

export interface TraceEvidence {
  fileName: string;
  startLine: number;
  endLine: number;
  snippet: string;
  explanation: string;
}

export interface UseCaseSpec {
  id: string;
  name: string;
  actor: string;
  confidence: ConfidenceLevel;
  preCondition: string;
  postCondition: string;
  mainFlow: string[];
  evidence: TraceEvidence;
  businessRulesRef?: string[];
}

export interface BusinessRuleSpec {
  id: string;
  ruleName: string;
  description: string;
  confidence: ConfidenceLevel;
  evidence: TraceEvidence;
  impactLevel: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

export interface ApiSpec {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  confidence: ConfidenceLevel;
  requestPayload?: string;
  responsePayload?: string;
  evidence: TraceEvidence;
}

export interface ProjectOverview {
  name: string;
  slogan: string;
  description: string;
  techStackDetected: {
    name: string;
    version?: string;
    category: string;
    confidence: number;
  }[];
  metrics: {
    totalFilesScanned: number;
    relevantFilesCount: number;
    ignoredFilesCount: number;
    totalLinesOfCode: number;
    reconstructionConfidence: number;
    cacheTtlMinutes: number;
    estimatedTokensSaved: number;
  };
  architecturalStyle: string;
  securityFindingsSummary: string[];
}

export interface DatabaseArchitecture {
  mermaidErdCode: string;
  tablesDescription: string;
  entitiesCount: number;
}

export interface DiagramFlow {
  id?: string;
  mermaidSequenceCode: string;
  title: string;
  description: string;
}

export interface FullSRS {
  projectOverview: ProjectOverview;
  useCases: UseCaseSpec[];
  businessRules: BusinessRuleSpec[];
  apiSpecs: ApiSpec[];
  databaseArchitecture: DatabaseArchitecture;
  diagramFlows: DiagramFlow[];
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  tag: 'SCAN' | 'FILTER' | 'OPTIMIZE' | 'TREE' | 'CACHE' | 'SUCCESS' | 'WARN' | 'INFO';
  message: string;
  details?: string;
  color?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  evidenceRef?: TraceEvidence;
  isStreaming?: boolean;
}
