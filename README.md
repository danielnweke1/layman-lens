# 🔍 The Layman Lens

> **An AI-powered IDE workspace that decodes dense legal, medical, and academic jargon into plain English in real-time.** 

![Layman Lens Demo](https://via.placeholder.com/800x450.png?text=The+Layman+Lens+Workspace)

Have you ever stared at a 50-page legal contract or a dense medical study and wished it was written in plain English? **Layman Lens** is a beautiful, workspace-centric application designed to destroy jargon. It doesn't just explain complex documents—it rewrites them for you.

## Core Features

- **Universal Document Support:** Native backend support for parsing `.pdf` and `.docx` files.
- **Dynamic Audience Slider:** Tune your explanations. Want the explanation tuned for a 5-year-old? Or a College Grad? You have full control.
- **Magic Replace (Rich Text):** Don't just read the explanation. Click "Replace in Document" to physically swap out the confusing jargon with the simplified AI version permanently using the built-in rich text editor.
- **Context-Aware Follow-ups:** Still confused? Ask follow-up questions in the chat sidebar.
- **Lightning Fast Streams:** Powered by OpenAI's flagship `gpt-4o` model for deep comprehension and real-time chunk streaming.
- **Usage Dashboard:** A beautifully mocked SaaS settings tab with real-time browser-synced API usage tracking.

## Tech Stack

- **Frontend:** Vanilla HTML, JS, and custom CSS (Glassmorphism, CSS Grid/Flexbox).
- **Editor:** Quill.js for rich-text manipulation and exact cursor boundary replacement.
- **Backend:** Python, FastAPI, and Uvicorn.
- **AI Engine:** OpenAI ChatGPT API (`gpt-4o`).
- **Parsing Utilities:** `PyPDF2` (PDFs) and `python-docx` (Word Documents).

## 🚀 Local Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/layman-lens.git
cd layman-lens
```

### 2. Setup the Python Backend
Create a virtual environment and install the required dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Add your API Key
Create a `.env` file in the root directory and add your OpenAI API key:
```env
OPENAI_API_KEY=your_api_key_here
```

### 4. Run the App
Start the FastAPI server:
```bash
uvicorn main:app --reload
```
Then, simply open `index.html` in any modern web browser to enter the workspace!

## How it Works

1. **Upload your Jargon:** Paste any dense text or use the Upload button to import a document.
2. **Choose your Audience:** Use the slider in the Lens panel to set the complexity level.
3. **Highlight & Decode:** Highlight any confusing phrase in the editor. Click the glowing Explain button that pops up.
4. **Magic Rewrite:** Like the simple version better? Click "Replace in Document" to permanently swap out the jargon.
