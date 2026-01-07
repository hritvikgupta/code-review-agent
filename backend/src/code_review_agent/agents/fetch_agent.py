"""
Fetch Agent - Reads files and explores codebase structure.
"""
import os
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from src.code_review_agent.tools.file_tools import read_file, list_directory, get_file_info
from src.code_review_agent.prompts.prompts import FETCH_AGENT_PROMPT


def create_fetch_agent(llm: ChatOpenAI = None):
    """Create and return the fetch agent."""
    if llm is None:
        llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        )
    
    tools = [read_file, list_directory, get_file_info]
    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=FETCH_AGENT_PROMPT
    )
    return agent
