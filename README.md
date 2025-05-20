# PromptSmith: Your Pocket Prompt Engineer 🔧✨

**PromptSmith** is your pocket prompt engineer — a smart web app powered by Gemini AI that helps you craft high-quality prompts for text, image, and code generation. Built with a simple HTML/CSS frontend and FastAPI backend, PromptSmith transforms your creative ideas into structured, AI-ready prompts.

---

## 🧠 Features

- Generate AI-ready prompts for:
  - 📜 Text Generation (e.g., storytelling, essays, dialog)
  - 🎨 Image Generation (e.g., Midjourney, DALL·E styles)
  - 💻 Code Simulation (e.g., problem setups, logic models)
- Gemini API integration for advanced GenAI capabilities
- Clean and responsive HTML/CSS UI
- FastAPI backend for smooth performance

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/dhinesh7-cit/PromptSmith.git
cd PromptSmith
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables
Create a `.env` file and add your Gemini API key:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the FastAPI Server
```bash
uvicorn main:app --reload
```

### 5. Open the Frontend
Open `index.html` in your browser or serve it with a local web server.

---

## 📁 Project Structure

```
promptsmith/
├── backend/
│   └── main.py                  # FastAPI logic + Gemini integration
├── frontend/
│   ├── index.html               # Main HTML structure for the UI
│   ├── styles.css               # All CSS styles for UI, themes, and animated background
│   └── script.js                # JavaScript for UI logic, API calls, and dynamic background animation
├── .env                         # Stores your GEMINI_API_KEY (YOU CREATE THIS MANUALLY)
└── requirements.txt
```

---

## 🧑‍💻 Author

- Developed by **Dhinesh**  
- Tagline: *"Your Pocket Prompt Engineer."*

---

## 🛡️ License

© 2025 PromptSmith. Engineered by AI, crafted by Dhinesh.
