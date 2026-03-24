"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FlaskConical, Link2, Loader2, Plus, Eye, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/hooks/use-admin";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  problem_statement: string | null;
  idea: string | null;
  metrics: string | null;
  status: string;
  created_at: string;
  observationCount: number;
  segmentCount: number;
}


function ProjectCard({ project, onDelete }: { project: Project; onDelete?: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/design/research/projects/${project.id}`, { method: "DELETE" });
      onDelete?.();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link href={`/research/${project.id}`} className="block group">
      <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/20">
        <CardContent className="p-5 space-y-3 h-full flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                <FlaskConical className="size-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold leading-snug">{project.name}</h3>
            </div>
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 shrink-0"
              >
                {deleting
                  ? <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
                  : <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                }
              </button>
            )}
          </div>

          {project.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>
          )}

          {project.problem_statement && (
            <p className="text-xs leading-relaxed line-clamp-2 text-muted-foreground/80 italic">&quot;{project.problem_statement}&quot;</p>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Eye className="size-3" />
              <span>{project.observationCount} obs</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="size-3" />
              <span>{project.segmentCount} segments</span>
            </div>
            <div className="flex-1" />
            <span className="text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ContributionLinkButton({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [areasInput, setAreasInput] = useState("");
  const [promptsInput, setPromptsInput] = useState("");

  async function generate() {
    setGenerating(true);
    try {
      const areas = areasInput.split(",").map((s) => s.trim()).filter(Boolean);
      const prompts = promptsInput.split("\n").map((s) => s.trim()).filter(Boolean);
      const context = {
        title: title.trim() || undefined,
        question: question.trim() || undefined,
        hypothesis: hypothesis.trim() || undefined,
        areas: areas.length ? areas : undefined,
        prompts: prompts.length ? prompts : undefined,
      };
      const res = await fetch("/api/design/research/share-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdBy: "admin", context, projectId: selectedProjectId || null }),
      });
      if (!res.ok) { toast.error("Failed to generate link"); return; }
      const data = await res.json();
      setShareUrl(`${window.location.origin}/research/contribute?token=${data.token}`);
      setOpen(false);
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[260px]">{shareUrl}</code>
        <Button variant="ghost" size="sm" onClick={copy} className="shrink-0">
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </Button>
        <Button variant="ghost" size="sm" className="shrink-0 text-xs text-muted-foreground" onClick={() => { setShareUrl(null); setOpen(false); }}>
          New
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 shrink-0">
        <Link2 className="size-3.5" />
        Create contribution link
      </Button>
    );
  }

  return (
    <div className="absolute right-0 top-10 z-20 w-80 border border-border rounded-xl p-4 space-y-3 bg-card shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">Contribution brief</p>
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>

      {projects.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Project</p>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <Input placeholder="Title  (e.g. Creator Engagement Sprint 4)" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" />
      <Textarea placeholder="Research question" value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} className="text-xs resize-none" />
      <Textarea placeholder="Hypothesis" value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} rows={2} className="text-xs resize-none" />
      <Input placeholder="Areas in scope (comma-separated)" value={areasInput} onChange={(e) => setAreasInput(e.target.value)} className="h-8 text-xs" />
      <Textarea placeholder={"What to look for — one per line"} value={promptsInput} onChange={(e) => setPromptsInput(e.target.value)} rows={2} className="text-xs resize-none" />
      <p className="text-[10px] text-muted-foreground">All fields optional.</p>
      <Button size="sm" className="w-full gap-1.5" onClick={generate} disabled={generating}>
        {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
        Generate link
      </Button>
    </div>
  );
}

export function ProjectIndex({ initialProjects }: { initialProjects: Project[] }) {
  const [creating, setCreating] = useState(false);
  const [projects, setProjects] = useState(initialProjects);
  const router = useRouter();
  const { isAdmin } = useAdmin();

  async function handleNewProject() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/design/research/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Project", description: null }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/research/${data.id}?tab=brief`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Each project has its own brief, observations, segments, and directions.</p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={handleNewProject} disabled={creating}>
          {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onDelete={isAdmin ? () => setProjects((prev) => prev.filter((x) => x.id !== p.id)) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
