"use client";

import { useMemo, useState } from "react";
import { History, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Objective } from "@/lib/design-ops-types";
import { getMetricLabel } from "@/lib/design-ops-label-helpers";
import {
  DesignOpsObjectiveFields,
  makeDefaultObjectiveFormValues,
  type ObjectiveFormValues,
} from "@/components/design/design-ops-objective-fields";

interface DesignOpsObjectivesProps {
  objectives: Objective[];
  activeObjectiveId: string | null;
  onActiveObjectiveChange: (id: string | null) => void;
  onAdd: (obj: Omit<Objective, "id" | "createdAt">) => Promise<Objective | null>;
  onUpdate: (id: string, obj: Omit<Objective, "id" | "createdAt">) => Promise<Objective | null>;
  onDelete: (id: string) => void;
}

interface ObjectiveEditorProps {
  objective: Objective | null;
  onActivateNew: () => void;
  onAdd: (obj: Omit<Objective, "id" | "createdAt">) => Promise<Objective | null>;
  onUpdate: (id: string, obj: Omit<Objective, "id" | "createdAt">) => Promise<Objective | null>;
  onActiveObjectiveChange: (id: string | null) => void;
}

function objectiveToFormValues(objective: Objective): ObjectiveFormValues {
  return {
    title: objective.title,
    metric: objective.metric,
    target: objective.target,
    description: objective.description,
    segmentIds: objective.segmentIds,
    lifecycleCohorts: objective.lifecycleCohorts,
    theoryOfSuccess: objective.theoryOfSuccess ?? "",
  };
}

function ObjectiveEditor({
  objective,
  onActivateNew,
  onAdd,
  onUpdate,
  onActiveObjectiveChange,
}: ObjectiveEditorProps) {
  const [showOptional, setShowOptional] = useState(
    Boolean(objective?.target || objective?.theoryOfSuccess || (objective?.segmentIds?.length ?? 0) > 0 || (objective?.lifecycleCohorts?.length ?? 0) > 0)
  );
  const [draftValues, setDraftValues] = useState<ObjectiveFormValues>(
    objective ? objectiveToFormValues(objective) : makeDefaultObjectiveFormValues()
  );

  const handleSave = async () => {
    if (!draftValues.title || !draftValues.metric) return;

    if (objective) {
      await onUpdate(objective.id, draftValues);
      return;
    }

    const created = await onAdd(draftValues);
    if (created) {
      onActiveObjectiveChange(created.id);
    }
  };

  return (
    <div className="space-y-4">
      <DesignOpsObjectiveFields
        value={draftValues}
        onChange={setDraftValues}
        showAdvanced={showOptional}
        onShowAdvancedChange={setShowOptional}
        appearance="inline"
      />

      <div className="flex gap-2 mt-5">
        <Button size="sm" onClick={handleSave} disabled={!draftValues.title || !draftValues.metric}>
          Save objective
        </Button>
        <Button size="sm" variant="ghost" onClick={onActivateNew}>
          <Plus className="mr-2 size-4" />
          New objective
        </Button>
      </div>
    </div>
  );
}

export function DesignOpsObjectives({
  objectives,
  activeObjectiveId,
  onActiveObjectiveChange,
  onAdd,
  onUpdate,
  onDelete,
}: DesignOpsObjectivesProps) {
  const activeObjective = useMemo(
    () => objectives.find((objective) => objective.id === activeObjectiveId) ?? null,
    [activeObjectiveId, objectives]
  );
  const previousObjectives = useMemo(
    () => objectives.filter((objective) => objective.id !== activeObjectiveId),
    [activeObjectiveId, objectives]
  );

  const handleStartNew = () => {
    onActiveObjectiveChange(null);
  };

  return (
    <div>
      <ObjectiveEditor
        key={activeObjective?.id ?? "new-objective"}
        objective={activeObjective}
        onActivateNew={handleStartNew}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onActiveObjectiveChange={onActiveObjectiveChange}
      />

      {previousObjectives.length > 0 && (
        <div>
          <div className="do-rule" />
          <div className="do-list-header">
            <History className="size-4 text-muted-foreground" />
            <span className="do-list-header-label">
              Previous objectives ({previousObjectives.length})
            </span>
          </div>
          <div className="do-table-wrap">
            <table className="do-table">
              <thead>
                <tr>
                  <th>Objective</th>
                  <th>Metric</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {previousObjectives.map((obj) => (
                  <tr key={obj.id}>
                    <td><strong>{obj.title}</strong></td>
                    <td>
                      <span className="do-badge do-badge-gray">
                        {getMetricLabel(obj.metric)}
                      </span>
                    </td>
                    <td style={{whiteSpace: "nowrap", width: "1%"}}>
                      <div className="flex gap-1 items-center">
                        <Button type="button" size="sm" variant="outline"
                          onClick={() => onActiveObjectiveChange(obj.id)}>
                          Load
                        </Button>
                        <Button type="button" size="icon" variant="ghost"
                          className="size-7"
                          onClick={() => onDelete(obj.id)}
                          aria-label={`Delete ${obj.title}`}>
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
