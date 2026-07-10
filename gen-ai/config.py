import os
from typing import Literal

from dotenv import load_dotenv

load_dotenv()

LOGOS_BASE_URL = "https://logos.aet.cit.tum.de/v1"
LOGOS_MODEL = "openai/gpt-oss-120b"
OPENAI_MODEL = "gpt-4o-mini"
LM_STUDIO_BASE_URL = os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234/v1")
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL", "local-model")
DEFAULT_LLM_PROVIDER = "logos"

Provider = Literal["logos", "openai", "local"]
