from dataclasses import dataclass
from typing import Any, Optional, Dict

@dataclass
class CheckoutSessionRequest:
    amount: Optional[float] = None
    currency: str = "mxn"
    success_url: str = ""
    cancel_url: str = ""
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class CheckoutSessionResponse:
    id: str = "stub_session"
    url: str = "https://example.com/stub-checkout"

class StripeCheckout:
    """Stub local para desarrollo."""
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        pass

    async def create_checkout_session(self, *args: Any, **kwargs: Any) -> CheckoutSessionResponse:
        return CheckoutSessionResponse()
