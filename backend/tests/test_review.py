"""요구사항 Review API 테스트 -- LLM 호출을 mock하여 review 엔드포인트 검증."""

import json
import uuid

import pytest
from unittest.mock import AsyncMock, patch


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_llm():
    """src.services.review_svc 내부에서 import된 chat_completion을 mock한다."""
    with patch("src.services.review_svc.chat_completion", new_callable=AsyncMock) as mock:
        yield mock


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def create_project(client) -> str:
    """테스트용 프로젝트를 생성하고 project_id를 반환한다."""
    resp = await client.post(
        "/api/v1/projects",
        json={"name": "테스트 프로젝트", "modules": ["requirements"]},
    )
    assert resp.status_code == 201 or resp.status_code == 200, f"프로젝트 생성 실패: {resp.text}"
    return resp.json()["project_id"]


async def create_requirement(client, project_id: str, text: str = "로봇이 멈춰야 한다", req_type: str = "fr") -> str:
    """테스트용 요구사항을 생성하고 requirement_id를 반환한다."""
    resp = await client.post(
        f"/api/v1/projects/{project_id}/requirements",
        json={"type": req_type, "original_text": text},
    )
    assert resp.status_code == 201 or resp.status_code == 200, f"요구사항 생성 실패: {resp.text}"
    return resp.json()["requirement_id"]


async def setup_project_with_requirements(client, count: int = 2) -> tuple[str, list[str]]:
    """프로젝트 + 요구사항 n건을 생성하고 (project_id, [requirement_ids]) 튜플을 반환한다."""
    project_id = await create_project(client)
    req_ids = []
    texts = [
        "시스템은 비상 정지 시 모든 동작을 중단해야 한다.",
        "시스템은 100ms 이내에 응답해야 한다.",
        "시스템은 비상 시 모든 프로세스를 정지해야 한다.",
    ]
    for i in range(count):
        req_id = await create_requirement(client, project_id, text=texts[i % len(texts)])
        req_ids.append(req_id)
    return project_id, req_ids


# ---------------------------------------------------------------------------
# Tests: /review/requirements
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_review_requirements(client, mock_llm):
    """정상적인 review 요청 -- issues + summary 반환."""
    project_id, req_ids = await setup_project_with_requirements(client, count=2)

    mock_llm.return_value = json.dumps({
        "issues": [
            {
                "type": "conflict",
                "severity": "high",
                "description": "req-001과 req-003이 충돌합니다.",
                "related_requirements": [req_ids[0], req_ids[1]],
                "suggestion": {
                    "target_id": req_ids[1],
                    "original_text": "시스템은 100ms 이내에 응답해야 한다.",
                    "suggested_text": "시스템은 200ms 이내에 응답해야 한다.",
                },
            }
        ],
        "summary": {
            "total_issues": 1,
            "conflicts": 1,
            "duplicates": 0,
            "ambiguities": 0,
            "ready_for_next": False,
            "feedback": "충돌 이슈가 있습니다.",
        },
    })

    resp = await client.post(
        f"/api/v1/projects/{project_id}/review/requirements",
        json={"requirement_ids": req_ids},
    )

    assert resp.status_code == 200
    body = resp.json()

    # issues 검증
    assert "issues" in body
    assert len(body["issues"]) == 1
    issue = body["issues"][0]
    assert issue["type"] == "conflict"
    assert issue["severity"] == "high"
    assert "issue_id" in issue
    assert len(issue["related_requirements"]) == 2
    assert issue["suggestion"] is not None
    assert issue["suggestion"]["target_id"] == req_ids[1]

    # summary 검증
    assert "summary" in body
    summary = body["summary"]
    assert summary["total_issues"] == 1
    assert summary["conflicts"] == 1
    assert summary["ready_for_next"] is False
    assert summary["feedback"] == "충돌 이슈가 있습니다."

    mock_llm.assert_awaited_once()


@pytest.mark.asyncio
async def test_review_no_requirements(client, mock_llm):
    """존재하지 않는 requirement_id로 review 요청 -- 404 에러."""
    project_id = await create_project(client)
    fake_id = str(uuid.uuid4())

    resp = await client.post(
        f"/api/v1/projects/{project_id}/review/requirements",
        json={"requirement_ids": [fake_id]},
    )

    assert resp.status_code == 404
    mock_llm.assert_not_awaited()


@pytest.mark.asyncio
async def test_review_llm_error(client, mock_llm):
    """review 시 LLM 호출 예외 -- 500 에러."""
    mock_llm.side_effect = Exception("Azure OpenAI timeout")

    project_id, req_ids = await setup_project_with_requirements(client, count=2)
    resp = await client.post(
        f"/api/v1/projects/{project_id}/review/requirements",
        json={"requirement_ids": req_ids},
    )

    assert resp.status_code == 500


@pytest.mark.asyncio
async def test_review_invalid_json(client, mock_llm):
    """review 시 LLM이 유효하지 않은 JSON 반환 -- 502 에러."""
    mock_llm.return_value = "이것은 JSON이 아닙니다"

    project_id, req_ids = await setup_project_with_requirements(client, count=2)
    resp = await client.post(
        f"/api/v1/projects/{project_id}/review/requirements",
        json={"requirement_ids": req_ids},
    )

    assert resp.status_code == 502


@pytest.mark.asyncio
async def test_review_no_issues(client, mock_llm):
    """이슈가 없는 경우 -- 빈 배열 + ready_for_next=true."""
    project_id, req_ids = await setup_project_with_requirements(client, count=2)

    mock_llm.return_value = json.dumps({
        "issues": [],
        "summary": {
            "total_issues": 0,
            "conflicts": 0,
            "duplicates": 0,
            "ambiguities": 0,
            "ready_for_next": True,
            "feedback": "모든 요구사항이 명확하고 일관적입니다.",
        },
    })

    resp = await client.post(
        f"/api/v1/projects/{project_id}/review/requirements",
        json={"requirement_ids": req_ids},
    )

    assert resp.status_code == 200
    body = resp.json()

    assert body["issues"] == []
    assert body["summary"]["total_issues"] == 0
    assert body["summary"]["ready_for_next"] is True
    assert body["summary"]["feedback"] == "모든 요구사항이 명확하고 일관적입니다."

    mock_llm.assert_awaited_once()


@pytest.mark.asyncio
async def test_review_invalid_uuid(client, mock_llm):
    """유효하지 않은 UUID 형식의 requirement_id -- 400 에러."""
    project_id = await create_project(client)

    resp = await client.post(
        f"/api/v1/projects/{project_id}/review/requirements",
        json={"requirement_ids": ["not-a-uuid"]},
    )

    assert resp.status_code == 400
    mock_llm.assert_not_awaited()
