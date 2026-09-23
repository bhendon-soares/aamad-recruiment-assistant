from __future__ import annotations

from functools import lru_cache

from fastapi import FastAPI, HTTPException

from app.crews.recruitment import ApplicationCrew
from app.models import CandidatePacketRequest, CandidatePacketResponse, GenerateRubricRequest, RoleRubric

app = FastAPI(
    title="Recruitment Assistant Backend",
    version="0.1.0",
    description="MVP CrewAI-backed API for role rubrics and candidate packets.",
)


@lru_cache
def get_application_crew() -> ApplicationCrew:
    return ApplicationCrew()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "runtime": "crewai"}


@app.get("/health", include_in_schema=False)
def legacy_health() -> dict[str, str]:
    return health()


@app.post("/api/rubrics/generate", response_model=RoleRubric)
def generate_rubric(request: GenerateRubricRequest) -> RoleRubric:
    try:
        return get_application_crew().generate_role_rubric(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/candidate-packets", response_model=CandidatePacketResponse)
def generate_candidate_packet(request: CandidatePacketRequest) -> CandidatePacketResponse:
    try:
        return get_application_crew().generate_candidate_packet(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
