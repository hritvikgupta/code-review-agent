"""
Prompts for all code review agents.

This module contains all agent prompts centralized for better organization.
"""

from src.code_review_agent.prompts.prompts import (
    ANALYZER_AGENT_PROMPT,
    VALIDATOR_AGENT_PROMPT,
    SUMMARIZER_AGENT_PROMPT,
    FETCH_AGENT_PROMPT,
    SUPERVISOR_PROMPT,
)

__all__ = [
    "ANALYZER_AGENT_PROMPT",
    "VALIDATOR_AGENT_PROMPT",
    "SUMMARIZER_AGENT_PROMPT",
    "FETCH_AGENT_PROMPT",
    "SUPERVISOR_PROMPT",
]

