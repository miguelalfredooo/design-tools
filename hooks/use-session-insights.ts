"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ResearchInsightRow, ResearchInsight } from "@/lib/research-types";
import { insightFromRow } from "@/lib/research-types";

export function useSessionInsights(sessionId: string) {
  const [insights, setInsights] = useState<ResearchInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      if (!supabase) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: latest } = await supabase
        .from("research_insights")
        .select("batch_id")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!latest) {
        if (!cancelled) {
          setInsights([]);
          setLoading(false);
        }
        return;
      }

      const { data: rows } = await supabase
        .from("research_insights")
        .select("*")
        .eq("batch_id", latest.batch_id)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        setInsights(
          (rows as ResearchInsightRow[] | null)?.map(insightFromRow) ?? []
        );
        setLoading(false);
      }
    }

    void loadInsights();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function reload() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: latest } = await supabase
      .from("research_insights")
      .select("batch_id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!latest) {
      setInsights([]);
      setLoading(false);
      return;
    }

    const { data: rows } = await supabase
      .from("research_insights")
      .select("*")
      .eq("batch_id", latest.batch_id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    setInsights(
      (rows as ResearchInsightRow[] | null)?.map(insightFromRow) ?? []
    );
    setLoading(false);
  }

  return { insights, loading, reload };
}
