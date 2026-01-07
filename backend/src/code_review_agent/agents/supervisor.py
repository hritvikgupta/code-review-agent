"""
Supervisor Agent - Coordinates the specialized agents for code review.

This agent orchestrates:
- Analyzer Agent: Explains what code does and how it works
- Validator Agent: Finds issues and suggests improvements
"""
import os
import time
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

# Lazy-loaded agents (created on first use)
# _fetch_agent = None  # COMMENTED OUT - Fetch agent not used in graph nodes
_analyzer_agent = None
_validator_agent = None


# ============================================================================
# FETCH AGENT - COMMENTED OUT (not used in graph nodes)
# ============================================================================
# def _get_fetch_agent():
#     """Lazily create and return the fetch agent."""
#     global _fetch_agent
#     if _fetch_agent is None:
#         from src.code_review_agent.agents.fetch_agent import create_fetch_agent
#         _fetch_agent = create_fetch_agent()
#     return _fetch_agent


def _get_analyzer_agent():
    """Lazily create and return the analyzer agent."""
    global _analyzer_agent
    if _analyzer_agent is None:
        from src.code_review_agent.agents.analyzer_agent import create_analyzer_agent
        _analyzer_agent = create_analyzer_agent()
    return _analyzer_agent


def _get_validator_agent():
    """Lazily create and return the validator agent."""
    global _validator_agent
    if _validator_agent is None:
        from src.code_review_agent.agents.validator_agent import create_validator_agent
        _validator_agent = create_validator_agent()
    return _validator_agent


# ============================================================================
# FETCH_CODE TOOL - COMMENTED OUT (not used in graph nodes)
# ============================================================================
# @tool
# async def fetch_code(request: str) -> str:
#     """
#     Fetch code files or explore directory structure.
#     Use this when you need to read files or understand codebase layout.
#     
#     Args:
#         request: Natural language request like 'read main.py' or 'list the src folder'
#     
#     Returns:
#         File contents or directory listing
#     """
#     start_time = time.time()
#     agent = _get_fetch_agent()
#     result = await agent.ainvoke({"messages": [{"role": "user", "content": request}]})
#     elapsed = time.time() - start_time
#     print(f"[PERF] fetch_code took {elapsed:.2f}s")
#     last_message = result["messages"][-1]
#     return last_message.content if hasattr(last_message, 'content') else str(last_message)


@tool
async def analyze_code(request: str) -> str:
    """
    Analyze and explain code structure and behavior.
    Use this to understand what code does and how it works.
    
    Args:
        request: The code to analyze OR a request like 'explain this function'
    
    Returns:
        Detailed explanation of the code
    """
    start_time = time.time()
    agent = _get_analyzer_agent()
    result = await agent.ainvoke({"messages": [{"role": "user", "content": request}]})
    elapsed = time.time() - start_time
    print(f"[PERF] analyze_code took {elapsed:.2f}s")
    last_message = result["messages"][-1]
    return last_message.content if hasattr(last_message, 'content') else str(last_message)


@tool
async def validate_code(request: str) -> str:
    """
    Validate code for issues and suggest improvements.
    Use this to find bugs, antipatterns, and improvement opportunities.
    
    Args:
        request: The code to validate OR a request like 'check this for issues'
    
    Returns:
        List of issues and improvement suggestions
    """
    start_time = time.time()
    agent = _get_validator_agent()
    result = await agent.ainvoke({"messages": [{"role": "user", "content": request}]})
    elapsed = time.time() - start_time
    print(f"[PERF] validate_code took {elapsed:.2f}s")
    last_message = result["messages"][-1]
    return last_message.content if hasattr(last_message, 'content') else str(last_message)


# ============================================================================
# SUPERVISOR CODE - COMMENTED OUT (not used in graph nodes)
# ============================================================================
# Supervisor prompt is now imported from centralized prompts module
# from src.code_review_agent.prompts.prompts import SUPERVISOR_PROMPT
#
# If you uncomment the supervisor code below, uncomment the import above as well.
#
# SUPERVISOR_PROMPT is defined in: src/code_review_agent/prompts/prompts.py
#
#
# # Tools exposed by the supervisor
# supervisor_tools = [fetch_code, analyze_code, validate_code]
#
#
# def create_supervisor_agent(llm: ChatOpenAI = None):
#     """Create and return the supervisor agent."""
#     if llm is None:
#         llm = ChatOpenAI(
#             model=os.getenv("OPENAI_MODEL", "gpt-4o"),
#         )
#     
#     agent = create_react_agent(
#         model=llm,
#         tools=supervisor_tools,
#         prompt=SUPERVISOR_PROMPT
#     )
#     return agent
