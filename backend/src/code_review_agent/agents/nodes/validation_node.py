"""
Validation Node - Runs the validator agent.

This node validates code for issues and suggests improvements.
"""
import time
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from src.code_review_agent.state import CodeReviewState
from src.code_review_agent.agents.nodes.utils import extract_code_from_copilotkit_context
from src.code_review_agent.agents.supervisor import _get_validator_agent
from src.code_review_agent.error_handler import error_handler, ErrorCategory, Severity


async def validation_node(
    state: CodeReviewState, config: RunnableConfig
) -> dict:
    """
    Validation node that runs the validator agent.
    """
    request_id = state.get("request_id", "unknown")
    
    with error_handler.track_operation("validation_node", request_id=request_id, state=state):
        try:
            node_start_time = time.time()
            print("=" * 50)
            print("VALIDATION_NODE CALLED")
            
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
                        message="Failed to extract code from CopilotKit context in validation_node",
                        node="validation_node",
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
                    message="No code found in state, skipping validation",
                    node="validation_node",
                    request_id=request_id,
                    context={"code_length": code_length}
                )
                print("WARNING: No code found in state, skipping validation")
                return {"validation_results": "No code provided for validation."}
            
            # Get validator agent with error handling
            try:
                validator_agent = _get_validator_agent()
            except Exception as e:
                error_handler.log_error(
                    category=ErrorCategory.AGENT_ERROR,
                    severity=Severity.ERROR,
                    message="Failed to get validator agent",
                    node="validation_node",
                    exception=e,
                    request_id=request_id
                )
                raise
            
            # Create request message with the code
            request = f"Please validate and check this code for issues:\n\n```python\n{user_code}\n```"
            
            print("CALLING VALIDATOR AGENT...")
            validation_start = time.time()
            
            # Invoke validator agent with retry logic for transient errors
            max_retries = 2
            delay = 1.0
            result = None
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    result = await validator_agent.ainvoke({
                        "messages": [HumanMessage(content=request)]
                    }, config)
                    break
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        error_handler._metrics["retry_counts"]["validation_node"] += 1
                        error_handler.log_error(
                            category=ErrorCategory.LLM_ERROR,
                            severity=Severity.WARNING,
                            message=f"Retry attempt {attempt + 1}/{max_retries} for validator agent",
                            node="validation_node",
                            exception=e,
                            request_id=request_id,
                            context={"attempt": attempt + 1, "max_retries": max_retries}
                        )
                        import asyncio
                        await asyncio.sleep(delay)
                        delay *= 2.0
                    else:
                        error_handler.log_error(
                            category=ErrorCategory.LLM_ERROR,
                            severity=Severity.ERROR,
                            message="Validator agent invocation failed after retries",
                            node="validation_node",
                            exception=e,
                            request_id=request_id,
                            context={"code_length": code_length, "attempts": max_retries + 1}
                        )
                        raise
            
            if result is None:
                raise last_exception
            
            validation_elapsed = time.time() - validation_start
            print(f"[PERF] Validator agent took {validation_elapsed:.2f}s")
            print(f"✅ Validator agent completed successfully")
            
            # Extract the last message content
            try:
                last_message = result["messages"][-1]
                validation_results = last_message.content if hasattr(last_message, 'content') else str(last_message)
            except (KeyError, IndexError, AttributeError) as e:
                error_handler.log_error(
                    category=ErrorCategory.STATE_ERROR,
                    severity=Severity.ERROR,
                    message="Failed to extract validation results from agent response",
                    node="validation_node",
                    exception=e,
                    request_id=request_id,
                    context={"result_keys": list(result.keys()) if isinstance(result, dict) else "not_dict"}
                )
                validation_results = "Error: Failed to process validation results."
            
            print(f"VALIDATION RESULTS: {validation_results[:100]}...")
            node_elapsed = time.time() - node_start_time
            print(f"[PERF] validation_node took {node_elapsed:.2f}s")
            print("✅ VALIDATION_NODE COMPLETED - Routing to analyzer_node")
            
            return {"validation_results": validation_results}
            
        except Exception as e:
            error_handler.log_error(
                category=ErrorCategory.AGENT_ERROR,
                severity=Severity.ERROR,
                message="Unexpected error in validation_node",
                node="validation_node",
                exception=e,
                request_id=request_id
            )
            raise

