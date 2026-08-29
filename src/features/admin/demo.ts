export const demoLeadRows = [
  {
    id: "lead_125",
    leadNumber: "ENQ-2026-00125",
    customer: "Ravi Sharma",
    mobile: "9876543210",
    product: "Dell Latitude 5420",
    dealer: "Dealer A",
    source: "DEALER_REFERRAL",
    status: "NEW",
    amount: 42900,
  },
  {
    id: "lead_124",
    leadNumber: "ENQ-2026-00124",
    customer: "Asha Menon",
    mobile: "9988776655",
    product: "Canon PIXMA G3770",
    dealer: "Direct",
    source: "WEBSITE",
    status: "CONTACTED",
    amount: 16900,
  },
  {
    id: "lead_123",
    leadNumber: "ENQ-2026-00123",
    customer: "Suresh Patel",
    mobile: "9123456780",
    product: "HP EliteDesk i5 Desktop Set",
    dealer: "Dealer B",
    source: "DEALER_REFERRAL",
    status: "WON",
    amount: 24900,
  },
];

export const demoNotificationJobs = [
  {
    id: "job_001",
    recipient: "customer@example.com",
    channel: "EMAIL",
    event: "PRICE_CHANGED",
    status: "PENDING",
    attempts: 0,
  },
  {
    id: "job_002",
    recipient: "919812345678",
    channel: "WHATSAPP",
    event: "BACK_IN_STOCK",
    status: "FAILED",
    attempts: 2,
  },
  {
    id: "job_003",
    recipient: "owner@example.com",
    channel: "IN_APP",
    event: "PRODUCT_UPDATED",
    status: "SENT",
    attempts: 1,
  },
];

export const demoSubscriptions = [
  {
    id: "sub_001",
    contact: "customer@example.com",
    target: "Dell Latitude 5420",
    events: "PRICE_CHANGED, BACK_IN_STOCK",
    consent: "Yes",
  },
  {
    id: "sub_002",
    contact: "919876543210",
    target: "Laptops",
    events: "NEW_ARRIVAL, NEW_OFFER",
    consent: "Yes",
  },
];
