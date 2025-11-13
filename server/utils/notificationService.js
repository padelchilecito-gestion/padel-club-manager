require('dotenv').config();

// Placeholder for a real WhatsApp API client (like Twilio, Meta's API, etc.)

const WHATSAPP_SENDER_NUMBER = process.env.WHATSAPP_SENDER_NUMBER;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

/**
 * Sends a WhatsApp message.
 * This is a placeholder function. In a real application, this would
 * make an API call to a WhatsApp Business API provider.
 * @param {string} to - The recipient's phone number (e.g., 'whatsapp:+14155238886')
 * @param {string} body - The message content.
 */
const sendWhatsAppMessage = async (to, body) => {
  if (!WHATSAPP_SENDER_NUMBER || !WHATSAPP_API_TOKEN) {
    console.log('WhatsApp credentials not configured. Skipping message.');
    return;
  }

  console.log('--- SIMULATING WHATSAPP MESSAGE ---');
  console.log(`From: ${WHATSAPP_SENDER_NUMBER}`);
  console.log(`To: ${to}`);
  console.log(`Body: ${body}`);
  console.log('------------------------------------');
  
  // In a real implementation, you would have something like:
  /*
  try {
    const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
    const message = await client.messages.create({
      from: `whatsapp:${WHATSAPP_SENDER_NUMBER}`,
      to: `whatsapp:${to}`,
      body: body,
    });
    console.log(`WhatsApp message sent successfully. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error;
  }
  */
  return Promise.resolve({ status: 'simulated_success' });
};

module.exports = {
  sendWhatsAppMessage,
};
