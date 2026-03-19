import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { action } = await request.json();

  if (!action) {
    return Response.json({ error: "Missing action" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    if (action === "create_get_vote_count_rpc") {
      // Try to execute the RPC creation SQL via execute_sql function if it exists
      const { error } = await supabase.rpc("execute_sql", {
        sql: `
DROP FUNCTION IF EXISTS get_vote_count(UUID);

CREATE OR REPLACE FUNCTION get_vote_count(p_session_id UUID)
RETURNS INT AS $$
DECLARE
  vote_count INT;
BEGIN
  SELECT COUNT(DISTINCT voter_token)::INT INTO vote_count
  FROM voting_votes
  WHERE session_id = p_session_id;

  RETURN COALESCE(vote_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;
        `,
      });

      if (error) {
        // execute_sql doesn't exist, return instructions
        return Response.json(
          {
            success: false,
            message:
              "RPC function creation requires manual SQL execution in Supabase dashboard",
            instruction:
              "Go to SQL Editor and execute this SQL:",
            sql: `DROP FUNCTION IF EXISTS get_vote_count(UUID);

CREATE OR REPLACE FUNCTION get_vote_count(p_session_id UUID)
RETURNS INT AS $$
DECLARE
  vote_count INT;
BEGIN
  SELECT COUNT(DISTINCT voter_token)::INT INTO vote_count
  FROM voting_votes
  WHERE session_id = p_session_id;

  RETURN COALESCE(vote_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;`,
          },
          { status: 501 }
        );
      }

      return Response.json({
        success: true,
        message: "RPC function created successfully",
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        note: "You can create the RPC function manually in Supabase dashboard",
      },
      { status: 500 }
    );
  }
}
