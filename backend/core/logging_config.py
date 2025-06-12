import structlog
import logging
import sys
from rich.console import Console
from rich.logging import RichHandler

def setup_logging():
    """Configure structured logging for the application"""
    
    # Configure standard library logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[
            RichHandler(
                console=Console(stderr=True),
                show_time=True,
                show_path=True,
                markup=True,
                rich_tracebacks=True,
            )
        ],
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            # Filter out debug messages if not in debug mode
            structlog.stdlib.filter_by_level,
            # Add log level
            structlog.stdlib.add_log_level,
            # Add timestamp
            structlog.processors.TimeStamper(fmt="ISO"),
            # Add logger name
            structlog.stdlib.add_logger_name,
            # Perform %-style formatting
            structlog.stdlib.PositionalArgumentsFormatter(),
            # Add stack info if exception occurred
            structlog.processors.StackInfoRenderer(),
            # Format exception info
            structlog.processors.format_exc_info,
            # Decode unicode
            structlog.processors.UnicodeDecoder(),
            # Render to console with colors
            structlog.dev.ConsoleRenderer(colors=True)
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    return structlog.get_logger()

# Create a logger instance
logger = structlog.get_logger() 