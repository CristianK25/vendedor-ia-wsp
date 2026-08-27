from typing import Optional
from pydantic import BaseModel

class FrontendErrorPayload(BaseModel):
    error_name: str
    error_message: str
    component_stack: Optional[str] = None
    url: str
    user_agent: Optional[str] = None
    user_email: Optional[str] = None
