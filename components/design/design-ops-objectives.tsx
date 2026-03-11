"use client";

import { useState } from "react";
import { Target, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Objective } from "@/lib/design-ops-types";

interface DesignOpsObjectivesProps {
  objectives: Objective[];
  onAdd: (obj: Omit<Objective, "id" | "createdAt">) => void;
  onDelete: (id: string) => void;
}

export function DesignOpsObjectives({
  objectives,
  onAdd,
  onDelete,
}: DesignOpsObjectivesProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title || !metric) return;
    onAdd({ title, metric, target, description });
    setTitle("");
    setMetric("");
    setTarget("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Business Objectives
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs"
        >
          <Plus className="size-3.5 mr-1" />
          Add
        </Button>
      </div>

      {showForm && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="Objective title (e.g., Improve activation)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Metric (e.g., Activation rate)"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              />
              <Input
                placeholder="Target (e.g., 50%)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-28"
              />
            </div>
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={!title || !metric}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {objectives.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground py-4">
          No objectives defined yet. Add one to anchor your analysis.
        </p>
      )}

      {objectives.map((obj) => (
        <Card key={obj.id} className="group">
          <CardHeader className="py-3 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <Target className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm font-medium">{obj.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {obj.metric}
                    </Badge>
                    {obj.target && (
                      <span className="text-xs text-muted-foreground">→ {obj.target}</span>
                    )}
                  </div>
                  {obj.description && (
                    <p className="text-xs text-muted-foreground mt-1">{obj.description}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity size-7 p-0"
                onClick={() => onDelete(obj.id)}
              >
                <Trash2 className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
