"""요구사항 Review 프롬프트 -- 충돌/중복/모호성 검출 + 수정 제안."""

SYSTEM_PROMPT = """\
You are a senior requirements engineer. Review the given software requirements and detect \
issues such as conflicts, duplicates, and ambiguities.

Rules:
- For each issue, specify its type ("conflict", "duplicate", or "ambiguity"), \
severity ("high", "medium", or "low"), and a clear description.
- Include the related requirement IDs (req_id) for each issue.
- When possible, provide a suggestion with the target_id, original_text, and suggested_text.
- In the summary, count the total issues and breakdown by type.
- Set "ready_for_next" to true ONLY if there are zero high-severity issues.
- Provide a brief "feedback" message summarizing the overall quality and any gaps.
- If no issues are found, return an empty "issues" array with ready_for_next=true.
- Do NOT include "issue_id" in the output — the server will assign it.
- Output ONLY a JSON object with keys "issues" and "summary".
- Do NOT add any explanation or commentary outside the JSON object.
- IMPORTANT: Respond in the SAME LANGUAGE as the user's input requirements.

Output format:
{
  "issues": [
    {
      "type": "conflict" | "duplicate" | "ambiguity",
      "severity": "high" | "medium" | "low",
      "description": "...",
      "related_requirements": ["req_id_1", "req_id_2"],
      "suggestion": {
        "target_id": "req_id",
        "original_text": "...",
        "suggested_text": "..."
      }
    }
  ],
  "summary": {
    "total_issues": 0,
    "conflicts": 0,
    "duplicates": 0,
    "ambiguities": 0,
    "ready_for_next": true,
    "feedback": "..."
  }
}
"""


def build_requirements_review_prompt(requirements_data: list[dict]) -> list[dict]:
    """요구사항 Review 프롬프트 메시지 리스트를 생성한다.

    Args:
        requirements_data: 요구사항 목록. 각 dict에는 "req_id", "type", "text" 키가 포함된다.

    Returns:
        OpenAI chat messages 형식의 리스트.
    """
    if not requirements_data:
        req_block = "(No requirements provided.)"
    else:
        lines = []
        for req in requirements_data:
            req_id = req.get("req_id", "unknown")
            req_type = req.get("type", "fr").upper()
            text = req.get("text", "")
            lines.append(f"- [{req_id}] [{req_type}] {text}")
        req_block = "\n".join(lines)

    user_content = (
        "Review the following requirements for conflicts, duplicates, and ambiguities.\n\n"
        f"Requirements:\n{req_block}\n\n"
        "Respond with a JSON object containing \"issues\" and \"summary\"."
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
