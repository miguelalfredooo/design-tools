"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AgentMessage,
  DesignOpsArchive,
  DesignOpsModuleRecord,
  Objective,
  SynthesisMode,
} from "@/lib/design-ops-types";
export function useDesignOpsWorkspace() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [activeObjectiveId, setActiveObjectiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [archives, setArchives] = useState<DesignOpsArchive[]>([]);
  const [modules, setModules] = useState<DesignOpsModuleRecord[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRunMode, setCurrentRunMode] = useState<SynthesisMode>("decision_memo");
  const pendingObjectiveDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const pendingArchiveDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const activeObjective = useMemo(
    () => objectives.find((objective) => objective.id === activeObjectiveId) ?? null,
    [activeObjectiveId, objectives]
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/design-ops/objectives").then((response) => response.json()),
      fetch("/api/design-ops/archives").then((response) => response.json()),
      fetch("/api/design-ops/modules").then((response) => response.json()),
    ])
      .then(([objectiveData, archiveData, moduleData]) => {
        setObjectives(objectiveData);
        setArchives(archiveData);
        setModules(moduleData);
        setActiveObjectiveId(objectiveData[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const addObjective = useCallback(
    async (objective: Omit<Objective, "id" | "createdAt">) => {
      try {
        const response = await fetch("/api/design-ops/objectives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(objective),
        });
        if (!response.ok) throw new Error("Failed to add objective");
        const created = await response.json();
        setObjectives((current) => [created, ...current]);
        toast.success("Objective added");
        return created as Objective;
      } catch {
        toast.error("Failed to add objective");
        return null;
      }
    },
    []
  );

  const updateObjective = useCallback(
    async (id: string, updates: Omit<Objective, "id" | "createdAt">) => {
      try {
        const response = await fetch(`/api/design-ops/objectives?id=${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error("Failed to update objective");
        const updated = await response.json();
        setObjectives((current) =>
          current.map((objective) => (objective.id === id ? updated : objective))
        );
        toast.success("Objective updated");
        return updated as Objective;
      } catch {
        toast.error("Failed to update objective");
        return null;
      }
    },
    []
  );

  const deleteObjective = useCallback(
    (id: string) => {
      setObjectives((current) => {
        const index = current.findIndex((objective) => objective.id === id);
        if (index === -1) return current;

        const removed = current[index];
        const next = current.filter((objective) => objective.id !== id);

        if (activeObjectiveId === id) {
          setActiveObjectiveId(next[0]?.id ?? null);
        }

        const timer = setTimeout(async () => {
          pendingObjectiveDeletes.current.delete(id);
          try {
            const response = await fetch(`/api/design-ops/objectives?id=${id}`, {
              method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete");
          } catch {
            setObjectives((latest) => {
              if (latest.some((objective) => objective.id === removed.id)) return latest;
              const restored = [...latest];
              restored.splice(Math.min(index, restored.length), 0, removed);
              return restored;
            });
            setActiveObjectiveId((currentId) => currentId ?? removed.id);
            toast.error("Failed to remove objective");
          }
        }, 5000);

        pendingObjectiveDeletes.current.set(id, timer);

        toast("Objective removed", {
          action: {
            label: "Undo",
            onClick: () => {
              const pending = pendingObjectiveDeletes.current.get(id);
              if (pending) {
                clearTimeout(pending);
                pendingObjectiveDeletes.current.delete(id);
              }
              setObjectives((latest) => {
                if (latest.some((objective) => objective.id === removed.id)) return latest;
                const restored = [...latest];
                restored.splice(Math.min(index, restored.length), 0, removed);
                return restored;
              });
              setActiveObjectiveId(removed.id);
            },
          },
        });

        return next;
      });
    },
    [activeObjectiveId]
  );

  const deleteArchive = useCallback((id: string) => {
    setArchives((current) => {
      const index = current.findIndex((archive) => archive.id === id);
      if (index === -1) return current;

      const removed = current[index];
      const next = current.filter((archive) => archive.id !== id);

      const timer = setTimeout(async () => {
        pendingArchiveDeletes.current.delete(id);
        try {
          const response = await fetch(`/api/design-ops/archives?id=${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete");
        } catch {
          setArchives((latest) => {
            if (latest.some((archive) => archive.id === removed.id)) return latest;
            const restored = [...latest];
            restored.splice(Math.min(index, restored.length), 0, removed);
            return restored;
          });
          toast.error("Failed to remove synthesis");
        }
      }, 5000);

      pendingArchiveDeletes.current.set(id, timer);

      toast("Synthesis removed", {
        action: {
          label: "Undo",
          onClick: () => {
            const pending = pendingArchiveDeletes.current.get(id);
            if (pending) {
              clearTimeout(pending);
              pendingArchiveDeletes.current.delete(id);
            }
            setArchives((latest) => {
              if (latest.some((archive) => archive.id === removed.id)) return latest;
              const restored = [...latest];
              restored.splice(Math.min(index, restored.length), 0, removed);
              return restored;
            });
          },
        },
      });

      return next;
    });
  }, []);

  const archiveRun = useCallback(
    async (payload: {
      prompt: string;
      mode: SynthesisMode;
      objectives: Objective[];
      messages: AgentMessage[];
      provider?: string;
      model?: string;
    }) => {
      try {
        const response = await fetch("/api/design-ops/archives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to save synthesis");
        const archive = await response.json();
        setArchives((current) => [archive, ...current]);
      } catch {
        toast.error("Saved run was not archived");
      }
    },
    []
  );

  const updateModule = useCallback(async (id: string, updates: Partial<Omit<DesignOpsModuleRecord, 'id' | 'createdAt'>>) => {
    try {
      const response = await fetch(`/api/design-ops/modules?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update module");
      const updated = await response.json();
      setModules((current) => current.map((m) => (m.id === id ? updated : m)));
      return updated as DesignOpsModuleRecord;
    } catch {
      toast.error("Failed to update module");
      return null;
    }
  }, []);

  return {
    objectives,
    activeObjectiveId,
    activeObjective,
    messages,
    archives,
    modules,
    running,
    loading,
    currentRunMode,
    setActiveObjectiveId,
    setMessages,
    setRunning,
    setCurrentRunMode,
    addObjective,
    updateObjective,
    deleteObjective,
    deleteArchive,
    archiveRun,
    updateModule,
  };
}
