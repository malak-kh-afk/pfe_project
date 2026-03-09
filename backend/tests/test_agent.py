from langchain.agents import create_react_agent, AgentExecutor
from langchain.tools import tool
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
import requests

# Définition de l'outil
@tool
def deploy_infrastructure() -> str:
    """Déclenche un déploiement automatique via Terraform (Docker)."""
    try:
        response = requests.post("http://localhost:8000/deploy")
        if response.status_code == 200:
            data = response.json()
            return f"Déploiement réussi !\n{data['output']}"
        else:
            return f"Erreur HTTP {response.status_code}"
    except Exception as e:
        return f"Erreur de connexion : {e}"

# Modèle
llm = Ollama(model="tinyllama")

# Prompt personnalisé (plus simple)
prompt = PromptTemplate.from_template(
    "You are an assistant that can deploy infrastructure. "
    "You have access to the following tool: {tools}\n"
    "Use it only when the user asks to deploy something. "
    "Otherwise, just chat normally.\n\n"
    "User: {input}\n"
    "Assistant:"
)

# Création de l'agent
tools = [deploy_infrastructure]
agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)

if __name__ == "__main__":
    print("Agent prêt. Tapez 'quit' pour quitter.")
    while True:
        user_input = input("> ")
        if user_input.lower() == "quit":
            break
        try:
            response = agent_executor.invoke({"input": user_input})
            print(response["output"])
        except Exception as e:
            print(f"Erreur : {e}")
