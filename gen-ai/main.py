from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from routers import router

app = FastAPI(
    title="ByteBite Gen AI Service API",
    version="0.0.1",
    description="Internal AI endpoints for parsing recipes and merging ingredient lists.",
)

# Expose default HTTP request metrics for Prometheus at GET /metrics.
Instrumentator().instrument(app).expose(app)

app.include_router(router)
