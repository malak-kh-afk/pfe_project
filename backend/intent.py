def detect_intent(message: str):
    message = message.lower()

    greetings = ["hello", "hi", "hey", "bonjour", "salut"]

    if any(greet in message for greet in greetings):
        return "greeting"

    infra_keywords = [
        "server", "database", "deploy", "scalable",
        "infrastructure", "cluster", "kubernetes"
    ]

    if any(word in message for word in infra_keywords):
        return "infrastructure"

    return "general"
