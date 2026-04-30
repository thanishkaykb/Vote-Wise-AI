# 🗳️ VoteWise AI

### *AI-powered civic decision engine for smarter, personalized voting*

---

## 🚀 Overview

**VoteWise AI** is an intelligent platform that helps users make informed voting decisions by aligning political choices with their personal values, preferences, and priorities.

Instead of overwhelming users with complex manifestos and candidate data, VoteWise simplifies everything using AI — turning confusion into clarity.

---

## 🎯 Problem

Modern elections are complicated:

* Too many candidates & policies
* Information overload
* Bias & misinformation everywhere
* Low engagement from young voters

👉 Result: People either don’t vote… or vote without clarity.

---

## 💡 Solution

VoteWise AI acts like a **personal political advisor**:

* 🧠 Understands user values through interaction
* 📊 Analyzes candidates & policies using AI
* 🎯 Recommends best-aligned choices
* 🗣️ Explains *why* each recommendation is made

---

## ⚙️ Features

### 🧠 AI Recommendation Engine

Matches user preferences with candidates using intelligent scoring

### 💬 Conversational Interface

Chat-based system for natural interaction

### 🌍 Multi-language Support

Accessible to diverse users

### 🔍 Transparent Explanations

Shows reasoning behind every recommendation

### 📱 Cross-platform

Works on both mobile and web

### 🔐 Privacy-first

Minimal data collection, no long-term storage

---

## 🏗️ Tech Stack

| Layer       | Tech Used                          |
| ----------- | ---------------------------------- |
| Frontend    | HTML, CSS, JS                      |
| Backend     | Python, Flask                      |
| AI Layer    | OpenAI API / LLMs                  |
| Data        | Web scraping + structured datasets |
| Integration | LangChain                          |

---

## 📂 Project Structure

```
Vote-Wise-AI/
│
├── app.py              # Main Flask app
├── models.py          # Data models
├── prompts.py         # AI prompt logic
├── ballot.py          # Voting logic
├── forms.py           # User input handling
├── talker.py          # Chat system
├── enrich_data.py     # Data processing
├── static/            # CSS, JS
├── templates/         # HTML files
├── data/              # Datasets
├── requirements.txt   # Dependencies
└── README.md
```

---

## 🛠️ Installation

### 1. Clone the repo

```bash
git clone https://github.com/thanishkaykb/Vote-Wise-AI
cd Vote-Wise-AI
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set API Keys

#### Windows

```bash
set OPENAI_API_KEY=your_key_here
set ANTHROPIC_API_KEY=your_key_here
```

#### Mac/Linux

```bash
export OPENAI_API_KEY=your_key_here
export ANTHROPIC_API_KEY=your_key_here
```

---

## ▶️ Running the App

```bash
flask run
```

Open in browser:

```
http://127.0.0.1:5000/
```

---

## 🧪 How It Works

1. User interacts via chat
2. System collects preferences
3. AI processes candidate + policy data
4. Matching algorithm scores alignment
5. Recommendations + explanations are shown

---

## 🌍 Impact

VoteWise AI aims to:

* 🗳️ Increase voter participation
* ⚖️ Promote informed decision-making
* 🌐 Reduce misinformation impact
* 🤝 Strengthen democratic systems

---

## 🧠 Future Enhancements

* Real-time election data integration
* Mobile app version
* Voice-based interaction
* Region-specific recommendation engine
* Advanced bias detection

---

## 🤝 Contributing

Contributions are welcome!

```bash
1. Fork the repo
2. Create a new branch
3. Make changes
4. Submit a PR
```

---

## 💬 Final Note

VoteWise AI isn’t just a project.
It’s like giving every voter a *thinking partner* before they step into the booth.

---
