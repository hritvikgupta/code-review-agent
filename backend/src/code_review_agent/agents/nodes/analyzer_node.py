"""
Analyzer Node - Runs the analyzer agent.

This node analyzes and explains code structure and behavior.
"""
import time
import asyncio
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from src.code_review_agent.state import CodeReviewState
from src.code_review_agent.agents.nodes.utils import extract_code_from_copilotkit_context
from src.code_review_agent.agents.supervisor import _get_analyzer_agent
from src.code_review_agent.error_handler import error_handler, ErrorCategory, Severity


async def analyzer_node(
    state: CodeReviewState, config: RunnableConfig
) -> dict:
    """
    Analyzer node that runs the analyzer agent.
    """
    request_id = state.get("request_id", "unknown")
    
    with error_handler.track_operation("analyzer_node", request_id=request_id, state=state):
        try:
            node_start_time = time.time()
            print("=" * 50)
            print("ANALYZER_NODE CALLED")
            
            # Extract code from state (either from user_code field or from copilotkit context)
            user_code = state.get("user_code", "")
            
            # If not in user_code, extract from CopilotKit context (same logic as entry_node)
            if not user_code:
                try:
                    user_code = extract_code_from_copilotkit_context(state)
                except Exception as e:
                    error_handler.log_error(
                        category=ErrorCategory.PARSING_ERROR,
                        severity=Severity.ERROR,
                        message="Failed to extract code from CopilotKit context in analyzer_node",
                        node="analyzer_node",
                        exception=e,
                        request_id=request_id
                    )
                    user_code = ""
            
            code_length = len(str(user_code)) if user_code else 0
            print(f"USER CODE LENGTH: {code_length}")
            
            if not user_code:
                error_handler.log_error(
                    category=ErrorCategory.VALIDATION_ERROR,
                    severity=Severity.WARNING,
                    message="No code found in state, skipping analysis",
                    node="analyzer_node",
                    request_id=request_id,
                    context={"code_length": code_length}
                )
                print("WARNING: No code found in state, skipping analysis")
                return {"analyzer_results": "No code provided for analysis."}
            
            # Get analyzer agent with error handling
            try:
                analyzer_agent = _get_analyzer_agent()
            except Exception as e:
                error_handler.log_error(
                    category=ErrorCategory.AGENT_ERROR,
                    severity=Severity.ERROR,
                    message="Failed to get analyzer agent",
                    node="analyzer_node",
                    exception=e,
                    request_id=request_id
                )
                raise
            
            # Create request message with the code
            request = f"Please analyze and explain this code:\n\n```python\n{user_code}\n```"
            
            print("CALLING ANALYZER AGENT...")
            analyzer_start = time.time()
            
            # Invoke analyzer agent with retry logic for transient errors
            max_retries = 2
            delay = 1.0
            result = None
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    result = await analyzer_agent.ainvoke({
                        "messages": [HumanMessage(content=request)]
                    }, config)
                    break
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        error_handler._metrics["retry_counts"]["analyzer_node"] += 1
                        error_handler.log_error(
                            category=ErrorCategory.LLM_ERROR,
                            severity=Severity.WARNING,
                            message=f"Retry attempt {attempt + 1}/{max_retries} for analyzer agent",
                            node="analyzer_node",
                            exception=e,
                            request_id=request_id,
                            context={"attempt": attempt + 1, "max_retries": max_retries}
                        )
                        await asyncio.sleep(delay)
                        delay *= 2.0
                    else:
                        error_handler.log_error(
                            category=ErrorCategory.LLM_ERROR,
                            severity=Severity.ERROR,
                            message="Analyzer agent invocation failed after retries",
                            node="analyzer_node",
                            exception=e,
                            request_id=request_id,
                            context={"code_length": code_length, "attempts": max_retries + 1}
                        )
                        raise
            
            if result is None:
                raise last_exception
            
            analyzer_elapsed = time.time() - analyzer_start
            print(f"[PERF] Analyzer agent took {analyzer_elapsed:.2f}s")
            print(f"✅ Analyzer agent completed successfully")
            
            # Extract the last message content
            try:
                last_message = result["messages"][-1]
                analyzer_results = last_message.content if hasattr(last_message, 'content') else str(last_message)
            except (KeyError, IndexError, AttributeError) as e:
                error_handler.log_error(
                    category=ErrorCategory.STATE_ERROR,
                    severity=Severity.ERROR,
                    message="Failed to extract analyzer results from agent response",
                    node="analyzer_node",
                    exception=e,
                    request_id=request_id,
                    context={"result_keys": list(result.keys()) if isinstance(result, dict) else "not_dict"}
                )
                analyzer_results = "Error: Failed to process analyzer results."
            
            print(f"ANALYZER RESULTS: {analyzer_results[:100]}...")
            node_elapsed = time.time() - node_start_time
            print(f"[PERF] analyzer_node took {node_elapsed:.2f}s")
            print("✅ ANALYZER_NODE COMPLETED - Routing to summarizer_node")
            
            return {"analyzer_results": analyzer_results}
            
        except Exception as e:
            error_handler.log_error(
                category=ErrorCategory.AGENT_ERROR,
                severity=Severity.ERROR,
                message="Unexpected error in analyzer_node",
                node="analyzer_node",
                exception=e,
                request_id=request_id
            )
            raise

