import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const SAMPLE_BRIEF = {
  name: "Creator Publishing & Growth Tools",
  description:
    "Research initiative to understand how creators discover, adopt, and retain publishing features — and what drives them to grow their audience on the platform.",
  problem_statement:
    "Why do content creators stop using advanced publishing features after initial setup, and what gaps in the experience prevent them from posting consistently?",
  idea:
    "Creators want scheduling and performance feedback but abandon the tools when setup friction is high or when the payoff (audience response) isn't visible quickly enough. Teams posting together face an additional trust barrier around attribution.",
  what_we_are_building:
    "Scheduled posts\nPerformance dashboard\nEngagement prompts\nTeam posting with attribution\nPost streak / consistency nudges",
  assumptions:
    "Creators want scheduling but won't use it if setup takes more than 2 steps\nTeam posting needs clear attribution or primary creators won't share access\nPerformance data only motivates creators if it shows audience growth, not just views\nLapsed creators return when they see peers succeeding, not from feature nudges\nNew users need a first-post win before they explore advanced tools",
  out_of_scope:
    "Cross-posting from external platforms (Twitter, Substack)\nContent monetization or gating features\nCreator onboarding (covered in separate initiative)\nReader-facing discovery or feed improvements",
  metrics: "Creator Acquisition · Return Rate / Total Visitors",
};

const SAMPLE_OBSERVATIONS = [
  // Content Creators — active creators using publishing tools
  { area: "Publishing", body: "Active content creator hovered over the schedule post button for 8 seconds then closed the modal without saving — said they weren't sure when it would go out." },
  { area: "Publishing", body: "Content creator scheduled a post then deleted it 10 minutes later — said they weren't confident it was ready and worried about looking inconsistent to their audience." },
  { area: "Performance", body: "Content creator had Mixpanel open in a separate tab the entire session — said in-app stats felt incomplete and too hard to act on compared to external tools." },
  { area: "Performance", body: "Active creator said 'I need to know which topics my audience responds to most' — uses post performance to decide what to write next but can't see topic-level breakdowns." },
  { area: "Engagement", body: "Content creator abandoned a draft mid-session after receiving no engagement on their previous post. Said 'what's the point right now' and closed the tab." },

  // Community Members — engaged readers and commenters
  { area: "Engagement", body: "Community member asked why they couldn't see who else had commented before replying — said it made their responses feel disconnected and less relevant." },
  { area: "Engagement", body: "Community member said they only engage with posts when they feel like the creator will actually respond — no reply history on a creator's profile reduces their motivation." },
  { area: "Publishing", body: "Community member who occasionally publishes said they didn't know the difference between a 'post' and a 'note' — unclear content types caused hesitation." },

  // New Users — first-time users in early setup
  { area: "Onboarding", body: "New user completed the setup flow but never published — exited after seeing an empty dashboard with no clear prompt for what to do next." },
  { area: "Onboarding", body: "New creator said they felt overwhelmed by the number of settings visible on first login — 'I just want to write something, not configure everything.'" },
  { area: "Publishing", body: "New user spent 3 minutes searching for the preview option before publishing. Eventually published without previewing — said they assumed it would look different." },
  { area: "Performance", body: "After publishing their first post, new creator immediately asked 'where do I see how many people actually read this?' — no post-publish confirmation or stats nudge." },

  // Regular Members — consistent but moderate publishers
  { area: "Engagement", body: "Regular member mentioned they only post when they see peers posting — social proof from the community drives their own publishing cadence more than any platform prompt." },
  { area: "Publishing", body: "3 out of 5 regular creators tested did not realize drafts auto-saved. Two re-typed content they thought was lost after accidentally closing the tab." },
  { area: "Performance", body: "Regular creator said 'I don't know what a good open rate looks like' when viewing the stats dashboard — no benchmarks or context provided alongside the numbers." },

  // Lapsed Users — previously active, now dormant
  { area: "Performance", body: "Lapsed creator returned to the platform after receiving a weekly digest email showing their historical post performance — said seeing the data surprised them and made them want to try again." },
  { area: "Engagement", body: "Lapsed creator said they stopped posting after a 3-week gap because 'it felt like starting over' — no continuity cue or streak recovery prompt existed." },
  { area: "Onboarding", body: "Lapsed user said they came back to try scheduling but couldn't find where they'd left off — no resumable draft or re-engagement prompt on the dashboard." },

  // Super Users — power users with high-volume or team needs
  { area: "Team", body: "Super user managing a team account complained attribution wasn't clear when multiple contributors posted — couldn't tell who wrote what in the activity history." },
  { area: "Team", body: "Super user requested bulk scheduling for a content calendar spanning 4 weeks — currently manually queues each post one at a time and called it 'completely unsustainable.'" },
  { area: "Publishing", body: "Super user asked whether they could set different publishing rules per contributor — wanted senior editors to publish directly but junior contributors to go through review." },
];

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();

  // Update brief fields
  const { error: briefError } = await db
    .from("research_projects")
    .update({ ...SAMPLE_BRIEF, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (briefError) {
    return NextResponse.json({ error: briefError.message }, { status: 500 });
  }

  // Delete existing observations for this project and re-seed
  await db.from("research_observations").delete().eq("project_id", id);

  const { error: obsError } = await db.from("research_observations").insert(
    SAMPLE_OBSERVATIONS.map((o) => ({
      ...o,
      project_id: id,
      contributor: "seed-data",
    }))
  );

  if (obsError) {
    return NextResponse.json({ error: obsError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, observationCount: SAMPLE_OBSERVATIONS.length });
}
