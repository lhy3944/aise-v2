"""Glossary CRUD API 테스트"""

import pytest
import uuid


async def create_test_project(client) -> str:
    """테스트용 프로젝트 생성 헬퍼"""
    resp = await client.post(
        "/api/v1/projects",
        json={"name": "Glossary 테스트", "modules": ["requirements"]},
    )
    assert resp.status_code == 201
    return resp.json()["project_id"]


async def create_test_glossary(client, project_id: str, **kwargs) -> dict:
    """테스트용 용어 생성 헬퍼"""
    body = {
        "term": kwargs.get("term", "EMS"),
        "definition": kwargs.get("definition", "Emergency Stop - 비상 정지 기능"),
        "product_group": kwargs.get("product_group", "robotics"),
    }
    resp = await client.post(
        f"/api/v1/projects/{project_id}/glossary",
        json=body,
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_create_glossary(client):
    """POST /glossary -> 201, glossary_id/term/definition"""
    project_id = await create_test_project(client)

    resp = await client.post(
        f"/api/v1/projects/{project_id}/glossary",
        json={
            "term": "EMS",
            "definition": "Emergency Stop - 비상 정지 기능",
            "product_group": "robotics",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "glossary_id" in body
    assert body["term"] == "EMS"
    assert body["definition"] == "Emergency Stop - 비상 정지 기능"
    assert body["product_group"] == "robotics"


@pytest.mark.asyncio
async def test_list_glossary(client):
    """GET /glossary -> 200, glossary 배열"""
    project_id = await create_test_project(client)
    await create_test_glossary(client, project_id, term="EMS", definition="Emergency Stop")
    await create_test_glossary(client, project_id, term="PLC", definition="Programmable Logic Controller")

    resp = await client.get(f"/api/v1/projects/{project_id}/glossary")
    assert resp.status_code == 200
    body = resp.json()
    assert "glossary" in body
    assert isinstance(body["glossary"], list)
    assert len(body["glossary"]) == 2


@pytest.mark.asyncio
async def test_update_glossary(client):
    """PUT /glossary/{id} -> 200"""
    project_id = await create_test_project(client)
    glossary = await create_test_glossary(client, project_id)
    glossary_id = glossary["glossary_id"]

    resp = await client.put(
        f"/api/v1/projects/{project_id}/glossary/{glossary_id}",
        json={"definition": "수정된 정의", "product_group": "automotive"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["definition"] == "수정된 정의"
    assert body["product_group"] == "automotive"
    # 변경하지 않은 필드는 유지
    assert body["term"] == "EMS"


@pytest.mark.asyncio
async def test_delete_glossary(client):
    """DELETE /glossary/{id} -> 204"""
    project_id = await create_test_project(client)
    glossary = await create_test_glossary(client, project_id)
    glossary_id = glossary["glossary_id"]

    resp = await client.delete(
        f"/api/v1/projects/{project_id}/glossary/{glossary_id}"
    )
    assert resp.status_code == 204

    # 삭제 후 목록에서 사라졌는지 확인
    resp = await client.get(f"/api/v1/projects/{project_id}/glossary")
    assert resp.status_code == 200
    assert len(resp.json()["glossary"]) == 0


@pytest.mark.asyncio
async def test_delete_glossary_not_found(client):
    """DELETE /glossary/{fake-uuid} -> 404"""
    project_id = await create_test_project(client)
    fake_id = str(uuid.uuid4())

    resp = await client.delete(
        f"/api/v1/projects/{project_id}/glossary/{fake_id}"
    )
    assert resp.status_code == 404
    assert "detail" in resp.json()
