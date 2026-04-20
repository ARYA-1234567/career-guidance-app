import logging
import json

# Configure logging to simulate bot activity in agents.log
logger = logging.getLogger("WhatsAppBot")

def send_whatsapp_bot_message(phone_number: str, parent_id: str, parent_pin: str, origin_url: str, language: str = 'en'):
    """
    Simulates sending a WhatsApp message via a Bot API.
    To use a real provider (like Twilio), replace the print statement below with an actual API call.
    """
    clean_number = "".join(filter(str.isdigit, phone_number))
    if not clean_number.startswith("+"):
        clean_number = "+" + clean_number # Assume global format or handle as needed
    
    # Message Template
    if language == 'ml':
        message = (
            f"നിങ്ങളുടെ കുട്ടി കരിയർ ഗൈഡൻസ് ആപ്പിൽ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്.\n\n"
            f"പേരന്റ് മോഡ് ആക്സസ് ചെയ്യാൻ താഴെ പറയുന്ന ക്രെഡൻഷ്യലുകൾ ഉപയോഗിക്കുക:\n\n"
            f"Parent ID: {parent_id}\n"
            f"PIN: {parent_pin}\n\n"
            f"ഈ ആക്സസ് റീഡ്-ഒൺലി മാത്രമായിട്ടുള്ളതാണ്, കൂടാതെ ഇത് മാർഗ്ഗനിർദ്ദേശ ആവശ്യങ്ങൾക്കായിട്ടാണ്."
        )
    else:
        message = (
            f"Your child has registered in Career Guidance App.\n\n"
            f"Use the following credentials to access Parent Mode:\n\n"
            f"Parent ID: {parent_id}\n"
            f"PIN: {parent_pin}\n\n"
            f"This access is read-only and meant for guidance purposes."
        )

    # SIMULATION: Log the message to the console and agents.log
    simulation_log = {
        "event": "WHATSAPP_BOT_SEND_SUCCESS",
        "to": clean_number,
        "message": message,
        "provider": "MockBotService_ACGS"
    }
    
    logger.info(f"BOT MESSAGE SENT: {json.dumps(simulation_log, indent=2)}")
    print(f"\n--- WHATSAPP BOT SIMULATION ---\nTO: {clean_number}\nMESSAGE: {message}\n-------------------------------\n")
    
    return True
