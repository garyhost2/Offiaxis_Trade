import os
import base64
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv()

async def extract_permit_data(image_base64: str) -> dict:
    """
    Extract permit information from an image using GPT-4 Vision
    
    Args:
        image_base64: Base64 encoded image string
        
    Returns:
        Dictionary with extracted permit data
    """
    api_key = os.getenv("EMERGENT_LLM_KEY")
    
    if not api_key:
        raise ValueError("EMERGENT_LLM_KEY not found in environment variables")
    
    # Initialize chat with GPT-4 Vision
    chat = LlmChat(
        api_key=api_key,
        session_id=f"permit-extraction-{os.urandom(8).hex()}",
        system_message="You are a specialized AI assistant that extracts permit information from documents. Extract data accurately and return it in JSON format."
    ).with_model("openai", "gpt-4o")
    
    # Create image content
    image_content = ImageContent(image_base64=image_base64)
    
    # Create extraction prompt
    prompt = """
    Analyze this permit document and extract the following information:
    
    1. Permit Number (look for: "Permit No", "Permit Number", "Permit #", or similar)
    2. Issue Date (look for: "Issue Date", "Date Issued", "Issued On", or similar)
    3. Expiration Date (look for: "Expiration", "Expiration Date", "Expires", "Valid Until", or similar)
    4. Fees (look for: "Fee", "Fees", "Total Fee", "Amount", "Cost", or similar - include currency symbol)
    
    Return ONLY a JSON object with these exact keys (use null if not found):
    {
        "permitNumber": "string or null",
        "issueDate": "string or null",
        "expirationDate": "string or null",
        "fees": "string or null"
    }
    
    Do not include any explanation or additional text, only the JSON object.
    """
    
    user_message = UserMessage(
        text=prompt,
        file_contents=[image_content]
    )
    
    # Send message and get response
    response = await chat.send_message(user_message)
    
    # Parse JSON response
    import json
    try:
        # Clean response (remove markdown code blocks if present)
        cleaned_response = response.strip()
        if cleaned_response.startswith("```"):
            # Remove code block markers
            lines = cleaned_response.split("\n")
            cleaned_response = "\n".join(lines[1:-1] if len(lines) > 2 else lines)
        
        data = json.loads(cleaned_response)
        return {
            "permitNumber": data.get("permitNumber"),
            "issueDate": data.get("issueDate"),
            "expirationDate": data.get("expirationDate"),
            "fees": data.get("fees"),
            "success": True
        }
    except json.JSONDecodeError as e:
        return {
            "permitNumber": None,
            "issueDate": None,
            "expirationDate": None,
            "fees": None,
            "success": False,
            "error": f"Failed to parse AI response: {str(e)}",
            "raw_response": response
        }
