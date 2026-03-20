# JSON Schema Validation — Keeping Agent Outputs Consistent

**Purpose:** Document how Carrier enforces structured outputs from agents and prevents agent drift.

**Why this matters:** Without validation, agents naturally **drift** — they change output format, add/remove fields, change confidence levels. Validation locks outputs to a contract that the UI, database, and downstream agents expect.

---

## The Problem Agent Drift

When agents run freely without constraints, outputs become unreliable:

❌ **Bad:** Agent outputs different field names in runs 1, 2, and 3
```json
// Run 1
{ "insights": [...], "confidence": "high" }

// Run 2
{ "findings": [...], "confidence_level": "high" }

// Run 3
{ "observations": [...] }  // missing confidence entirely
```

✅ **Good:** Agent always outputs the same schema
```json
// All runs
{ "what_we_know": [...], "assumption_status": [...], "highest_risk_assumption": "..." }
```

**Cost of drift:**
- UI crashes when expected fields are missing
- Downstream agents receive inconsistent inputs
- Synthesis cards can't render
- Database constraints violated

---

## How It Works

### 1. **Agents Write JSON (Not Natural Language)**

Each agent is instructed to output **valid JSON only**:

```
You MUST output valid JSON matching this schema:
{
  "status": "pass" or "fail",
  "strategic_frame": {...},
  "assumptions": [...],
  ...
}

Output ONLY the JSON. No preamble, no explanation.
```

**Why JSON not text:** Text is ambiguous. "I found 3 insights" could be structured 100 ways. JSON is unambiguous.

### 2. **Extract JSON from LLM Output**

The LLM might output the JSON in a markdown code block or with extra text:

```python
# Raw LLM output
"Here are the findings:
```json
{
  "what_we_know": [...],
  "highest_risk_assumption": "..."
}
```"
```

The extraction function finds the JSON:

```python
def extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON from text, handling markdown code blocks."""
    markdown_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if markdown_match:
        return json.loads(markdown_match.group(1))

    # Fall back to raw JSON
    json_match = re.search(r"\{[\s\S]*\}", text)
    if json_match:
        return json.loads(json_match.group(0))

    raise ValueError(f"No JSON found in output: {text[:200]}")
```

**Location:** `crew/schemas.py:11-30`

### 3. **Validate Against Schema**

Three validation functions ensure outputs match expected structure:

```python
def validate_pm_output(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate PM output schema."""
    required_fields = ["status", "strategic_frame", "business_case", "assumptions", "constraints", "tradeoff"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Validate status enum
    if data["status"] not in ["pass", "fail"]:
        raise ValueError(f"Invalid status: {data['status']}")

    # If gate failed, require gaps array
    if data["status"] == "fail" and "gaps" not in data:
        raise ValueError("status=fail requires 'gaps' array")

    # Validate nested structures only if status is pass
    if data["status"] == "pass":
        for assumption in data["assumptions"]:
            if assumption["risk"] not in ["HIGH", "MED", "LOW"]:
                raise ValueError(f"Invalid risk level: {assumption['risk']}")

    return data
```

**Location:** `crew/schemas.py:33-62` (PM), `65-86` (Research), `89-113` (Design)

### 4. **Chain Validation Through Crew**

In `crew/crew.py`, each agent's output is validated before passing to the next agent:

```python
# STEP 1: PM runs and outputs JSON
pm_output_raw = str(pm_crew.kickoff())

# Validate immediately
try:
    pm_output = parse_and_validate_pm(pm_output_raw)
except Exception as e:
    print(f"❌ PM VALIDATION ERROR: {e}")
    raise ValueError(f"PM output validation failed: {str(e)}")

# GATE CHECK: PM can fail
if pm_output.get("status") == "fail":
    return { "pm_frame": pm_output, "research_synthesis": None, ... }

# STEP 2: Research receives PM's validated output
research_context = base_context.copy()
research_context["pm_assumptions"] = pm_output.get("assumptions", [])
research_output_raw = str(research_crew.kickoff())

# Validate Research output
try:
    research_output = parse_and_validate_research(research_output_raw)
except Exception as e:
    raise ValueError(f"Research output validation failed: {str(e)}")

# Continue to Designer...
```

