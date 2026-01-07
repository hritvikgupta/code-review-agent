"""
Code Review Agent using LangGraph with Multi-Agent Architecture.

This agent uses a sequential graph flow:
- Entry Node: Extracts code from CopilotKit
- Validation Node: Runs validation agent
- Analyzer Node: Runs analyzer agent
- Summarizer Node: Combines results and sends to frontend
"""

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph
from src.code_review_agent.state import CodeReviewState
from src.code_review_agent.agents.nodes import (
    entry_node,
    validation_node,
    analyzer_node,
    summarizer_node,
)


# Build the workflow graph
workflow = StateGraph(CodeReviewState)
workflow.add_node("entry_node", entry_node)
workflow.add_node("validation_node", validation_node)
workflow.add_node("analyzer_node", analyzer_node)
workflow.add_node("summarizer_node", summarizer_node)

# Sequential flow: entry -> validation -> analyzer -> summarizer -> end
workflow.add_edge("entry_node", "validation_node")
workflow.add_edge("validation_node", "analyzer_node")
workflow.add_edge("analyzer_node", "summarizer_node")
workflow.add_edge("summarizer_node", "__end__")
workflow.set_entry_point("entry_node")

# Compile with memory checkpointer
checkpointer = MemorySaver()
graph = workflow.compile(checkpointer=checkpointer)
