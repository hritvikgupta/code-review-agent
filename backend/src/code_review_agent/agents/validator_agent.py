"""
Validator Agent - Finds issues and suggests improvements.
"""
import os
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from src.code_review_agent.tools.validation_tools import check_syntax, find_common_issues, suggest_improvements
from src.code_review_agent.prompts.prompts import VALIDATOR_AGENT_PROMPT


def create_validator_agent(llm: ChatOpenAI = None):
    """Create and return the validator agent."""
    if llm is None:
        llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        )
    
    tools = [check_syntax, find_common_issues, suggest_improvements]
    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=VALIDATOR_AGENT_PROMPT
    )
    return agent
