# Project Overview

This project is a personal finance tracker with an integrated AI agent.

The system is split into two repositories:

- frontend: React web app
- backend: FastAPI API and AI agent

The main interaction happens through a chat interface where the user can send natural language messages such as:

"I spent $20 on coffee"

The backend interprets the message and stores structured financial data.

# Frontend Stack

React
Vite
TypeScript
TailwindCSS

# Responsibilities

- provide the web interface
- render the chat experience
- display financial data
- show statistics

# Main UI Sections

Chat interface (primary feature)
Expenses list
Statistics dashboard
Accounts overview

# API Usage

The frontend communicates with the backend through REST endpoints.

Example:

POST /chat

Request:
{
  message: string
}

Response:
{
  reply: string
}

# Coding Principles

Prefer simple and readable code.

Avoid unnecessary abstractions.

Keep functions small and focused.

Use descriptive variable names.