// src/utils/emailNotifications.js - Real Email System with EmailJS
import emailjs from 'emailjs-com';

// EmailJS Configuration - Replace with your actual values from EmailJS dashboard
const EMAILJS_CONFIG = {
  publicKey: 'YOUR_PUBLIC_KEY_HERE',  // Get from EmailJS dashboard → Account → General
  serviceId: 'YOUR_SERVICE_ID_HERE',  // Your email service ID from Email Services
  templateId: 'YOUR_TEMPLATE_ID_HERE' // Your email template ID from Email Templates
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

export const checkAndSendLowStockAlert = async (products, userEmail) => {
  try {
    // Get last notification date from localStorage
    const lastNotificationDate = localStorage.getItem('lastLowStockNotification');
    const today = new Date().toDateString();
    
    // Only send one notification per day
    if (lastNotificationDate === today) {
      console.log("Low stock notification already sent today");
      return { sent: false, reason: "Already sent today" };
    }

    // Find low stock items
    const lowStockItems = products.filter(product => 
      Number(product.quantity) <= Number(product.minQty || 5)
    );

    if (lowStockItems.length === 0) {
      console.log("No low stock items found");
      return { sent: false, reason: "No low stock items" };
    }

    // Ask user if they want to send the email
    const emailContent = createLowStockEmailContent(lowStockItems);
    const shouldSend = confirm(
      `Low Stock Alert!\n\n${lowStockItems.length} items are running low:\n\n` +
      lowStockItems.map(item => `• ${item.name}: ${item.quantity} remaining (min: ${item.minQty || 5})`).join('\n') +
      `\n\nSend email notification to ${userEmail}?`
    );

    if (shouldSend) {
      const result = await sendRealEmail(emailContent, userEmail);
      
      if (result.success) {
        // Mark notification as sent
        localStorage.setItem('lastLowStockNotification', today);
        return { sent: true, result };
      } else {
        return { sent: false, error: result.error };
      }
    }

    return { sent: false, reason: "User cancelled" };

  } catch (error) {
    console.error("Error sending low stock notification:", error);
    return { sent: false, error: error.message };
  }
};

const createLowStockEmailContent = (lowStockItems) => {
  const totalValue = lowStockItems.reduce((sum, item) => 
    sum + (Number(item.quantity) * Number(item.price)), 0
  );

  const lowStockList = lowStockItems.map(item => 
    `${item.name}: ${item.quantity} left (min: ${item.minQty || 5}) - $${Number(item.price || 0).toFixed(2)} each`
  ).join('\n');

  return {
    subject: `Low Stock Alert - ${lowStockItems.length} Items Need Attention`,
    itemCount: lowStockItems.length,
    itemsList: lowStockList,
    totalValue: totalValue.toFixed(2),
    alertDate: new Date().toLocaleDateString(),
    alertTime: new Date().toLocaleTimeString()
  };
};

const sendRealEmail = async (emailContent, recipientEmail) => {
  try {
    console.log("Sending real email via EmailJS...");
    
    // Check if EmailJS is configured
    if (EMAILJS_CONFIG.publicKey === 'YOUR_PUBLIC_KEY_HERE') {
      throw new Error("EmailJS not configured. Please update EMAILJS_CONFIG with your actual credentials.");
    }
    
    // Prepare template parameters for EmailJS
    const templateParams = {
      to_email: recipientEmail,
      to_name: recipientEmail.split('@')[0],
      subject: emailContent.subject,
      item_count: emailContent.itemCount,
      items_list: emailContent.itemsList,
      total_value: emailContent.totalValue,
      alert_date: emailContent.alertDate,
      alert_time: emailContent.alertTime,
      system_name: "SIMS (Stock Inventory Management System)"
    };

    console.log("Sending email with parameters:", templateParams);

    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log("Email sent successfully:", response);
    
    return { 
      success: true, 
      message: "Email sent successfully!",
      response: response
    };

  } catch (error) {
    console.error("Error sending email:", error);
    
    // Show user-friendly error message
    let errorMessage = "Failed to send email: ";
    if (error.message.includes("not configured")) {
      errorMessage += "EmailJS not configured properly.";
    } else if (error.status === 400) {
      errorMessage += "Invalid email configuration.";
    } else if (error.status === 402) {
      errorMessage += "EmailJS quota exceeded.";
    } else {
      errorMessage += error.message || "Unknown error occurred.";
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

// Manual notification trigger for testing
export const sendTestLowStockNotification = async (products, userEmail) => {
  const lowStockItems = products.filter(product => 
    Number(product.quantity) <= Number(product.minQty || 5)
  );
  
  if (lowStockItems.length === 0) {
    alert("No low stock items found for testing");
    return { sent: false, reason: "No low stock items" };
  }
  
  const emailContent = createLowStockEmailContent(lowStockItems);
  const result = await sendRealEmail(emailContent, userEmail);
  
  if (result.success) {
    alert("Test notification sent successfully!");
  } else {
    alert("Failed to send test notification: " + result.error);
  }
  
  return result;
};

// Configuration checker
export const checkEmailConfiguration = () => {
  const isConfigured = EMAILJS_CONFIG.publicKey !== 'e-HfAnRBHLgUWB-1A' &&
                      EMAILJS_CONFIG.serviceId !== 'service_puf1cyz' &&
                      EMAILJS_CONFIG.templateId !== 'template_I85zu0p';
  
  return {
    configured: isConfigured,
    config: EMAILJS_CONFIG
  };
};

// Set EmailJS configuration (for when user provides their credentials)
export const setEmailConfiguration = (publicKey, serviceId, templateId) => {
  EMAILJS_CONFIG.publicKey = publicKey;
  EMAILJS_CONFIG.serviceId = serviceId;
  EMAILJS_CONFIG.templateId = templateId;
  
  // Reinitialize EmailJS with new public key
  emailjs.init(publicKey);
  
  // Save to localStorage for persistence
  localStorage.setItem('emailjs_config', JSON.stringify(EMAILJS_CONFIG));
  
  return checkEmailConfiguration();
};

// Load configuration from localStorage on startup
const loadSavedConfiguration = () => {
  try {
    const savedConfig = localStorage.getItem('emailjs_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      Object.assign(EMAILJS_CONFIG, config);
      emailjs.init(EMAILJS_CONFIG.publicKey);
    }
  } catch (error) {
    console.error("Error loading saved EmailJS configuration:", error);
  }
};

// Load saved configuration when module is imported
loadSavedConfiguration();