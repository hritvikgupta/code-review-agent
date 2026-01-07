"""
Summarizer Node - Combines validation and analyzer results.

This is the final node that creates a comprehensive summary and sends it to the frontend.
"""
import time
import asyncio
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from src.code_review_agent.state import CodeReviewState
from src.code_review_agent.agents.nodes.utils import extract_code_from_copilotkit_context
from src.code_review_agent.agents.summarizer_agent import create_summarizer_agent
from src.code_review_agent.error_handler import error_handler, ErrorCategory, Severity

# Cached summarizer agent instance
_cached_summarizer_agent = None


def _get_summarizer_agent():
    """Get or create the cached summarizer agent instance."""
    global _cached_summarizer_agent
    if _cached_summarizer_agent is None:
        _cached_summarizer_agent = create_summarizer_agent()
    return _cached_summarizer_agent


async def summarizer_node(
    state: CodeReviewState, config: RunnableConfig
) -> dict:
    """
    Summarizer node that combines validation and analyzer results.
    Preserves CopilotKit message format for frontend.
    """
    request_id = state.get("request_id", "unknown")
    
    with error_handler.track_operation("summarizer_node", request_id=request_id, state=state):
        try:
            node_start_time = time.time()
            print("=" * 50)
            print("SUMMARIZER_NODE CALLED")
            
            validation_results = state.get("validation_results", "")
            analyzer_results = state.get("analyzer_results", "")
            
            # Validate that we have results from previous nodes
            if not validation_results and not analyzer_results:
                error_handler.log_error(
                    category=ErrorCategory.STATE_ERROR,
                    severity=Severity.WARNING,
                    message="No validation or analyzer results found in state",
                    node="summarizer_node",
                    request_id=request_id,
                    context={
                        "has_validation": bool(validation_results),
                        "has_analyzer": bool(analyzer_results)
                    }
                )
            
            # Extract code from state (either from user_code field or from copilotkit context)
            user_code = state.get("user_code", "")
            
            # If not in user_code, extract from CopilotKit context (same logic as entry_node)
            if not user_code:
                try:
                    user_code = extract_code_from_copilotkit_context(state)
                except Exception as e:
                    error_handler.log_error(
                        category=ErrorCategory.PARSING_ERROR,
                        severity=Severity.WARNING,
                        message="Failed to extract code from CopilotKit context in summarizer_node",
                        node="summarizer_node",
                        exception=e,
                        request_id=request_id
                    )
                    user_code = ""
            
            # Get summarizer agent (cached) with error handling
            try:
                summarizer_agent = _get_summarizer_agent()
            except Exception as e:
                error_handler.log_error(
                    category=ErrorCategory.AGENT_ERROR,
                    severity=Severity.ERROR,
                    message="Failed to get summarizer agent",
                    node="summarizer_node",
                    exception=e,
                    request_id=request_id
                )
                raise
            
            # Create request message combining both results
            request = f"""Please create a comprehensive code review summary combining the following:

## Validation Results:
{validation_results}

## Analyzer Results:
{analyzer_results}

## Original Code:
```python
{user_code}
```

Create a well-structured summary that combines both the analysis and validation findings."""
            
            print(f"DEBUG: validation_results length: {len(str(validation_results))}")
            print(f"DEBUG: analyzer_results length: {len(str(analyzer_results))}")
            
            print("CALLING SUMMARIZER AGENT...")
            summarizer_start = time.time()
            
            # Invoke summarizer agent with retry logic for transient errors
            max_retries = 2
            delay = 1.0
            result = None
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    result = await summarizer_agent.ainvoke({
                        "messages": [HumanMessage(content=request)]
                    }, config)
                    break
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        error_handler._metrics["retry_counts"]["summarizer_node"] += 1
                        error_handler.log_error(
                            category=ErrorCategory.LLM_ERROR,
                            severity=Severity.WARNING,
                            message=f"Retry attempt {attempt + 1}/{max_retries} for summarizer agent",
                            node="summarizer_node",
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
                            message="Summarizer agent invocation failed after retries",
                            node="summarizer_node",
                            exception=e,
                            request_id=request_id,
                            context={"attempts": max_retries + 1}
                        )
                        raise
            
            if result is None:
                raise last_exception
            
            summarizer_elapsed = time.time() - summarizer_start
            print(f"[PERF] Summarizer agent took {summarizer_elapsed:.2f}s")
            print(f"✅ Summarizer agent completed successfully")
            
            # Extract the last message content
            try:
                last_message = result["messages"][-1]
                summary_content = last_message.content if hasattr(last_message, 'content') else str(last_message)
            except (KeyError, IndexError, AttributeError) as e:
                error_handler.log_error(
                    category=ErrorCategory.STATE_ERROR,
                    severity=Severity.ERROR,
                    message="Failed to extract summary from agent response",
                    node="summarizer_node",
                    exception=e,
                    request_id=request_id,
                    context={"result_keys": list(result.keys()) if isinstance(result, dict) else "not_dict"}
                )
                summary_content = "Error: Failed to process summary. Please try again."
            
            print(f"SUMMARY: {summary_content[:100]}...")
            
            # CRITICAL: Preserve CopilotKit message format
            # Create a message in the format expected by CopilotKit
            summary_message = AIMessage(content=summary_content)
            
            # Get existing messages and append the summary
            messages = state.get("messages", [])
            messages.append(summary_message)
            
            node_elapsed = time.time() - node_start_time
            print(f"[PERF] summarizer_node took {node_elapsed:.2f}s")
            print("✅ SUMMARIZER_NODE COMPLETED - Routing to __end__")
            print("=" * 50)
            print("🎉 GRAPH EXECUTION COMPLETE")
            print("=" * 50)
            print("EXECUTION SUMMARY:")
            print("  1. ✅ entry_node - Extracted code from CopilotKit")
            print("  2. ✅ validation_node - Ran validator agent")
            print("  3. ✅ analyzer_node - Ran analyzer agent")
            print("  4. ✅ summarizer_node - Combined results and sent to frontend")
            print("=" * 50)
            
            # Mark request as completed successfully
            error_handler.complete_request(request_id, success=True)
            
            # Return with messages in proper format for CopilotKit
            return {"messages": messages}
            
        except Exception as e:
            error_handler.log_error(
                category=ErrorCategory.AGENT_ERROR,
                severity=Severity.ERROR,
                message="Unexpected error in summarizer_node",
                node="summarizer_node",
                exception=e,
                request_id=request_id
            )
            # Mark request as failed
            error_handler.complete_request(request_id, success=False)
            raise

