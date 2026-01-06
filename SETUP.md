# RAGQuery - Quick Setup Guide

## Prerequisites

Install these first:
1. **Node.js**: https://nodejs.org/ (LTS version)
2. **Python**: https://www.python.org/downloads/ (⚠️ Check "Add to PATH" during install)

## Install Dependencies

After installing Node.js and Python, run:

```powershell
.\install-all-deps.ps1
```

Or manually:
```powershell
# Node.js dependencies
npm install

# Python dependencies (with virtual environment)
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run the Application

```powershell
# Start frontend (Vite dev server)
npm run dev

# Start backend (Express API server)
npm run api
```

## Verify Installation

```powershell
node --version
python --version
npm list --depth=0
pip list | Select-String youtube
```

---

For detailed information, see the [walkthrough](file:///C:/Users/HP/.gemini/antigravity/brain/7c467036-aff5-4e7d-8a8d-c541fbb9e6f0/walkthrough.md).
