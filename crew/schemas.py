"""
JSON output schemas for crew agents.
Ensures consistent output format across PM, Research, and Designer agents.
"""

import json
import re
from typing import Any, Dict, List


def extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON from text, handling markdown code blocks and extra whitespace."""
    # Try to find JSON in markdown code blocks first
    markdown_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if markdown_match:
        json_str = markdown_match.group(1)
    else:
        # Try to find raw JSON
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            json_str = json_match.group(0)
        else:
            print(f"\n❌ NO JSON FOUND. Text: {text[:500]}\n")
            raise ValueError(f"No JSON found in output: {text[:200]}")

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"\n❌ JSON DECODE ERROR:\n{e}\nJSON string: {json_str[:500]}\n")
        raise


def validate_pm_output(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate PM output schema."""
    required_fields = ["status", "strategic_frame", "business_case", "assumptions", "constraints", "tradeoff"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    if data["status"] not in ["pass", "fail"]:
        raise ValueError(f"Invalid status: {data['status']}")

    if data["status"] == "fail" and "gaps" not in data:
        raise ValueError("status=fail requires 'gaps' array")

    # Validate strategic_frame
    for key in ["problem", "user", "outcome"]:
        if key not in data["strategic_frame"]:
            raise ValueError(f"Missing strategic_frame.{key}")

    # Validate assumptions
    for i, assumption in enumerate(data["assumptions"]):
        if "statement" not in assumption or "risk" not in assumption:
            raise ValueError(f"Assumption {i} missing statement or risk")
        if assumption["risk"] not in ["HIGH", "MED", "LOW"]:
            raise ValueError(f"Assumption {i} has invalid risk level: {assumption['risk']}")
        if assumption["risk"] == "HIGH" and "falsifier" not in assumption:
            raise ValueError(f"HIGH risk assumption {i} missing falsifier")

    return data


def validate_research_output(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate Research output schema."""
    required_fields = ["what_we_know", "what_we_dont_know", "assumption_status", "highest_risk_assumption", "next_step"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Validate what_we_know
    for i, item in enumerate(data["what_we_know"]):
        if "finding" not in item or "confidence" not in item:
            raise ValueError(f"what_we_know[{i}] missing finding or confidence")
        if item["confidence"] not in ["Known", "Probable", "Assumed"]:
            raise ValueError(f"what_we_know[{i}] has invalid confidence: {item['confidence']}")

    # Validate assumption_status
    for i, item in enumerate(data["assumption_status"]):
        if "assumption" not in item or "status" not in item:
            raise ValueError(f"assumption_status[{i}] missing assumption or status")
        if item["status"] not in ["confirm", "contradict", "inconclusive"]:
            raise ValueError(f"assumption_status[{i}] has invalid status: {item['status']}")

    return data


def validate_design_output(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate Design output schema."""
    required_fields = ["ideas", "objective", "critique_anchor"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    if not isinstance(data["ideas"], list) or len(data["ideas"]) < 2:
        raise ValueError("ideas must be an array with at least 2 items")

    # Validate each idea
    idea_fields = ["specific_change", "why", "assumption_tested", "tradeoff", "second_order_effect", "feasibility", "validation"]
    for i, idea in enumerate(data["ideas"]):
        for field in idea_fields:
            if field not in idea:
                raise ValueError(f"ideas[{i}] missing {field}")
        if idea["feasibility"] not in ["low", "medium", "high"]:
            raise ValueError(f"ideas[{i}] has invalid feasibility: {idea['feasibility']}")

    # Validate critique_anchor
    for field in ["alternative", "tradeoff"]:
        if field not in data["critique_anchor"]:
            raise ValueError(f"critique_anchor missing {field}")

    return data


def parse_and_validate_pm(output: str) -> Dict[str, Any]:
    """Extract and validate PM output."""
    data = extract_json(output)
    return validate_pm_output(data)


def parse_and_validate_research(output: str) -> Dict[str, Any]:
    """Extract and validate Research output."""
    data = extract_json(output)
    return validate_research_output(data)


def parse_and_validate_design(output: str) -> Dict[str, Any]:
    """Extract and validate Design output."""
    data = extract_json(output)
    return validate_design_output(data)
