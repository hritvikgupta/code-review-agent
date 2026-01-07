import ast
import re
from langchain_core.tools import tool


@tool
def check_syntax(code: str) -> str:
    """
    Check Python code for syntax errors.
    
    Args:
        code: Python source code
        
    Returns:
        'Valid' or error details
    """
    try:
        ast.parse(code)
        return "✅ Syntax is correct"
    except SyntaxError as e:
        return f"❌ Syntax Error: {str(e)}"


@tool
def find_common_issues(code: str) -> str:
    """
    Detect common code issues and antipatterns.
    
    Args:
        code: Python source code
        
    Returns:
        List of potential issues found
    """
    issues = []
    lines = code.splitlines()
    
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return "Cannot analyze - code has syntax errors. Run check_syntax first."
    
    # Check for common issues
    
    # 1. Bare except clauses
    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler):
            if node.type is None:
                issues.append(f"Line {node.lineno}: Bare 'except:' clause - catch specific exceptions instead")
    
    # 2. Unused variables (simple check)
    defined_vars = set()
    used_vars = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            if isinstance(node.ctx, ast.Store):
                defined_vars.add(node.id)
            elif isinstance(node.ctx, ast.Load):
                used_vars.add(node.id)
    
    unused = defined_vars - used_vars - {'_'}
    if unused:
        issues.append(f"Potentially unused variables: {', '.join(unused)}")
    
    # 3. TODO/FIXME comments
    for i, line in enumerate(lines, 1):
        if 'TODO' in line or 'FIXME' in line:
            issues.append(f"Line {i}: Contains TODO/FIXME - {line.strip()[:50]}")
    
    # 4. Long lines
    for i, line in enumerate(lines, 1):
        if len(line) > 100:
            issues.append(f"Line {i}: Line too long ({len(line)} chars)")
    
    # 5. Magic numbers
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                if node.value not in (0, 1, -1, 2, 10, 100):
                    # Check if it's in a meaningful context
                    issues.append(f"Line {node.lineno}: Magic number {node.value} - consider using a named constant")
    
    # 6. Missing docstrings
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            if not ast.get_docstring(node):
                issues.append(f"Line {node.lineno}: {node.name} is missing a docstring")
    
    # 7. Print statements (often forgotten debug code)
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == 'print':
                issues.append(f"Line {node.lineno}: print() statement - consider using logging")
    
    if not issues:
        return "✅ No common issues found. Code looks good!"
    
    return "⚠️ Potential Issues Found:\n" + "\n".join([f"  • {issue}" for issue in issues])


@tool
def suggest_improvements(code: str) -> str:
    """
    Suggest improvements for the given code.
    
    Args:
        code: Python source code
        
    Returns:
        List of improvement suggestions
    """
    suggestions = []
    
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return "Cannot analyze - code has syntax errors."
    
    # 1. Type hints
    has_type_hints = False
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            if node.returns or any(arg.annotation for arg in node.args.args):
                has_type_hints = True
                break
    
    if not has_type_hints:
        suggestions.append("Add type hints to function parameters and return values for better code clarity")
    
    # 2. Error handling
    has_try_except = any(isinstance(node, ast.Try) for node in ast.walk(tree))
    if not has_try_except:
        suggestions.append("Consider adding try/except blocks for error handling")
    
    # 3. List comprehensions
    for node in ast.walk(tree):
        if isinstance(node, ast.For):
            # Simple heuristic: if for loop just appends to a list
            if len(node.body) == 1 and isinstance(node.body[0], ast.Expr):
                if isinstance(node.body[0].value, ast.Call):
                    if hasattr(node.body[0].value.func, 'attr'):
                        if node.body[0].value.func.attr == 'append':
                            suggestions.append(f"Line {node.lineno}: Consider using list comprehension instead of for loop with append")
    
    # 4. Context managers
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == 'open':
                # Check if parent is not a 'with' statement
                suggestions.append(f"Line {node.lineno}: Use 'with' statement for file operations to ensure proper cleanup")
    
    # 5. Constants
    lines = code.splitlines()
    if not any(line.strip().isupper() and '=' in line for line in lines):
        suggestions.append("Consider defining magic numbers as named constants at the top of the file")
    
    if not suggestions:
        return "✅ Code follows good practices. No major improvements suggested."
    
    return "💡 Improvement Suggestions:\n" + "\n".join([f"  {i+1}. {s}" for i, s in enumerate(suggestions)])