**Location:** `crew/crew.py:74-145`

---

## Agent Output Schemas

### PM Agent Output

**File:** `crew/schemas.py:33-62`

**Schema:**
```json
{
  "status": "pass" | "fail",

  // If status = "pass", include these:
  "strategic_frame": {
    "problem": "string",
    "user": "string",
    "outcome": "string"
  },
  "business_case": "string",
  "assumptions": [
    {
      "statement": "string",
      "risk": "HIGH" | "MED" | "LOW",
      "falsifier": "string (only if HIGH risk)"
    }
  ],
  "constraints": {
    "timeline": "string",
    "technical": "string",
    "scope": "string"
  },
  "tradeoff": "string",

  // If status = "fail", include these:
  "gaps": [
    {
      "field": "user_segment" | "metric" | "why_now" | ...,
      "explanation": "string"
    }
  ]
}
```

**Validation rules:**
- `status` must be "pass" or "fail" (enum)
- `strategic_frame` required if pass, must have all 3 fields
- `assumptions` must have `statement` and `risk` for each item
- `risk` must be "HIGH", "MED", or "LOW"
- HIGH-risk assumptions must include `falsifier` (what would prove us wrong)
- If status="fail", must include `gaps` array explaining why

**Why these fields:**
- `status` allows graceful gate failures (we don't design against invalid problems)
- `strategic_frame` is the problem statement the team works from
- `assumptions` with risk levels help Research prioritize what to pressure-test
- `falsifier` on HIGH-risk assumptions helps Designer know what to prototype

---

### Research Agent Output

**File:** `crew/schemas.py:65-86`

**Schema:**
```json
{
  "what_we_know": [
    {
      "finding": "string",
      "confidence": "Known" | "Probable" | "Assumed",
      "source": "string (data source, e.g., 'SQL result', 'interview')"
    }
  ],
  "what_we_dont_know": [
    {
      "gap": "string",
      "why_it_matters": "string"
    }
  ],
  "assumption_status": [
    {
      "assumption": "string (from PM)",
      "status": "confirm" | "contradict" | "inconclusive",
      "evidence": "string"
    }
  ],
  "highest_risk_assumption": "string (the one assumption that, if wrong, breaks everything)",
  "next_step": "string (what to test next)"
}
```

**Validation rules:**
- `what_we_know` items must have `finding` and `confidence`
- `confidence` must be "Known", "Probable", or "Assumed"
- `assumption_status` items must have `assumption` and `status`
- `status` must be "confirm", "contradict", or "inconclusive"
- `highest_risk_assumption` cannot be empty (gates this field)

**Why these fields:**
- `confidence` prevents false certainty (signals when we're assuming vs. knowing)
- `assumption_status` pressure-tests PM's assumptions directly
- `highest_risk_assumption` is the **single question** the Designer focuses on
- `next_step` keeps momentum — always know what to test next

---

### Designer Agent Output

**File:** `crew/schemas.py:89-113`

**Schema:**
```json
{
  "ideas": [
    {
      "specific_change": "string (what exactly changes in the interface or flow)",
      "why": "string (which research finding or assumption this responds to)",
      "assumption_tested": "string (what user behavior must be true for this to work)",
      "tradeoff": "string (what you lose by choosing this over alternatives)",
      "second_order_effect": "string (one thing that could go wrong downstream)",
      "feasibility": "low" | "medium" | "high",
      "validation": "string (smallest prototype to test this assumption)"
    }
  ],
  "objective": "string (the objective this design serves)",
  "critique_anchor": {
    "alternative": "string (what we're not doing)",
    "tradeoff": "string (the cost of this choice)"
  }
}
```

**Validation rules:**
- `ideas` must be an array with at least 2 items (not one direction, multiple options)
- Each idea must have all 7 fields
- `feasibility` must be "low", "medium", or "high"
- `critique_anchor` must have both `alternative` and `tradeoff`

**Why these fields:**
- `specific_change` prevents vague recommendations ("improve UX" → "remove role selector step")
- `assumption_tested` connects design to Research's highest-risk assumption
- `feasibility` signals effort (low = 1-2 days, high = 2-4 weeks)
- `critique_anchor` gives the team a way to debate trade-offs productively

---

## What Happens When Validation Fails

### Scenario 1: Agent Output Missing Field

```
❌ VALIDATION ERROR:
Missing required field: highest_risk_assumption

Crew stops. Returns:
{
  "pm_frame": { ... valid ... },
  "research_synthesis": None,
  "design_recommendation": None,
  "stopped_at": "research_gate_failed"
}
```

**UI behavior:** "Research incomplete. Agent output missing critical field."

**How to fix:** Usually means the agent prompt changed or the LLM misunderstood the schema. Check:
1. Agent prompt in `crew/agents/research_insights.py`
2. Is the schema documented clearly in the prompt?
3. Try running again (LLM outputs can vary)

### Scenario 2: Invalid Enum Value

```
❌ VALIDATION ERROR:
Assumption 2 has invalid risk level: CRITICAL

crew/schemas.py expects: HIGH, MED, LOW
Got: CRITICAL
```

**How to fix:**
- Option A: Update schema to accept "CRITICAL" (change validation rule)
- Option B: Update agent prompt to use only HIGH/MED/LOW

**Choose based on:**
- If CRITICAL is a meaningful level → update schema + UI rendering
- If it's agent confusion → update prompt clarity

### Scenario 3: Malformed JSON

```
❌ JSON DECODE ERROR:
Expecting value: line 1 column 1 (char 0)

LLM output: "Here are my findings: {incomplete json"
```

**How to fix:**
1. The extraction regex didn't find valid JSON
2. Agent didn't output JSON as instructed
3. Likely the agent prompt is unclear or the LLM is chatty

**Solutions:**
- Make prompt more strict: "Output ONLY valid JSON. No other text."
- Try a better-structured prompt template
- Check if the agent task description is confusing

---

## Modifying Schemas

### When You Need to Add a Field

**Example:** PM agent should also output `target_audience_size`

**Steps:**

1. **Update schema validation:**
```python
# crew/schemas.py
def validate_pm_output(data: Dict[str, Any]) -> Dict[str, Any]:
    required_fields = [..., "target_audience_size"]  # Add here
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Add validation logic if needed
    if not isinstance(data["target_audience_size"], (int, str)):
        raise ValueError("target_audience_size must be a number or estimate")

    return data
```

2. **Update agent prompt:**
```python
# crew/agents/pm.py
# In the task description/expected_output, add:
"""
...
Output a JSON object with these fields:
- status: "pass" or "fail"
- strategic_frame: {problem, user, outcome}
- business_case: ...
- target_audience_size: "estimate or number, e.g., '10k creators' or '500'"
- assumptions: [...]
...
"""
```

3. **Update UI to handle new field:**
```typescript
// components/design/synthesis-cards/SynthesisCardBase.tsx
// Add rendering logic for target_audience_size
```

4. **Test end-to-end:**
```bash
source crew_venv/bin/activate
python crew/crew.py  # Test crew.py __main__ block
# Watch for new field in output
```

### When You Need to Change an Enum

**Example:** Change confidence levels from "Known/Probable/Assumed" to "High/Medium/Low"

**Steps:**

1. **Update schema:**
```python
# crew/schemas.py
if item["confidence"] not in ["High", "Medium", "Low"]:  # Changed
    raise ValueError(f"Invalid confidence: {item['confidence']}")
```

2. **Update agent prompt:**
```python
# crew/agents/research_insights.py
"""
Confidence levels:
- High: Observed in behavior, multiple sources
- Medium: Consistent self-report, one source
- Low: No data, logical inference only
"""
```

3. **Update card rendering:**
```typescript
// Map old values to new for backward compatibility (if needed)
const confidenceMap = {
  "Known": "High",
  "Probable": "Medium",
  "Assumed": "Low"
}
```

4. **Test with migration:**
```python
# If historical data exists, provide migration script:
def migrate_confidence_levels(old_data):
    for finding in old_data["what_we_know"]:
        finding["confidence"] = {
            "Known": "High",
            "Probable": "Medium",
            "Assumed": "Low"
        }[finding["confidence"]]
    return old_data
```

---

## Testing Validation

### Unit Test Example

```python
# crew/test_schemas.py
import pytest
from schemas import validate_pm_output

def test_pm_validation_requires_status():
    """PM output must have status field."""
    invalid = {"strategic_frame": {...}, "assumptions": [...]}
    with pytest.raises(ValueError, match="Missing required field: status"):
        validate_pm_output(invalid)

def test_pm_validation_passes():
    """Valid PM output passes validation."""
    valid = {
        "status": "pass",
        "strategic_frame": {"problem": "...", "user": "...", "outcome": "..."},
        "business_case": "...",
        "assumptions": [{"statement": "...", "risk": "HIGH", "falsifier": "..."}],
        "constraints": {...},
        "tradeoff": "..."
    }
    result = validate_pm_output(valid)
    assert result["status"] == "pass"

def test_pm_gate_fail():
    """PM can fail gates and stop crew."""
    pm_fails = {
        "status": "fail",
        "gaps": [{"field": "user_segment", "explanation": "Too broad"}]
    }
    result = validate_pm_output(pm_fails)
    assert result["status"] == "fail"
```

### Integration Test Example

```python
# Test the full crew with validation
from crew import run_crew

def test_crew_validates_all_outputs():
    """All three agents output valid JSON."""
    result = run_crew(
        stage="discovery",
        problem_statement="Users can't find X",
        user_segment="Mobile users",
        metric="Engagement rate"
    )

    # Validate PM output structure
    assert "status" in result["pm_frame"]
    assert "assumptions" in result["pm_frame"]

    # Validate Research output structure
    assert "what_we_know" in result["research_synthesis"]
    assert "highest_risk_assumption" in result["research_synthesis"]

    # Validate Design output structure
    assert "ideas" in result["design_recommendation"]
    assert len(result["design_recommendation"]["ideas"]) >= 2
```

---

## Debugging Validation Errors

### Common Error: "JSON DECODE ERROR"

**Cause:** Agent output isn't valid JSON
**Debug:**
1. Check the raw output logged in terminal
2. Copy the JSON and validate at jsonlint.com
3. Check if agent added commentary around JSON

**Fix:** Make agent prompt more strict:
```
You MUST output ONLY valid JSON.
No "Here is my output:" prefix.
No trailing explanation.
Just the JSON object, nothing else.
```

### Common Error: "Missing required field"

**Cause:** Agent forgot or was confused about required field
**Debug:**
1. Check which field is missing (error message tells you)
2. Search agent prompt for that field
3. Is it explained clearly?

**Fix:** Improve prompt clarity:
```
# Instead of:
"Include assumptions"

# Write:
"REQUIRED: Include 'assumptions' array with at least 3 items.
Each assumption must have:
- statement: the assumption
- risk: HIGH, MED, or LOW
- falsifier (if HIGH): what would prove us wrong"
```

### Common Error: "Invalid status: maybe"

**Cause:** Agent used unexpected value for enum field
**Debug:**
1. Check what values agent outputted
2. Are they reasonable? Should we accept them?

**Fix:** Either:
- Update schema to accept them: `["pass", "fail", "maybe"]`
- Update agent prompt to restrict: `Only "pass" or "fail", never "maybe"`

---

## Future Improvements

**Planned:**
- [ ] Streaming validation (validate as JSON streams in)
- [ ] Auto-correction on minor schema mismatches
- [ ] Validation coverage reporting (which schemas most often fail?)
- [ ] Agent prompt testing suite (test prompts against schema before deployment)
- [ ] Field-level confidence (highlight which fields the LLM was uncertain about)

---

## Key Takeaway

**Validation is not bureaucratic.** It's how we prevent agent drift and keep the system reliable. Every validation rule exists because:
1. The UI needs it to render (missing field = crash)
2. The next agent needs it to continue (malformed data = garbage output)
3. The database expects it (RLS policies enforce schema)

When you modify a schema or agent prompt, **test the full crew end-to-end** to ensure validation still passes.

