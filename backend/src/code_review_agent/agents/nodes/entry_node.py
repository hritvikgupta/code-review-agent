"""
Entry Node - Extracts code from CopilotKit context.

This is the first node in the graph flow.
"""
import time
from langchain_core.runnables import RunnableConfig
from src.code_review_agent.state import CodeReviewState
from src.code_review_agent.agents.nodes.utils import extract_code_from_copilotkit_context
from src.code_review_agent.error_handler import error_handler, ErrorCategory, Severity


async def entry_node(
    state: CodeReviewState, config: RunnableConfig
) -> dict:
    """
    Entry node that extracts code from CopilotKit context.
    Preserves EXACT CopilotKit extraction logic.
    """
    # Get or create request ID
    request_id = state.get("request_id")
    if not request_id:
        request_id = error_handler.start_request()
        state["request_id"] = request_id
    
    with error_handler.track_operation("entry_node", request_id=request_id, state=state):
        try:
            node_start_time = time.time()
            print("=" * 50)
            print("🚀 GRAPH EXECUTION STARTED")
            print("=" * 50)
            print("GRAPH FLOW: entry_node → validation_node → analyzer_node → summarizer_node → __end__")
            print("=" * 50)
            print("ENTRY_NODE CALLED")
            
            # CRITICAL: Preserve ALL CopilotKit code extraction exactly as-is
            # Get frontend tools from CopilotKit
            copilotkit_context = state.get("copilotkit", {})
            if not copilotkit_context:
                error_handler.log_error(
                    category=ErrorCategory.STATE_ERROR,
                    severity=Severity.WARNING,
                    message="CopilotKit context not found in state",
                    node="entry_node",
                    request_id=request_id,
                    context={"state_keys": list(state.keys())}
                )
                copilotkit_context = {}
            
            fe_tools = copilotkit_context.get("actions", [])
            
            # Extract the code from CopilotKit context (set by useCopilotReadable in frontend)
            try:
                user_code = extract_code_from_copilotkit_context(state)
            except Exception as e:
                error_handler.log_error(
                    category=ErrorCategory.PARSING_ERROR,
                    severity=Severity.ERROR,
                    message="Failed to extract code from CopilotKit context",
                    node="entry_node",
                    exception=e,
                    request_id=request_id
                )
                user_code = ""
            
            code_found = bool(user_code)
            code_length = len(str(user_code)) if user_code else 0
            messages_count = len(state.get('messages', []))
            
            print(f"USER CODE FOUND: {code_found}")
            print(f"USER CODE LENGTH: {code_length}")
            print(f"MESSAGES COUNT: {messages_count}")
            
            if not code_found:
                error_handler.log_error(
                    category=ErrorCategory.VALIDATION_ERROR,
                    severity=Severity.WARNING,
                    message="No code found in CopilotKit context",
                    node="entry_node",
                    request_id=request_id,
                    context={
                        "code_found": code_found,
                        "messages_count": messages_count,
                    }
                )
            
            node_elapsed = time.time() - node_start_time
            print(f"[PERF] entry_node took {node_elapsed:.2f}s")
            print("✅ ENTRY_NODE COMPLETED - Routing to validation_node")
            
            # Note: We don't need to store user_code in state since it's already in copilotkit.context
            # Each node will extract it from copilotkit context directly
            # This avoids state merging issues with LangGraph
            return {}
            
        except Exception as e:
            error_handler.log_error(
                category=ErrorCategory.AGENT_ERROR,
                severity=Severity.ERROR,
                message="Unexpected error in entry_node",
                node="entry_node",
                exception=e,
                request_id=request_id,
                context={"state_keys": list(state.keys())}
            )
            raise

