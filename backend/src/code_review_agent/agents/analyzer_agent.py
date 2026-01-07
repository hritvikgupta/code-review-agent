"""
Analyzer Agent - Explains code structure and behavior using AST tools.
"""
import os
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from src.code_review_agent.tools.ast_tools import parse_python_code, extract_functions, get_code_complexity
from src.code_review_agent.prompts.prompts import ANALYZER_AGENT_PROMPT


def create_analyzer_agent(llm: ChatOpenAI = None):
    """Create and return the analyzer agent."""
    if llm is None:
        # Use Groq if GROQ_API_KEY is set, otherwise fall back to OpenAI
        if os.getenv("GROQ_API_KEY"):
            llm = ChatOpenAI(
                model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                api_key=os.getenv("GROQ_API_KEY"),
                base_url="https://api.groq.com/openai/v1",
            )
        else:
            llm = ChatOpenAI(
                model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            )
    
    tools = [parse_python_code, extract_functions, get_code_complexity]
    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=ANALYZER_AGENT_PROMPT
    )
    return agent
