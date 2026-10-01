import os
import io
from fastapi import FastAPI, HTTPException, File, UploadFile
import PyPDF2
import docx
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="The Layman Lens API")

# Configure CORS so the frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
# It automatically picks up GEMINI_API_KEY from the environment
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key.startswith('"') and api_key.endswith('"'):
        api_key = api_key[1:-1]
    
    # Pass via http_options to force x-goog-api-key header for the new AQ. key formats
    client = genai.Client(http_options={'headers': {'x-goog-api-key': api_key}})
except Exception as e:
    print("Warning: Failed to initialize Gemini Client. Make sure GEMINI_API_KEY is set in your environment or .env file.")
    client = None

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    full_context: str
    highlighted_text: str
    chat_history: list[Message] = []
    new_question: str | None = None
    complexity: str = "5-year-old"

def get_system_instruction(complexity: str):
    return f"""
You are an expert at simplifying dense, complex text filled with jargon from ANY field (medical, legal, financial, technical, academic, etc.).
Your goal is to translate the highlighted text into plain English tailored specifically for a {complexity}.

Guidelines:
1. Identify the core message of the text based on the surrounding document context.
2. BE CONCISE. Your response MUST be 20 sentences maximum. Never write long paragraphs.
3. If the highlighted portion is a single word, give a punchy, one-sentence definition based on the context.
4. Adjust your vocabulary and tone to match the comprehension level of a {complexity}.
5. If appropriate, use a very brief analogy.
6. NEVER be condescending.
7. Return ONLY the simplified explanation, formatted nicely in Markdown.
"""

@app.post("/simplify-stream")
async def simplify_text_stream(request: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini Client is not initialized.")
    
    if not request.highlighted_text:
        raise HTTPException(status_code=400, detail="No highlighted text provided.")

    async def generate():
        try:
            # Build the conversation history for Gemini
            contents = []
            
            # 1. Initial Prompt
            initial_prompt = f"Here is the full document for context:\n{request.full_context}\n\nBased on the context above, please explain the following highlighted portion specifically for a {request.complexity}. If it's a single word, define it simply. Avoid jargon:\n\"{request.highlighted_text}\""
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=initial_prompt)]))
            
            # 2. Append Chat History
            for msg in request.chat_history:
                role = "model" if msg.role == "model" else "user"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
            
            # 3. Append New Question (if any)
            if request.new_question:
                contents.append(types.Content(role="user", parts=[types.Part.from_text(text=request.new_question)]))

            response = client.models.generate_content_stream(
                model='gemini-3.8-flash',
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=get_system_instruction(request.complexity),
                    temperature=0.3,
                )
            )
            for chunk in response:
                yield chunk.text
        except Exception as e:
            error_msg = str(e)
            print(f"Error calling Gemini stream: {error_msg}")
            
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                yield "\n\n**Too many rapid requests!** You're decoding jargon faster than the engine can process. Please wait 15 seconds and try again. ⏳"
            elif "503" in error_msg or "UNAVAILABLE" in error_msg:
                yield "\n\n**API Busy:** The Gemini model is currently experiencing high demand. Please try again in a few seconds. 🔄"
            else:
                yield f"\n\n**Error:** Failed to simplify text."

    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename.lower()
    if not (filename.endswith(".pdf") or filename.endswith(".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
    
    try:
        content = await file.read()
        extracted_text = ""
        
        if filename.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n\n"
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            for para in doc.paragraphs:
                if para.text.strip():
                    extracted_text += para.text + "\n\n"
                
        return {"text": extracted_text.strip()}
    except Exception as e:
        print(f"Error parsing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
