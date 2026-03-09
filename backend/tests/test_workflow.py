from ai_workflow import full_workflow

if __name__ == "__main__":
    sentence = "Deploy a scalable web app with a database and two servers."
    result = full_workflow(sentence)
    print("Result:", result)
