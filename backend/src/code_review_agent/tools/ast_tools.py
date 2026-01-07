import ast
from langchain_core.tools import tool


@tool
def parse_python_code(code: str) -> str:
    """
    Parse Python code and return its structure (functions, classes, imports).
    
    Args:
        code: Python source code as a string
        
    Returns:
        A structured summary of the code
    """
    try:
        tree = ast.parse(code)
        result = {
            "imports": [],
            "functions": [],
            "classes": [],
            "global_variables": [],
        }
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    result["imports"].append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for alias in node.names:
                    result["imports"].append(f"{module}.{alias.name}")
            elif isinstance(node, ast.FunctionDef):
                args = [arg.arg for arg in node.args.args]
                result["functions"].append({
                    "name": node.name,
                    "args": args,
                    "line": node.lineno,
                    "docstring": ast.get_docstring(node) or "No docstring"
                })
            elif isinstance(node, ast.ClassDef):
                methods = [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
                result["classes"].append({
                    "name": node.name,
                    "methods": methods,
                    "line": node.lineno,
                    "docstring": ast.get_docstring(node) or "No docstring"
                })
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        result['global_variables'].append(target.id)

        output = []
        output.append("===== Code Structure =====")
        output.append(f"\nImports ({len(result['imports'])}):")
        for imp in result['imports']:
            output.append(f"  - {imp}")
        output.append(f"\nFunctions ({len(result['functions'])}):")
        for func in result['functions']:
            output.append(f"  - {func['name']}({', '.join(func['args'])}) @ line {func['line']}")

        output.append(f"\nClasses ({len(result['classes'])}):")
        for cls in result["classes"]:
            output.append(f"  - {cls['name']} @ line {cls['line']}")
            output.append(f"    Methods: {', '.join(cls['methods'])}")
        
        return "\n".join(output)
    except SyntaxError as e:
        return f"Syntax Error in code: {str(e)}"
    except Exception as e:
        return f"Error parsing code: {str(e)}"


@tool
def extract_functions(code: str) -> str:
    """
    Extract all function definitions with their signatures and docstrings.
    
    Args:
        code: Python source code
        
    Returns:
        List of functions with details
    """
    try:
        tree = ast.parse(code)
        functions = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                args = []
                for arg in node.args.args:
                    arg_str = arg.arg
                    if arg.annotation:
                        arg_str += f": {ast.unparse(arg.annotation)}"
                    args.append(arg_str)
                
                return_type = ""
                if node.returns:
                    return_type = f" -> {ast.unparse(node.returns)}"
                
                signature = f"def {node.name}({', '.join(args)}){return_type}"
                docstring = ast.get_docstring(node) or "No docstring"
                
                functions.append(f"{signature}\n    \"\"\"{docstring}\"\"\"\n")
        
        if not functions:
            return "No functions found in the code."
        
        return "\n".join(functions)
    
    except Exception as e:
        return f"Error extracting functions: {str(e)}"


@tool
def get_code_complexity(code: str) -> str:
    """
    Analyze the complexity of Python code.
    
    Args:
        code: Python source code
        
    Returns:
        Complexity metrics
    """
    try:
        tree = ast.parse(code)
        
        metrics = {
            "total_lines": len(code.splitlines()),
            "functions": 0,
            "classes": 0,
            "loops": 0,
            "conditionals": 0,
            "try_blocks": 0,
            "nested_depth": 0
        }
        
        def count_depth(node, current_depth=0):
            max_depth = current_depth
            for child in ast.iter_child_nodes(node):
                if isinstance(child, (ast.For, ast.While, ast.If, ast.With, ast.Try)):
                    max_depth = max(max_depth, count_depth(child, current_depth + 1))
                else:
                    max_depth = max(max_depth, count_depth(child, current_depth))
            return max_depth
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                metrics["functions"] += 1
            elif isinstance(node, ast.ClassDef):
                metrics["classes"] += 1
            elif isinstance(node, (ast.For, ast.While)):
                metrics["loops"] += 1
            elif isinstance(node, ast.If):
                metrics["conditionals"] += 1
            elif isinstance(node, ast.Try):
                metrics["try_blocks"] += 1
        
        metrics["nested_depth"] = count_depth(tree)
        
        output = ["=== Complexity Metrics ==="]
        for key, value in metrics.items():
            output.append(f"{key.replace('_', ' ').title()}: {value}")
        
        # Simple complexity rating
        complexity_score = (
            metrics["functions"] + 
            metrics["classes"] * 2 + 
            metrics["loops"] * 2 + 
            metrics["conditionals"] + 
            metrics["nested_depth"] * 3
        )
        
        if complexity_score < 10:
            rating = "Low"
        elif complexity_score < 25:
            rating = "Medium"
        else:
            rating = "High"
        
        output.append(f"\nOverall Complexity: {rating} (score: {complexity_score})")
        
        return "\n".join(output)
    
    except Exception as e:
        return f"Error analyzing complexity: {str(e)}"
