"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "./animations.css";

const ICON_SVG = (
  <svg viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 7C14.66 7 15.99 5.66 15.99 4C15.99 2.34 14.66 1 13 1C11.34 1 10 2.34 10 4C10 5.66 11.34 7 13 7ZM5 6V3H3V6H0V8H3V11H5V8H8V6H5ZM13 9C10.67 9 6 10.17 6 12.5V15H20V12.5C20 10.17 15.33 9 13 9Z"
      fill="currentColor"
    />
  </svg>
);

function InviteBanner() {
  return (
    <div className="banner">
      <div className="banner-icon">{ICON_SVG}</div>
      <div className="banner-copy">
        <div className="banner-title">Great answer</div>
        <div className="banner-subtitle">
          Invite friends to answer this question too
        </div>
      </div>
      <button className="banner-btn">
        {ICON_SVG} Invite friends
      </button>
    </div>
  );
}

const ANIMATIONS = [
  { id: "glow", name: "Glow Pulse", category: "Attention loop" },
  { id: "border-draw", name: "Border Draw", category: "Delight" },
  { id: "shimmer", name: "Shimmer Sweep", category: "Delight" },
] as const;

export default function AnimationPreviewPage() {
  const stageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [speed, setSpeed] = useState("1");

  const replay = useCallback((id: string) => {
    const el = stageRefs.current.get(id);
    if (!el) return;
    el.classList.remove("playing");
    void el.offsetWidth; // force reflow
    el.style.animationDuration = `calc(1s / ${speed})`;
    el.classList.add("playing");
  }, [speed]);

  const replayAll = useCallback(() => {
    ANIMATIONS.forEach((a, i) => {
      setTimeout(() => replay(a.id), i * 120);
    });
  }, [replay]);

  useEffect(() => {
    const timer = setTimeout(replayAll, 300);
    return () => clearTimeout(timer);
  }, [replayAll]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Invite Friends Banner - Animation Explorer
            </h1>
            <p className="text-sm text-muted-foreground">
              Compare animation approaches for the invite banner component
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed</span>
              <Select value={speed} onValueChange={setSpeed}>
                <SelectTrigger size="sm" className="w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={replayAll}>
              <Play className="size-3.5" />
              Replay All
            </Button>
          </div>
        </div>
      </header>

      {/* Stack */}
      <div className="mx-auto max-w-[720px] px-6 py-8">
        <div className="grid gap-6">
          {ANIMATIONS.map((anim) => (
            <Card key={anim.id}>
              <CardHeader>
                <CardTitle className="text-sm">{anim.name}</CardTitle>
                <CardAction>
                  <Badge variant="secondary">{anim.category}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div
                  ref={(el) => {
                    if (el) stageRefs.current.set(anim.id, el);
                  }}
                  className={`anim-${anim.id} relative flex min-h-[180px] items-center justify-center rounded-lg bg-muted/50 px-6 py-10`}
                >
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="absolute top-2 right-2 opacity-60 hover:opacity-100"
                    onClick={() => replay(anim.id)}
                  >
                    <RotateCcw className="size-3" />
                  </Button>
                  <InviteBanner />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
