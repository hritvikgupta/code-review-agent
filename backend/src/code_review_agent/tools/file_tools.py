from langchain_core.tools import tool
import os
from pathlib import Path


@tool
def read_file(file_path: str) -> str:
    """
    Read the contents of a file at the given path.
    
    Args:
        file_path: Absolute or relative path to the file
        
    Returns:
        The file contents as a string, or an error message
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return f"File not found: {file_path}"
        if not path.is_file():
            return f"Not a file: {file_path}"
        with open(file_path, "r") as f:
            content = f.read()
        return content
    except Exception as e:
        return f"Error reading file: {str(e)}"


@tool
def list_directory(directory_path: str) -> str:
    """
    List all files and subdirectories in the given directory.
    
    Args:
        directory_path: Path to the directory to list
        
    Returns:
        A formatted string showing the directory structure
    """
    try:
        path = Path(directory_path)
        if not path.exists():
            return f"[ERROR]: Directory not found: {directory_path}"
        if not path.is_dir():
            return f"[ERROR]: Not a directory: {directory_path}"
        
        items = []
        for item in sorted(path.iterdir()):
            if item.is_dir():
                items.append(f"📁 {item.name}/")
            else:
                size = item.stat().st_size
                items.append(f"📄 {item.name} ({size} bytes)")
                
        if not items:
            return "Directory is empty"
        
        return "\n".join(items)
    except Exception as e:
        return f"Error listing directory: {str(e)}"


@tool
def get_file_info(file_path: str) -> str:
    """
    Get metadata about a file (size, extension, etc).
    
    Args:
        file_path: Path to the file
        
    Returns:
        File information as a formatted string
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return f"[ERROR]: File not found: {file_path}"
        stat = path.stat()
        info = {
            "name": path.name,
            "extension": path.suffix or "none",
            "size_bytes": stat.st_size,
            "is_file": path.is_file(),
            "is_directory": path.is_dir(),
        }
        return "\n".join([f"{key}: {value}" for key, value in info.items()])
    except Exception as e:
        return f"[ERROR]: Error getting file info: {str(e)}"
