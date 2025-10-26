require('dotenv').config();

const WHATSAPP_ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER; // Ej: +5493825123456

/**
 * Genera un enlace de WhatsApp que abre la app con mensaje pre-escrito
 */
const generateWhatsAppLink = (to, message) => {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${to.replace(/\D/g, '')}?text=${encodedMessage}`;
};

/**
 * Notifica al admin por consola (y opcionalmente log)
 * En un plan gratuito, el admin debe abrir el link manualmente
 */
const sendWhatsAppMessage = async (customerPhone, body) => {
  if (!WHATSAPP_ADMIN_NUMBER) {
    console.log('⚠️ WhatsApp no configurado. Agrega WHATSAPP_ADMIN_NUMBER en .env');
    return;
  }

  const adminMessage = `🔔 NUEVA RESERVA\n\nCliente: ${customerPhone}\n\n${body}\n\nResponder al cliente: https://wa.me/${customerPhone.replace(/\D/g, '')}`;

  console.log('📱 NOTIFICACIÓN WHATSAPP AL ADMIN:');
  console.log('═'.repeat(50));
  console.log(adminMessage);
  console.log('═'.repeat(50));
  console.log(`🔗 Link directo: ${generateWhatsAppLink(WHATSAPP_ADMIN_NUMBER, adminMessage)}`);

  return {
    status: 'pending',
    adminLink: generateWhatsAppLink(WHATSAPP_ADMIN_NUMBER, adminMessage)
  };
};

module.exports = {
  sendWhatsAppMessage,
  generateWhatsAppLink
};
