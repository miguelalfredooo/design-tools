import {
  TrendingUp,
  MessageSquareText,
  Users,
  Target,
  Layers,
  BarChart3,
  Activity,
  FlaskConical,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ── Mock Data ────────────────────────────────────────────────────────────────

const overviewStats = [
  { label: "Total Insights", value: 17, icon: FlaskConical },
  { label: "Active Themes", value: 4, icon: Target },
  { label: "Contributors", value: 8, icon: Users },
  { label: "Surface Areas", value: 5, icon: Layers },
];

const themes = [
  { title: "Recipe organization & collections", mentions: 47 },
  { title: "Ingredient-aware search", mentions: 34 },
  { title: "Nutrition visibility", mentions: 28 },
  { title: "Seasonal & contextual surfacing", mentions: 21 },
];

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const surfaceAreas = [
  { area: "Cookbook & Saved Recipes", frequency: 47, context: "Organization, folders, collections, bulk actions" },
  { area: "Search & Discovery", frequency: 34, context: "Ingredient-first, filters, contextual suggestions" },
  { area: "Recipe Cards", frequency: 28, context: "Nutrition data, comparison view, compact mode" },
  { area: "Creator Pages", frequency: 19, context: "Navigation, branding, cross-linking" },
  { area: "Import Pipeline", frequency: 14, context: "PDF parsing, error handling, unit normalization" },
];

const teamResearch = [
  {
    initials: "DT",
    color: "bg-indigo-600",
    team: "Design Team",
    date: "Feb 28, 2026",
    title: "Navigation patterns that reduce drop-off by 23%",
    summary:
      "Persistent bottom bar with save + share outperforms hamburger menus across every cohort. Mobile users engaged 23% more when actions stayed visible.",
  },
  {
    initials: "ET",
    color: "bg-emerald-600",
    team: "Eng Team",
    date: "Feb 25, 2026",
    title: "Recipe import pipeline: error rate dropped to 0.4%",
    summary:
      "Two-pass parser normalizes ingredient strings, then validates against unit dictionary. Import failures went from 3.1% to 0.4%.",
  },
];

const communityVoices = [
  {
    initials: "SL",
    color: "bg-rose-500",
    name: "Sarah Lin",
    role: "Community Leader",
    quote:
      "My audience keeps asking for a way to compare similar recipes side-by-side.",
    tags: ["Recipe Comparison", "UX"],
  },
  {
    initials: "MK",
    color: "bg-amber-500",
    name: "Marcus Kim",
    role: "Community Leader",
    quote:
      "The save button works great, but there's no way to organize saved recipes into folders.",
    tags: ["Collections", "Cookbook"],
  },
  {
    initials: "AW",
    color: "bg-violet-500",
    name: "Alex W.",
    role: "Member",
    quote:
      "I wish I could filter by what I already have in my fridge.",
    tags: ["Search", "Ingredients"],
  },
  {
    initials: "RD",
    color: "bg-sky-500",
    name: "Rachel D.",
    role: "Member",
    quote:
      "Love the recipe cards but the nutrition info is hard to find.",
    tags: ["Nutrition", "Cards"],
  },
];

const activityTimeline = [
  { type: "research", icon: FlaskConical, title: "Navigation patterns that reduce drop-off by 23%", source: "Design Team", date: "Feb 28" },
  { type: "voice", icon: MessageSquareText, title: "Recipe comparison request from Sarah Lin", source: "Community Leader", date: "Feb 27" },
  { type: "research", icon: FlaskConical, title: "Recipe import pipeline: error rate dropped to 0.4%", source: "Eng Team", date: "Feb 25" },
  { type: "theme", icon: TrendingUp, title: "Recipe organization & collections trending up", source: "47 mentions", date: "Feb 24" },
  { type: "voice", icon: MessageSquareText, title: "Collections feedback from Marcus Kim", source: "Community Leader", date: "Feb 23" },
  { type: "surface", icon: Layers, title: "Search & Discovery surface area identified", source: "34 mentions", date: "Feb 22" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchReferencePage() {
  const maxMentions = Math.max(...themes.map((t) => t.mentions));

  return (
    <div className="flex justify-center min-w-0 pt-6 pb-12 px-4">
      <div className="flex gap-6 items-start justify-center">
        {/* ── Left Column: Header + Stats + Timeline ─────────── */}
        <div className="w-[320px] shrink-0 sticky top-6 space-y-4">
          {/* Page Header */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">Research</h2>
              <Badge variant="outline" className="text-[10px]">Reference</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Static reference — insights aggregated from teams, community leaders, and members.
            </p>
          </div>

          {/* ── Overview Stats ───────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {overviewStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                    <stat.icon className="size-5 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* ── Activity Timeline ─────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
              </div>
              <CardDescription>Latest entries across all categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {activityTimeline.map((entry, i) => (
                  <div
                    key={`${entry.title}-${i}`}
                    className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0"
                  >
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <entry.icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug truncate">{entry.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.source}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {entry.date}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Content Cards ──────────────────────── */}
        <div className="w-[600px] min-w-0 space-y-4">
          {/* Top Themes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Top Themes</CardTitle>
              </div>
              <CardDescription>By mention count across all sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {themes.map((theme, i) => (
                <div key={theme.title} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2">{theme.title}</span>
                    <span className="text-muted-foreground font-medium tabular-nums shrink-0">
                      {theme.mentions}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(theme.mentions / maxMentions) * 100}%`,
                        backgroundColor: chartColors[i % chartColors.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Surface Areas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Surface Areas</CardTitle>
              </div>
              <CardDescription>Product areas by frequency of mention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {surfaceAreas.map((area, i) => (
                <div key={area.area} className="flex items-stretch gap-3">
                  <div
                    className="flex items-center justify-center rounded-md w-12 shrink-0 text-sm font-bold"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${chartColors[i % chartColors.length]} 15%, transparent)`,
                      color: chartColors[i % chartColors.length],
                    }}
                  >
                    {area.frequency}x
                  </div>
                  <div className="min-w-0 py-0.5">
                    <p className="text-sm font-medium leading-snug">{area.area}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{area.context}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Team Research */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Team Research</CardTitle>
              </div>
              <CardDescription>Latest findings from internal teams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamResearch.map((entry) => (
                <div key={entry.title} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${entry.color}`}
                    >
                      {entry.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {entry.team} &middot; {entry.date}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{entry.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {entry.summary}
                  </p>
                  <Separator className="!mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Community Voices */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Community Voices</CardTitle>
              </div>
              <CardDescription>Leaders and member feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {communityVoices.map((voice) => (
                <div key={voice.name} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${voice.color}`}
                    >
                      {voice.initials}
                    </div>
                    <span className="text-sm font-medium">{voice.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {voice.role}
                    </Badge>
                  </div>
                  <blockquote className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    &ldquo;{voice.quote}&rdquo;
                  </blockquote>
                  <div className="flex gap-1.5 flex-wrap">
                    {voice.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="!mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
