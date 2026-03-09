from langchain.agents import create_react_agent, AgentExecutor
from langchain.tools import tool
from langchain_community.llms import Ollama
from langchain import hub  # pour récupérer un prompt standard
import requests

# Définition de l'outil
@tool
def deploy_infrastructure() -> str:
    """Déclenche un déploiement automatique via Terraform (Docker)."""
    response = requests.post("http://localhost:8000/deploy")
    if response.status_code == 200:
        data = response.json()
        return f"Déploiement réussi !\n{data['output']}"
    else:
        return f"Erreur : {response.text}"

# Modèle Ollama
llm = Ollama(model="phi")  # assure-toi que le modèle est téléchargé (ollama pull phi)

# Récupération du prompt ReAct standard depuis le hub
prompt = hub.pull("hwchase17/react")

# Création de l'agent
tools = [deploy_infrastructure]
agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

if __name__ == "__main__":
    print("Agent prêt. Tape 'quit' pour quitter.")
    while True:
        user_input = input("> ")
        if user_input.lower() == "quit":
            break
        response = agent_executor.invoke({"input": user_input})
        print(response["output"])
