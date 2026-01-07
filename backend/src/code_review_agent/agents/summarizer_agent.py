"""
Summarizer Agent - Combines validation and analyzer results into a comprehensive summary.
"""
import os
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from src.code_review_agent.prompts.prompts import SUMMARIZER_AGENT_PROMPT


def create_summarizer_agent(llm: ChatOpenAI = None):
    """Create and return the summarizer agent."""
    if llm is None:
        llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        )
    
    # Summarizer doesn't need tools, just LLM for text summarization
    agent = create_react_agent(
        model=llm,
        tools=[],  # No tools needed for summarization
        prompt=SUMMARIZER_AGENT_PROMPT
    )
    return agent

