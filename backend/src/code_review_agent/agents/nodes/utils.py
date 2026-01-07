"""
Utility functions for graph nodes.

Shared utilities used across multiple nodes.
"""
import json


def extract_code_from_copilotkit_context(state):
    """
    Extract code from CopilotKit context.
    
    This function preserves the EXACT CopilotKit extraction logic.
    Used by multiple nodes to extract user code.
    
    Args:
        state: The graph state containing copilotkit context
        
    Returns:
        str: The extracted user code, or empty string if not found
    """
    copilotkit_context = state.get("copilotkit", {})
    context_items = copilotkit_context.get("context", [])
    user_code = ""
    
    for item in context_items:
        # Context is an object with .description and .value attributes
        description = getattr(item, 'description', '') or ''
        value = getattr(item, 'value', '') or ''
        
        if "code" in description.lower() and value:
            # Value is a JSON-escaped string, parse it
            try:
                user_code = json.loads(value)
            except:
                user_code = value
            break
    
    return user_code

