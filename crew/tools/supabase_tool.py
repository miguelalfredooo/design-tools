import os
from datetime import datetime, timedelta
from crewai.tools import tool
from supabase import create_client


def _get_client():
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


@tool("Fetch Research Evidence")
def fetch_evidence(topic: str = "", days: int = 30) -> str:
    """Fetch research evidence from Supabase including observations, sessions, votes, and comments.
    Use this to gather user research data for synthesis.

    Args:
        topic: Optional topic or area to filter by (e.g., 'onboarding', 'checkout'). Leave empty for all.
        days: Number of days to look back. Default 30.
    """
    client = _get_client()
    cutoff = (datetime.now() - timedelta(days=days)).isoformat()

    # Fetch observations
    obs_query = client.table("research_observations").select("*").gte("created_at", cutoff)
    if topic:
        obs_query = obs_query.ilike("area", f"%{topic}%")
    obs_result = obs_query.execute()
    observations = obs_result.data or []

    # Fetch sessions
    sessions_result = client.table("voting_sessions").select("*").gte("created_at", cutoff).execute()
    sessions = sessions_result.data or []
    session_ids = [s["id"] for s in sessions]

    # Fetch options, votes, comments for those sessions
    options = []
    votes = []
    comments = []
    if session_ids:
        options_result = client.table("voting_options").select("*").in_("session_id", session_ids).execute()
        options = options_result.data or []

        votes_result = client.table("voting_votes").select("*").in_("session_id", session_ids).execute()
        votes = votes_result.data or []

        comments_result = client.table("design_comments").select("*").in_("session_id", session_ids).execute()
        comments = comments_result.data or []

    # Format into readable text
    parts = []

    if observations:
        parts.append(f"## Research Observations ({len(observations)} found)\n")
        for obs in observations:
            parts.append(
                f"- [{obs.get('area', 'General')}] {obs.get('body', '')}"
                f" (by {obs.get('contributor', 'anon')}, {obs.get('created_at', '')[:10]})"
            )

    if sessions:
        parts.append(f"\n## Design Sessions ({len(sessions)} found)\n")
        for s in sessions:
            s_opts = [o for o in options if o["session_id"] == s["id"]]
            s_votes = [v for v in votes if v["session_id"] == s["id"]]
            s_comments = [c for c in comments if c["session_id"] == s["id"]]

            parts.append(f"### Session: {s.get('title', 'Untitled')}")
            if s.get("description"):
                parts.append(f"Description: {s['description']}")
            if s.get("problem"):
                parts.append(f"Problem: {s['problem']}")
            if s.get("goal"):
                parts.append(f"Goal: {s['goal']}")

            for opt in s_opts:
                opt_votes = [v for v in s_votes if v.get("option_id") == opt["id"]]
                opt_comments = [c for c in s_comments if c.get("option_id") == opt["id"]]
                parts.append(f"\n  Option: {opt.get('title', '')} — {opt.get('description', '')}")
                parts.append(f"  Votes: {len(opt_votes)}")
                for v in opt_votes:
                    if v.get("comment"):
                        parts.append(f"    - {v.get('voter_name', 'anon')}: \"{v['comment']}\"")
                for c in opt_comments:
                    parts.append(f"    - {c.get('voter_name', 'anon')}: \"{c.get('body', '')}\"")

    if not parts:
        return "No evidence found for the given criteria. Try broadening the topic or date range."

    summary = (
        f"Evidence summary: {len(observations)} observations, {len(sessions)} sessions, "
        f"{len(votes)} votes, {len(comments)} comments (last {days} days)"
    )
    return summary + "\n\n" + "\n".join(parts)
