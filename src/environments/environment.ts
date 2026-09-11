export const environment = {
  production: false,
  appName: 'HiTech Mobile & Accessories',
  admin: {
    email: 'bhuvaneshwaranaj@gmail.com',
    passwordHash: '421d194eed97614f3a06a8867a1595ebb688432356d1d5ff0586be34ccb698e5',
    role: 'admin'
  },
  emailJs: {
    // Replace these with your actual EmailJS credentials or configure them in the Admin Settings panel
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    otpTemplateId: 'YOUR_EMAILJS_OTP_TEMPLATE_ID',
    orderTemplateId: 'YOUR_EMAILJS_ORDER_TEMPLATE_ID',
    notificationEmail: 'bhuvaneshwaranaj@gmail.com'
  },
  otpExpirySeconds: 60
};
