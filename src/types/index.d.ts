export interface Settings {
  id: number;
  language: string;
  theme: string;
  fastModeModel: string;
  deepModeModel: string;
  excludedFolders: string[];
  excludedFileTypes: string[];
}

export interface Project {
  id: number;
  name: string;
  folderPath: string;
  analysisDate: string;
  mode: 'fast' | 'deep';
  selectedCategories: string[];
  overallScore: number;
  version: number;
}

export interface Issue {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title?: string;
  message: string;
  file?: string;
  line?: number;
  impactScore?: number;
}

export interface AnalysisResult {
  id?: number;
  projectId?: number;
  category: string;
  score: number;
  issues: Issue[];
}

export interface Suggestion {
  id?: number;
  projectId?: number;
  filePath: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestedCode: string;
  originalCode: string;
  lineNumber: number;
}

export interface AnalysisProgress {
  percent: number;
  currentFile: string;
  fileIndex: number;
  totalFiles: number;
}
