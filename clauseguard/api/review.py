from fastapi import APIRouter, Depends, HTTPException

from clauseguard.agents.review import ReviewAgent
from clauseguard.api.deps import get_review_agent
from clauseguard.models.report import RiskReport

router = APIRouter(prefix="/review", tags=["review"])


@router.post("/{contract_id}", response_model=RiskReport)
async def review_contract(
    contract_id: str,
    agent: ReviewAgent = Depends(get_review_agent),
):
    """Run compliance review on a contract and return risk report."""
    try:
        return await agent.review(contract_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
