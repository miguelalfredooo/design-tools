export interface Objective {
  id: string;
  title: string;
  metric: string;
  target: string;
  description: string;
  createdAt: string;
}

export interface AgentMessage {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  priority: "critical" | "standard" | "advisory";
  confidence: "high" | "medium" | "low" | "n/a";
  assumptions: string;
  body: string;
  nextStep: string;
  timestamp: string;
}

export interface CrewRun {
  id: string;
  prompt: string;
  objectives: Objective[];
  messages: AgentMessage[];
  status: "running" | "completed" | "error";
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface CrewHealthStatus {
  status: "ok" | "unavailable";
  ollama: string;
  models: string[];
  configuredModel: string;
}
