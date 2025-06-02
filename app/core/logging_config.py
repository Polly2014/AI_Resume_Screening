import logging
import logging.config
import os
from datetime import datetime

def setup_logging():
    """配置应用日志"""
    
    # 确保logs目录存在
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    
    # 生成日志文件名（按日期）
    today = datetime.now().strftime("%Y-%m-%d")
    
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "llm": {
                "format": "%(asctime)s - LLM - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "default",
                "stream": "ext://sys.stdout"
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "detailed",
                "filename": f"{log_dir}/hr_copilot_{today}.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8"
            },
            "llm_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "llm",
                "filename": f"{log_dir}/llm_requests_{today}.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8"
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": f"{log_dir}/errors_{today}.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 10,
                "encoding": "utf8"
            }
        },
        "loggers": {
            "": {  # root logger
                "level": "INFO",
                "handlers": ["console", "file", "error_file"],
                "propagate": False
            },
            "llm_requests": {
                "level": "INFO",
                "handlers": ["llm_file", "console"],
                "propagate": False
            },
            "app": {
                "level": "INFO",
                "handlers": ["console", "file", "error_file"],
                "propagate": False
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console", "file", "error_file"],
                "propagate": False
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["file"],
                "propagate": False
            },
            "sqlalchemy.engine": {
                "level": "WARNING",
                "handlers": ["file"],
                "propagate": False
            }
        }
    }
    
    logging.config.dictConfig(logging_config)
    
    # 创建应用专用logger
    app_logger = logging.getLogger("app")
    app_logger.info("日志系统初始化完成")
    
    return app_logger
