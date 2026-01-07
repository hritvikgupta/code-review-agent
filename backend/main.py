import os
import warnings
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from src.code_review_agent.agent import graph
from src.code_review_agent.error_handler import error_handler, ErrorCategory, Severity
from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

_ = load_dotenv(override=True)
app = FastAPI(title="Code Review Agent API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Add request ID to all requests for tracking."""
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Start tracking request
    error_handler.start_request(request_id)
    
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        # Mark request as completed
        error_handler.complete_request(request_id, success=response.status_code < 400)
        
        return response
    except Exception as e:
        # Log error and mark request as failed
        error_handler.log_error(
            category=ErrorCategory.UNKNOWN_ERROR,
            severity=Severity.ERROR,
            message=f"Unhandled exception in request: {str(e)}",
            node="api_middleware",
            exception=e,
            request_id=request_id
        )
        error_handler.complete_request(request_id, success=False)
        raise


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for all unhandled exceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    
    error_handler.log_error(
        category=ErrorCategory.UNKNOWN_ERROR,
        severity=Severity.ERROR,
        message=f"Unhandled exception: {str(exc)}",
        node="api_endpoint",
        exception=exc,
        request_id=request_id,
        context={
            "path": request.url.path,
            "method": request.method,
        }
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "request_id": request_id,
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint with error metrics."""
    from datetime import datetime
    metrics = error_handler.get_metrics()
    
    # Determine health status
    critical_errors = metrics.get("error_counts", {}).get("unknown_error_critical", 0)
    is_healthy = critical_errors == 0
    
    return {
        "status": "healthy" if is_healthy else "degraded",
        "metrics": metrics,
        "timestamp": datetime.utcnow().isoformat(),
    }


# Original endpoint (commented out - using /explain instead)
# add_langgraph_fastapi_endpoint(
#     app=app,
#     agent=LangGraphAGUIAgent(
#         name="code_review_agent",
#         description="An AI code review agent that analyzes, explains, and suggests improvements for your code using AST parsing and LLM analysis.",
#         graph=graph,
#     ),
#     path="/",
# )

# New /explain endpoint
add_langgraph_fastapi_endpoint(
    app=app,
    agent=LangGraphAGUIAgent(
        name="code_review_agent",
        description="An AI code review agent that analyzes, explains, and suggests improvements for your code using AST parsing and LLM analysis.",
        graph=graph,
    ),
    path="/explain",
)


def main():
    """Run the uvicorn server."""
    port = int(os.getenv("PORT", "8123"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )


warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")
if __name__ == "__main__":
    main()
