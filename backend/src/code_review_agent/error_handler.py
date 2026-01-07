"""
Production-Scale Error Handling and Tracking System

This module provides comprehensive error handling, logging, and metrics tracking
for the code review agent. It follows industry best practices used by professional
companies and production-scale applications.

Features:
- Structured JSON logging
- Error categorization and severity levels
- Request/execution tracking with unique IDs
- Performance metrics and timing
- Integration points for external monitoring services
- Error recovery strategies
- Contextual error information
"""
import os
import json
import logging
import traceback
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional, Callable
from contextlib import contextmanager
from collections import defaultdict
from threading import Lock
import time


class ErrorCategory(Enum):
    """Error categories for classification."""
    AGENT_ERROR = "agent_error"
    LLM_ERROR = "llm_error"
    VALIDATION_ERROR = "validation_error"
    NETWORK_ERROR = "network_error"
    PARSING_ERROR = "parsing_error"
    STATE_ERROR = "state_error"
    TIMEOUT_ERROR = "timeout_error"
    UNKNOWN_ERROR = "unknown_error"


class Severity(Enum):
    """Error severity levels."""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ErrorHandler:
    """
    Production-scale error handler with structured logging, metrics, and tracking.
    
    Singleton pattern for global error tracking across the application.
    """
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        """Singleton pattern implementation."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ErrorHandler, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the error handler."""
        if self._initialized:
            return
        
        self._initialized = True
        self._request_tracking: Dict[str, Dict[str, Any]] = {}
        self._metrics: Dict[str, Any] = {
            "error_counts": defaultdict(int),
            "node_executions": defaultdict(int),
            "node_durations": defaultdict(list),
            "retry_counts": defaultdict(int),
            "success_rates": defaultdict(lambda: {"success": 0, "failure": 0}),
        }
        self._circuit_breakers: Dict[str, Dict[str, Any]] = {}
        self._logger = None
        self._file_logger = None
        self._setup_logging()
    
    def _setup_logging(self):
        """Setup structured logging to both console and file."""
        # Create logs directory if it doesn't exist
        log_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        
        # Setup console logger (structured JSON)
        self._logger = logging.getLogger("error_handler")
        self._logger.setLevel(logging.INFO)
        
        # Console handler with JSON formatter
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        self._logger.addHandler(console_handler)
        
        # File handler for persistent logging
        log_file = os.path.join(log_dir, f"agent_errors_{datetime.now().strftime('%Y%m%d')}.log")
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        self._file_logger = logging.getLogger("error_handler_file")
        self._file_logger.setLevel(logging.INFO)
        self._file_logger.addHandler(file_handler)
    
    def _generate_request_id(self) -> str:
        """Generate a unique request ID for tracking."""
        return str(uuid.uuid4())
    
    def _get_request_id(self, state: Optional[Dict] = None) -> str:
        """Get or generate request ID from state or create new one."""
        if state and "request_id" in state:
            return state["request_id"]
        return self._generate_request_id()
    
    def _format_log_entry(
        self,
        request_id: str,
        node: str,
        category: ErrorCategory,
        severity: Severity,
        message: str,
        exception: Optional[Exception] = None,
        context: Optional[Dict[str, Any]] = None,
        metrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Format a structured log entry."""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id,
            "node": node,
            "error_type": category.value,
            "severity": severity.value,
            "message": message,
            "context": context or {},
            "metrics": metrics or {},
        }
        
        if exception:
            log_entry["exception"] = {
                "type": type(exception).__name__,
                "message": str(exception),
                "stack_trace": traceback.format_exc(),
            }
        
        return log_entry
    
    def log_error(
        self,
        category: ErrorCategory,
        severity: Severity,
        message: str,
        node: str = "unknown",
        exception: Optional[Exception] = None,
        context: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        state: Optional[Dict] = None
    ):
        """
        Log an error with structured information.
        
        Args:
            category: Error category
            severity: Error severity level
            message: Error message
            node: Node name where error occurred
            exception: Exception object (optional)
            context: Additional context dictionary
            request_id: Request ID for tracking (optional)
            state: State object to extract request_id from (optional)
        """
        req_id = request_id or self._get_request_id(state)
        
        # Update metrics
        self._metrics["error_counts"][f"{category.value}_{severity.value}"] += 1
        if node != "unknown":
            self._metrics["success_rates"][node]["failure"] += 1
        
        # Format log entry
        log_entry = self._format_log_entry(
            request_id=req_id,
            node=node,
            category=category,
            severity=severity,
            message=message,
            exception=exception,
            context=context,
            metrics=self._get_node_metrics(node)
        )
        
        # Log to both console and file
        log_message = json.dumps(log_entry, indent=2)
        
        if severity == Severity.CRITICAL:
            self._logger.critical(log_message)
            self._file_logger.critical(log_message)
        elif severity == Severity.ERROR:
            self._logger.error(log_message)
            self._file_logger.error(log_message)
        elif severity == Severity.WARNING:
            self._logger.warning(log_message)
            self._file_logger.warning(log_message)
        else:
            self._logger.info(log_message)
            self._file_logger.info(log_message)
        
        # Send to external services if configured
        self._send_to_external_services(log_entry)
        
        # Update request tracking
        if req_id not in self._request_tracking:
            self._request_tracking[req_id] = {
                "start_time": time.time(),
                "nodes": [],
                "errors": [],
            }
        
        self._request_tracking[req_id]["errors"].append({
            "node": node,
            "category": category.value,
            "severity": severity.value,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        })
    
    def track_operation(
        self,
        node: str,
        request_id: Optional[str] = None,
        state: Optional[Dict] = None
    ):
        """
        Context manager to track operation execution.
        
        Usage:
            with error_handler.track_operation("analyzer_node", state=state):
                # ... operation code
        """
        return OperationTracker(self, node, request_id or self._get_request_id(state))
    
    def start_request(self, request_id: Optional[str] = None) -> str:
        """
        Start tracking a new request.
        
        Args:
            request_id: Optional request ID, will generate if not provided
            
        Returns:
            Request ID
        """
        req_id = request_id or self._generate_request_id()
        self._request_tracking[req_id] = {
            "start_time": time.time(),
            "nodes": [],
            "errors": [],
            "status": "in_progress",
        }
        return req_id
    
    def complete_request(self, request_id: str, success: bool = True):
        """
        Mark a request as completed.
        
        Args:
            request_id: Request ID
            success: Whether the request succeeded
        """
        if request_id in self._request_tracking:
            self._request_tracking[request_id]["status"] = "completed" if success else "failed"
            self._request_tracking[request_id]["end_time"] = time.time()
            self._request_tracking[request_id]["duration"] = (
                self._request_tracking[request_id]["end_time"] -
                self._request_tracking[request_id]["start_time"]
            )
    
    def _get_node_metrics(self, node: str) -> Dict[str, Any]:
        """Get metrics for a specific node."""
        return {
            "execution_count": self._metrics["node_executions"][node],
            "average_duration": (
                sum(self._metrics["node_durations"][node]) / len(self._metrics["node_durations"][node])
                if self._metrics["node_durations"][node] else 0
            ),
            "retry_count": self._metrics["retry_counts"][node],
            "success_rate": self._calculate_success_rate(node),
        }
    
    def _calculate_success_rate(self, node: str) -> float:
        """Calculate success rate for a node."""
        rates = self._metrics["success_rates"][node]
        total = rates["success"] + rates["failure"]
        if total == 0:
            return 1.0
        return rates["success"] / total
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all collected metrics."""
        return {
            "error_counts": dict(self._metrics["error_counts"]),
            "node_metrics": {
                node: {
                    "executions": self._metrics["node_executions"][node],
                    "average_duration": (
                        sum(durations) / len(durations) if durations else 0
                    ),
                    "success_rate": self._calculate_success_rate(node),
                }
                for node, durations in self._metrics["node_durations"].items()
            },
            "total_requests": len(self._request_tracking),
            "active_requests": sum(
                1 for req in self._request_tracking.values()
                if req.get("status") == "in_progress"
            ),
        }
    
    def _send_to_external_services(self, log_entry: Dict[str, Any]):
        """Send error to external monitoring services if configured."""
        # Sentry integration (if SENTRY_DSN is set)
        sentry_dsn = os.getenv("SENTRY_DSN")
        if sentry_dsn and log_entry["severity"] in ["critical", "error"]:
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(
                    Exception(log_entry["message"]),
                    contexts={"custom": log_entry}
                )
            except ImportError:
                pass  # Sentry SDK not installed
        
        # Custom webhook (if ERROR_WEBHOOK_URL is set)
        webhook_url = os.getenv("ERROR_WEBHOOK_URL")
        if webhook_url and log_entry["severity"] == "critical":
            try:
                import requests
                requests.post(webhook_url, json=log_entry, timeout=5)
            except ImportError:
                pass  # requests not installed
            except Exception:
                pass  # Don't fail if webhook fails
    
    def retry_with_backoff(
        self,
        func: Callable,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        backoff_factor: float = 2.0,
        node: str = "unknown",
        category: ErrorCategory = ErrorCategory.UNKNOWN_ERROR
    ):
        """
        Retry a function with exponential backoff.
        
        Args:
            func: Function to retry
            max_retries: Maximum number of retries
            initial_delay: Initial delay in seconds
            backoff_factor: Multiplier for delay between retries
            node: Node name for tracking
            category: Error category for logging
            
        Returns:
            Function result
            
        Raises:
            Last exception if all retries fail
        """
        delay = initial_delay
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                return func()
            except Exception as e:
                last_exception = e
                if attempt < max_retries:
                    self._metrics["retry_counts"][node] += 1
                    self.log_error(
                        category=category,
                        severity=Severity.WARNING,
                        message=f"Retry attempt {attempt + 1}/{max_retries} for {node}",
                        node=node,
                        exception=e,
                        context={"attempt": attempt + 1, "max_retries": max_retries}
                    )
                    time.sleep(delay)
                    delay *= backoff_factor
                else:
                    self.log_error(
                        category=category,
                        severity=Severity.ERROR,
                        message=f"All retry attempts failed for {node}",
                        node=node,
                        exception=e,
                        context={"attempts": max_retries + 1}
                    )
        
        raise last_exception


class OperationTracker:
    """Context manager for tracking operation execution."""
    
    def __init__(self, error_handler: ErrorHandler, node: str, request_id: str):
        self.error_handler = error_handler
        self.node = node
        self.request_id = request_id
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        self.error_handler._metrics["node_executions"][self.node] += 1
        
        # Track in request
        if self.request_id in self.error_handler._request_tracking:
            self.error_handler._request_tracking[self.request_id]["nodes"].append({
                "node": self.node,
                "start_time": self.start_time,
            })
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        self.error_handler._metrics["node_durations"][self.node].append(duration)
        
        # Update request tracking
        if self.request_id in self.error_handler._request_tracking:
            nodes = self.error_handler._request_tracking[self.request_id]["nodes"]
            if nodes and nodes[-1]["node"] == self.node:
                nodes[-1]["duration"] = duration
                nodes[-1]["end_time"] = time.time()
        
        if exc_type is not None:
            # Determine error category based on exception type
            category = ErrorCategory.UNKNOWN_ERROR
            if "LLM" in str(exc_type) or "OpenAI" in str(exc_type) or "API" in str(exc_type):
                category = ErrorCategory.LLM_ERROR
            elif "Timeout" in str(exc_type) or "timeout" in str(exc_type).lower():
                category = ErrorCategory.TIMEOUT_ERROR
            elif "Network" in str(exc_type) or "Connection" in str(exc_type):
                category = ErrorCategory.NETWORK_ERROR
            elif "Validation" in str(exc_type) or "Syntax" in str(exc_type):
                category = ErrorCategory.VALIDATION_ERROR
            elif "State" in str(exc_type):
                category = ErrorCategory.STATE_ERROR
            
            self.error_handler.log_error(
                category=category,
                severity=Severity.ERROR,
                message=f"Error in {self.node}: {str(exc_val)}",
                node=self.node,
                exception=exc_val,
                request_id=self.request_id
            )
            
            # Mark as failure
            self.error_handler._metrics["success_rates"][self.node]["failure"] += 1
        else:
            # Mark as success
            self.error_handler._metrics["success_rates"][self.node]["success"] += 1
        
        # Return False to propagate exception
        return False


# Global singleton instance
error_handler = ErrorHandler()

