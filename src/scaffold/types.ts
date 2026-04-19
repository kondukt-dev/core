export type TemplateName = "typescript" | "python";

export interface ScaffoldParameter {
  type: string;
  description: string;
  required?: boolean;
}

export interface ScaffoldTool {
  name: string;
  description: string;
  parameters: Record<string, ScaffoldParameter>;
}

export interface ScaffoldConfig {
  name: string;
  template: TemplateName;
  description?: string;
  tools: ScaffoldTool[];
  outputDir: string;
}

export interface ScaffoldResult {
  outputDir: string;
  files: string[];
  nextSteps: string[];
}
