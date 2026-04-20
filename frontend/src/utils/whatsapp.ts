/**
 * Utility to handle WhatsApp sharing for Parent Access IDs
 */

export const sendParentAccessID = (phoneNumber: string, parentID: string, parentPin: string, language: 'en' | 'ml' = 'en') => {
  if (!phoneNumber) return;

  // Clean the phone number (remove non-digits, but keep the + if present)
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Format the message according to user request
  const messageEn = `Hey your child started an exciting journey with "Agentic Career Guidance AI System" ;Experience the future of career planning with our Student-First AI Discovery tool.\n\nRespected Sir/Mam your access id to us is- *${parentID}* and your password is *${parentPin}*\n\nView their profile here: ${window.location.origin}/parent/${parentID}`;
  
  const messageMl = `നമസ്കാരം! നിങ്ങളുടെ കുട്ടി "Agentic Career Guidance AI System"-നൊപ്പം ഒരു ആവേശകരമായ യാത്ര ആരംഭിച്ചിരിക്കുന്നു. ഞങ്ങളുടെ സ്റ്റുഡന്റ്-ഫസ്റ്റ് AI ഡിസ്കവറി ടൂളിലൂടെ കരിയർ പ്ലാനിംഗിന്റെ ഭാവി അനുഭവിക്കൂ.\n\nബഹുമാനപ്പെട്ട സർ/മാം, ഞങ്ങളുമായുള്ള നിങ്ങളുടെ ആക്സസ് ഐഡി ഇതാണ്- *${parentID}* കൂടാതെ നിങ്ങളുടെ പാസ്‌വേഡ് *${parentPin}* ആണ്\n\nഅവരുടെ പ്രൊഫൈൽ ഇവിടെ കാണാം: ${window.location.origin}/parent/${parentID}`;

  const finalMessage = language === 'ml' ? messageMl : messageEn;
  
  // WhatsApp URL (Web or Desktop)
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(finalMessage)}`;
  
  // Open in a new tab
  window.open(url, '_blank');
};
