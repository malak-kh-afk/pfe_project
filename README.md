# PFE Project – AI DevOps Assistant

## Overview

This project is a full-stack application developed as part of a final-year engineering project (PFE).
It provides an **AI-powered assistant designed to help with DevOps and infrastructure tasks** by generating explanations, recommendations, and automation guidance.

The system combines a **modern web interface** with a **Python backend** that handles AI workflows and authentication.

---

## Project Architecture

```
pfe_project
│
├── backend
│   ├── main.py
│   ├── ai_agent.py
│   ├── ai_workflow.py
│   ├── auth.py
│   ├── intent.py
│   ├── requirements.txt
│   └── tests
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.ts
│
├── database
│   └── infra.db
│
├── README.md
└── .gitignore
```

---

## Technologies Used

### Frontend

* React
* Vite
* TypeScript
* Markdown rendering
* Syntax highlighting

### Backend

* Python
* FastAPI
* AI agent workflow system
* Authentication module

### Infrastructure

* SQLite database
* Git & GitHub for version control
* WSL development environment

---

## Features

* Interactive AI chat interface
* Infrastructure and DevOps explanations
* Markdown formatted responses
* Code highlighting
* Authentication system
* Modular AI workflow architecture

---

## Installation

### 1. Clone the repository

```
git clone https://github.com/your-username/pfe_project.git
cd pfe_project
```

---

### 2. Backend setup

```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

---

### 3. Frontend setup

```
cd ../frontend
npm install
npm run dev
```

---

## Running the Application

1. Start the **backend server**
2. Start the **frontend development server**
3. Open the browser at:

```
http://localhost:5173
```

---

## Future Improvements

* Kubernetes deployment
* Infrastructure diagram generation
* Terraform automation
* Cloud deployment support
* Multi-user authentication system

---

## Author

Malak – Data Analytics & AI Engineering Student

---

## License

This project was developed for educational purposes as part of a final-year 
