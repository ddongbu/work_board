import os
import sys
import time as time_module

from loguru import logger


def init_logger(service_name: str):
    log_path = f"/log/{service_name}_{{time:YYYYMMDD}}.log"
    logger.remove()
    logger.add(
        sink=f"{os.getcwd()}{log_path}",
        rotation="00:00",
        retention="14 days",
        level="INFO",
        compression="gz",
        backtrace=False,
        diagnose=False,
        serialize=True,
        enqueue=True
    )
    logger.add(sys.stdout, level="INFO")


def logger_bind(request, log_info, service_name):
    process_time = (time_module.time() - request.state.start_time) * 1000  # Convert time to milliseconds

    return {
        "ip": request.state.ip,
        "method": request.method,
        "statusCode": log_info.status_code,
        "path": request.url.path,
        "user": request.state.vd_manager.get("email", "-") if hasattr(request.state, 'vd_manager') else '-',
        "response_time": f"{process_time:.2f}",
        "body": log_info.body.decode("utf-8") if isinstance(log_info.body, bytes) else log_info.body,
        "log_message": request.state.log_message if hasattr(request.state, "log_message") else "",
        "service_name": service_name,
        "timestamp": time_module.strftime("%Y-%m-%d %H:%M:%S", time_module.gmtime())
    }
