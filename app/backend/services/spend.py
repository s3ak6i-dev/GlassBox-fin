import re
from decimal import Decimal

# Per-token pricing in USD (input, output)
DEFAULT_PRICING: dict[str, dict[str, float]] = {
    # OpenAI
    "gpt-4o":               {"input": 0.0000025,  "output": 0.000010},
    "gpt-4o-mini":          {"input": 0.00000015, "output": 0.0000006},
    "gpt-4-turbo":          {"input": 0.000010,   "output": 0.000030},
    "gpt-4":                {"input": 0.000030,   "output": 0.000060},
    "gpt-3.5-turbo":        {"input": 0.0000005,  "output": 0.0000015},
    "o1":                   {"input": 0.000015,   "output": 0.000060},
    "o1-mini":              {"input": 0.000003,   "output": 0.000012},
    # Anthropic
    "claude-3-5-sonnet":    {"input": 0.000003,   "output": 0.000015},
    "claude-3-5-haiku":     {"input": 0.0000008,  "output": 0.000004},
    "claude-3-opus":        {"input": 0.000015,   "output": 0.000075},
    "claude-3-sonnet":      {"input": 0.000003,   "output": 0.000015},
    "claude-3-haiku":       {"input": 0.00000025, "output": 0.00000125},
    "claude-sonnet-4":      {"input": 0.000003,   "output": 0.000015},
    "claude-opus-4":        {"input": 0.000015,   "output": 0.000075},
    "claude-haiku-4":       {"input": 0.0000008,  "output": 0.000004},
    # Google
    "gemini-1.5-pro":       {"input": 0.0000025,  "output": 0.0000025},
    "gemini-1.5-flash":     {"input": 0.000000075,"output": 0.0000003},
    # Mistral
    "mistral-large":        {"input": 0.000003,   "output": 0.000009},
    "mistral-small":        {"input": 0.000001,   "output": 0.000003},
    # Meta (Llama via Groq/Together/etc.) — nominal
    "llama-3.3-70b":        {"input": 0.00000059, "output": 0.00000079},
    "llama-3.1-8b":         {"input": 0.00000005, "output": 0.00000008},
    "llama-3.1-70b":        {"input": 0.00000059, "output": 0.00000079},
    "llama3":               {"input": 0.00000005, "output": 0.00000008},
    "gemma2":               {"input": 0.0000002,  "output": 0.0000002},
}


def _normalise(model: str) -> str:
    """Strip date suffixes like -20241022 and lowercase."""
    return re.sub(r"-\d{6,8}$", "", model.lower())


def detect_vendor(model: str) -> str:
    m = model.lower()
    if m.startswith(("gpt", "o1", "o3")):
        return "openai"
    if m.startswith("claude"):
        return "anthropic"
    if m.startswith(("gemini", "gemma")):
        return "google"
    if m.startswith(("mistral", "mixtral")):
        return "mistral"
    if m.startswith("llama"):
        return "meta"
    return "unknown"


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> Decimal:
    key = _normalise(model)
    pricing = DEFAULT_PRICING.get(key)
    if not pricing:
        for k, v in DEFAULT_PRICING.items():
            if key.startswith(k) or k.startswith(key.split("-")[0]):
                pricing = v
                break
    if not pricing:
        return Decimal("0")
    cost = pricing["input"] * input_tokens + pricing["output"] * output_tokens
    return Decimal(str(round(cost, 8)))
