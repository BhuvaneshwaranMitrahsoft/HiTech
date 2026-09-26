export const environment = {
  production: false,
  appName: 'HiTech Mobile & Accessories',
  admin: {
    email: 'bhuvaneshwaranaj@gmail.com',
    passwordHash: '421d194eed97614f3a06a8867a1595ebb688432356d1d5ff0586be34ccb698e5',
    role: 'admin'
  },
  emailJs: {
    // Standard EmailJS credentials for order & service booking notifications
    publicKey: 'J7n3H1W9g5lTOz_yn',
    serviceId: 'service_4blnuwl',
    orderTemplateId: 'template_x4bv6v9',
    serviceBookingTemplateId: 'template_service_booking',
    notificationEmail: 'bhuvaneshwaranaj@gmail.com'
  },
  otpExpirySeconds: 60,
  hub: {
    name: 'HiTech Service Center',
    address: 'Anna Salai, Chennai, Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    pickupRadiusKm: 30
  },
  github: {
    owner: 'BhuvaneshwaranMitrahsoft',
    repo: 'HiTech',
    branch: 'main'
  }
};
