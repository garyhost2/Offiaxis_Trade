"""
Site Notes AI - AI-powered job site documentation generator
Uses GPT-4 Vision to analyze construction site photos and voice notes
to generate punch lists, checklists, and material lists.
"""

import os
import json
import logging
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

async def process_site_notes(
    images_base64: List[str],
    voice_notes: List[str],
    project_context: Optional[str] = None
) -> dict:
    """
    Process site photos and voice notes using AI to generate job documentation.
    
    Args:
        images_base64: List of base64 encoded images from the job site
        voice_notes: List of transcribed voice notes/commands
        project_context: Optional context about the project type
    
    Returns:
        dict containing punchList, checklist, and materialList
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment variables")
        
        # Build the system message for construction documentation
        system_message = """You are an expert construction site documentation assistant. 
Your job is to analyze job site photos and voice notes from contractors to generate comprehensive job documentation.

You MUST respond with a valid JSON object containing these three sections:

1. "punchList": An array of punch list items - specific tasks that need to be completed or issues that need to be fixed. Each item should have:
   - "id": unique string identifier
   - "description": detailed description of the task/issue
   - "location": where in the job site (if identifiable)
   - "priority": "High", "Medium", or "Low"
   - "status": "Pending"

2. "checklist": An array of checklist items - verification steps and quality checks. Each item should have:
   - "id": unique string identifier
   - "task": the task to verify
   - "category": category like "Electrical", "Plumbing", "Framing", "Finishing", "Safety", etc.
   - "checked": false

3. "materialList": An array of materials needed. Each item should have:
   - "id": unique string identifier
   - "name": material name
   - "quantity": estimated quantity needed (as string with unit)
   - "category": category like "Electrical", "Plumbing", "Lumber", "Hardware", "Finishing", etc.
   - "notes": any special notes about the material

Analyze the images carefully for:
- Incomplete work or defects
- Safety issues
- Materials visible or needed
- Quality concerns
- Code compliance issues

Use the voice notes to understand the contractor's intent and any specific concerns mentioned.

IMPORTANT: Only respond with the JSON object, no additional text or markdown formatting."""

        # Initialize chat with GPT-4 Vision
        chat = LlmChat(
            api_key=api_key,
            session_id=f"site-notes-{os.urandom(8).hex()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Build the user message with images and voice notes
        voice_notes_text = "\n".join([f"- {note}" for note in voice_notes]) if voice_notes else "No voice notes provided."
        
        context_text = f"\nProject Context: {project_context}" if project_context else ""
        
        message_text = f"""Please analyze these job site photos and voice notes to generate a comprehensive punch list, checklist, and material list.

Voice Notes from Contractor:
{voice_notes_text}
{context_text}

Based on what you see in the photos and the contractor's notes, generate the documentation in JSON format."""

        # Create file contents for images
        file_contents = []
        for img_base64 in images_base64[:10]:  # Limit to 10 images
            # Clean base64 if it has data URL prefix
            if ',' in img_base64:
                img_base64 = img_base64.split(',')[1]
            file_contents.append(FileContent(content_type="image/jpeg", file_content_base64=img_base64))
        
        # Create user message with files
        if file_contents:
            user_message = UserMessage(
                text=message_text,
                file_contents=file_contents
            )
        else:
            user_message = UserMessage(text=message_text)
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        logger.info(f"AI Response received: {response[:500]}...")
        
        # Parse the JSON response
        try:
            # Try to extract JSON from the response
            response_text = response.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            result = json.loads(response_text.strip())
            
            # Ensure all required fields exist
            if "punchList" not in result:
                result["punchList"] = []
            if "checklist" not in result:
                result["checklist"] = []
            if "materialList" not in result:
                result["materialList"] = []
            
            return {
                "success": True,
                "punchList": result["punchList"],
                "checklist": result["checklist"],
                "materialList": result["materialList"],
                "error": None
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response was: {response}")
            
            # Return a fallback response
            return {
                "success": False,
                "punchList": [],
                "checklist": [],
                "materialList": [],
                "error": f"Failed to parse AI response: {str(e)}",
                "raw_response": response
            }
            
    except Exception as e:
        logger.error(f"Error processing site notes: {str(e)}")
        return {
            "success": False,
            "punchList": [],
            "checklist": [],
            "materialList": [],
            "error": str(e)
        }


async def transcribe_voice_note(audio_base64: str) -> str:
    """
    Transcribe a voice note to text.
    For now, this is a placeholder - in production, you'd use Whisper API.
    
    Args:
        audio_base64: Base64 encoded audio file
    
    Returns:
        Transcribed text
    """
    # In a production implementation, you would:
    # 1. Decode the base64 audio
    # 2. Send to OpenAI Whisper API or similar
    # 3. Return the transcription
    
    # For now, return empty - the user will type or simulate voice input
    return ""
