from crewai import Task, Agent


def create_recommend_solution_task(agent: Agent, context: dict) -> Task:
    """
    Designer proposes 2-3 ideas to validate the highest-risk assumption.
    Output: specific interactions to test.
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    constraints = context.get("constraints", {})
    exploration_data = context.get("research_data", {})
    user_segment = context.get("user_segment", "")

    has_exploration = bool(exploration_data.get("prototypes_tested") or exploration_data.get("images"))

    constraint_str = ""
    if constraints:
        constraint_str = "Hard constraints: " + ", ".join(f"{k}={v}" for k, v in constraints.items())

    description = f"""You are a Product Designer. Propose 2-3 ideas to test the highest-risk assumption.

**Input:**
Problem: {problem}
Metric: {metric}
User segment: {user_segment}
{constraint_str}

**Check:**
1. Does this respect hard constraints? If not, name the conflict.
2. Is there prior exploration?
   - If yes: build on consensus, explain if deviating
   - If no: discovery mode (solutions are provocations)

**For each of 2-3 ideas:**
1. **Specific change** — what exactly changes in UI/flow (be concrete)
2. **Assumption being tested** — what user behavior must be true
3. **Trade-off** — what we give up
4. **Feasibility** — engineering lift
5. **Prototype first** — smallest thing to build and test

**Close with:**
"The objective this serves is [X]. If someone disagrees, the trade-off is: [alternative] means giving up [specific thing]."

Write direct. Concrete. No generic improvements."""

    return Task(
        description=description,
        expected_output=(
            "2–3 specific ideas with: change / assumption / trade-off / feasibility / prototype priority. "
            "Close with objective and trade-off anchor."
        ),
        agent=agent,
    )
