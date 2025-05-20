import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure the Gemini API key
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

# CORS (Cross-Origin Resource Sharing) middleware
# Allows requests from your frontend (running on a different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for simplicity, adjust for production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Pydantic model for request body
class UserGoal(BaseModel):
    goal: str

# Pydantic model for response body (optional, but good practice)
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


# Initialize the Generative Model
# Using gemini-1.5-flash as it's generally faster and more cost-effective for many tasks
# You can also use 'gemini-pro' if preferred.
model = genai.GenerativeModel('gemini-1.5-flash')

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

@app.post("/generate-prompts/", response_model=OptimizedPrompts)
async def generate_prompts_endpoint(user_goal: UserGoal):
    """
    Receives a user goal and returns optimized prompts for text, image, and code generation.
    """
    if not user_goal.goal.strip():
        raise HTTPException(status_code=400, detail="User goal cannot be empty.")

    try:
        # Prepare the prompt for Gemini
        prompt_for_gemini = PROMPT_ENGINEERING_INSTRUCTIONS.replace("{{user_input}}", user_goal.goal)

        # Call the Gemini API
        response = model.generate_content(prompt_for_gemini)

        # Extract the generated text and parse it as JSON
        # The response might be in markdown format (e.g., ```json\n...\n```), so we need to clean it.
        if response.parts:
            generated_text = response.parts[0].text
            # Basic cleaning for potential markdown ```json ... ```
            if generated_text.strip().startswith("```json"):
                generated_text = generated_text.strip()[7:-3].strip()
            elif generated_text.strip().startswith("```"): # Less specific but common
                generated_text = generated_text.strip()[3:-3].strip()

            try:
                import json
                prompts_data = json.loads(generated_text)
            except json.JSONDecodeError as e:
                print(f"JSONDecodeError: {e}")
                print(f"Raw Gemini Response: {generated_text}")
                raise HTTPException(status_code=500, detail=f"Error parsing Gemini response as JSON. Raw response: {generated_text}")

            # Validate that all expected keys are present
            expected_keys = [
                "text_prompt", "image_prompt", "code_prompt",
                "variation1_text_prompt", "variation1_image_prompt", "variation1_code_prompt",
                "variation2_text_prompt", "variation2_image_prompt", "variation2_code_prompt"
            ]
            for key in expected_keys:
                if key not in prompts_data:
                    # Allow 'None' for code prompts if they are not applicable
                    if "code_prompt" in key and prompts_data.get(key, "Not applicable for code generation.") == "Not applicable for code generation.":
                         prompts_data[key] = None # Set to None for Pydantic model
                    else:
                        raise HTTPException(status_code=500, detail=f"Gemini response missing expected key: {key}. Response: {prompts_data}")
                # Ensure "Not applicable..." strings are converted to None for Pydantic model
                if prompts_data[key] == "Not applicable for code generation.":
                    prompts_data[key] = None


            return OptimizedPrompts(**prompts_data)

        else:
            # Handle cases where response.parts is empty or does not contain text
            # This could be due to safety filters or other issues.
            error_message = "Failed to generate prompts. The response from the generative model was empty or did not contain text."
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                error_message += f" Reason: {response.prompt_feedback.block_reason_message or response.prompt_feedback.block_reason}"
            raise HTTPException(status_code=500, detail=error_message)

    except Exception as e:
        print(f"An error occurred: {e}")
        # Check if it's a Google API related error for more specific feedback
        if "API key not valid" in str(e):
             raise HTTPException(status_code=401, detail="Invalid Gemini API Key. Please check your configuration.")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# To run the backend:
# 1. Create a .env file in the `promptsmith/` directory with your GEMINI_API_KEY:
#    GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
# 2. Navigate to the `promptsmith/` directory in your terminal.
# 3. Run: uvicorn backend.main:app --reload
#    The API will be available at http://127.0.0.1:8000