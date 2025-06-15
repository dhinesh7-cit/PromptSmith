import os
import json
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please set it in a .env file.")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize FastAPI app
app = FastAPI(
    title="PromptSmith API",
    description="API for generating optimized prompts using Gemini Pro.",
    version="1.0.0"
)

# Allow CORS (important if frontend and backend are separate)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static frontend files
app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")

@app.get("/")
def serve_index():
    return FileResponse("../frontend/index.html")


# Request and Response models
class UserGoal(BaseModel):
    goal: str

class OptimizedPrompts(BaseModel):
    text_prompt: str
    image_prompt: str
    code_prompt: str | None = None
    variation1_text_prompt: str
    variation1_image_prompt: str
    variation1_code_prompt: str | None = None
    variation2_text_prompt: str
    variation2_image_prompt: str
    variation2_code_prompt: str | None = None

# Gemini Model
model = genai.GenerativeModel('gemini-1.5-flash')

# Prompt instructions
PROMPT_ENGINEERING_INSTRUCTIONS = """
You are an expert AI prompt engineer. Given a user goal or topic, return:

1.  A strong prompt for text generation (e.g., for models like Gemini, ChatGPT). This prompt should be detailed, provide context, and guide the AI towards a specific, high-quality output.
2.  A creative and descriptive prompt for image generation (e.g., for models like Midjourney, DALL·E, Stable Diffusion). This prompt should use vivid language, specify artistic style, mood, composition, and relevant details.
3.  A code-related prompt if the user's goal is clearly related to software development, programming, or scripting. If not applicable, state "Not applicable for code generation."
4.  Two variations of the above three prompts (text, image, and code if applicable).
    * Variation 1: Change the tone to be more formal and academic.
    * Variation 2: Change the style to be more experimental and abstract.

Format your entire response as a single, valid JSON object with the following keys:
"text_prompt": "...",
"image_prompt": "...",
"code_prompt": "..." OR "Not applicable for code generation.",
"variation1_text_prompt": "...",
"variation1_image_prompt": "...",
"variation1_code_prompt": "..." OR "Not applicable for code generation.",
"variation2_text_prompt": "...",
"variation2_image_prompt": "...",
"variation2_code_prompt": "..." OR "Not applicable for code generation."

Ensure the JSON is well-formed and can be directly parsed. Do not include any explanatory text outside of the JSON structure.

User goal: "{{user_input}}"
"""

# POST endpoint to generate prompts
@app.post("/generate-prompts/", response_model=OptimizedPrompts)
async def generate_prompts_endpoint(user_goal: UserGoal):
    if not user_goal.goal.strip():
        raise HTTPException(status_code=400, detail="User goal cannot be empty.")

    try:
        prompt = PROMPT_ENGINEERING_INSTRUCTIONS.replace("{{user_input}}", user_goal.goal)
        response = model.generate_content(prompt)

        if response.parts:
            generated_text = response.parts[0].text

            if generated_text.strip().startswith("```json"):
                generated_text = generated_text.strip()[7:-3].strip()
            elif generated_text.strip().startswith("```"):
                generated_text = generated_text.strip()[3:-3].strip()

            try:
                prompts_data = json.loads(generated_text)
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=500, detail=f"Error parsing JSON: {e}")

            expected_keys = [
                "text_prompt", "image_prompt", "code_prompt",
                "variation1_text_prompt", "variation1_image_prompt", "variation1_code_prompt",
                "variation2_text_prompt", "variation2_image_prompt", "variation2_code_prompt"
            ]

            for key in expected_keys:
                if key not in prompts_data:
                    if "code_prompt" in key and prompts_data.get(key) == "Not applicable for code generation.":
                        prompts_data[key] = None
                    else:
                        raise HTTPException(status_code=500, detail=f"Missing key: {key}")
                if prompts_data[key] == "Not applicable for code generation.":
                    prompts_data[key] = None

            return OptimizedPrompts(**prompts_data)
        else:
            error_message = "No text generated by Gemini model."
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                error_message += f" Blocked: {response.prompt_feedback.block_reason}"
            raise HTTPException(status_code=500, detail=error_message)

    except Exception as e:
        if "API key not valid" in str(e):
            raise HTTPException(status_code=401, detail="Invalid Gemini API Key.")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
@app.head("/")
def head_index():
    return


