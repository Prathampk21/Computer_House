export type ProductCondition = "NEW" | "USED" | "REFURBISHED";
export type StockStatus =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "SOLD"
  | "COMING_SOON";

export type ProductSpec = {
  key: string;
  label: string;
  value: string;
  comparable?: boolean;
  filterable?: boolean;
};

export type DemoProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  subcategory: string;
  brand: string;
  condition: ProductCondition;
  conditionGrade?: string;
  regularPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  warranty: string;
  featured: boolean;
  newArrival: boolean;
  offerText?: string;
  shortDescription: string;
  detailedDescription: string;
  image: string;
  specs: ProductSpec[];
  views: number;
  enquiries: number;
};

export const categories = [
  "Laptops",
  "Desktop PCs",
  "Printers",
  "Monitors",
  "Accessories",
  "Networking",
  "Storage",
  "UPS & Power",
];

export const brands = [
  "Dell",
  "HP",
  "Lenovo",
  "Canon",
  "Epson",
  "Samsung",
  "Logitech",
  "TP-Link",
];

export const demoProducts: DemoProduct[] = [
  {
    id: "prd_dell_latitude_5420",
    name: "Dell Latitude 5420 Business Laptop",
    slug: "dell-latitude-5420-business-laptop",
    sku: "DL-LAT-5420-RF",
    category: "Laptops",
    subcategory: "Business Laptops",
    brand: "Dell",
    condition: "REFURBISHED",
    conditionGrade: "A",
    regularPrice: 48500,
    sellingPrice: 42900,
    stockQuantity: 8,
    stockStatus: "IN_STOCK",
    warranty: "6 months shop warranty",
    featured: true,
    newArrival: true,
    offerText: "Includes laptop bag",
    shortDescription:
      "A reliable 14-inch business laptop with 11th Gen Intel performance.",
    detailedDescription:
      "Ideal for office, students, billing desks, and field teams. Fully tested, cleaned, and ready with licensed Windows.",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    specs: [
      { key: "processor", label: "Processor", value: "Intel Core i5 11th Gen" },
      { key: "ram", label: "RAM", value: "16 GB DDR4", filterable: true },
      { key: "storage", label: "Storage", value: "512 GB SSD", filterable: true },
      { key: "display", label: "Display", value: "14 inch FHD" },
      { key: "os", label: "Operating System", value: "Windows 11 Pro" },
    ],
    views: 1284,
    enquiries: 86,
  },
  {
    id: "prd_hp_elitedesk_i5",
    name: "HP EliteDesk i5 Desktop Set",
    slug: "hp-elitedesk-i5-desktop-set",
    sku: "HP-ED-I5-SET",
    category: "Desktop PCs",
    subcategory: "Office Desktops",
    brand: "HP",
    condition: "USED",
    conditionGrade: "B+",
    regularPrice: 29500,
    sellingPrice: 24900,
    stockQuantity: 5,
    stockStatus: "LOW_STOCK",
    warranty: "3 months shop warranty",
    featured: true,
    newArrival: false,
    offerText: "Keyboard and mouse combo",
    shortDescription:
      "Compact desktop bundle for billing, accounting, browsing, and office work.",
    detailedDescription:
      "Includes CPU, 19-inch monitor, keyboard, mouse, Wi-Fi dongle, and fresh OS installation.",
    image:
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    specs: [
      { key: "processor", label: "Processor", value: "Intel Core i5 8th Gen" },
      { key: "ram", label: "RAM", value: "8 GB DDR4", filterable: true },
      { key: "storage", label: "Storage", value: "256 GB SSD" },
      { key: "monitor", label: "Monitor", value: "19 inch LED" },
      { key: "os", label: "Operating System", value: "Windows 10 Pro" },
    ],
    views: 892,
    enquiries: 54,
  },
  {
    id: "prd_lenovo_thinkpad_e14",
    name: "Lenovo ThinkPad E14",
    slug: "lenovo-thinkpad-e14",
    sku: "LN-TP-E14-NEW",
    category: "Laptops",
    subcategory: "Business Laptops",
    brand: "Lenovo",
    condition: "NEW",
    regularPrice: 68500,
    sellingPrice: 64900,
    stockQuantity: 11,
    stockStatus: "IN_STOCK",
    warranty: "1 year brand warranty",
    featured: true,
    newArrival: true,
    shortDescription:
      "New ThinkPad E-series laptop with strong keyboard, business security, and warranty.",
    detailedDescription:
      "A dependable new laptop for professionals who need portability, warranty, and serviceable build quality.",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    specs: [
      { key: "processor", label: "Processor", value: "Intel Core i5 13th Gen" },
      { key: "ram", label: "RAM", value: "16 GB DDR4", filterable: true },
      { key: "storage", label: "Storage", value: "512 GB NVMe SSD" },
      { key: "display", label: "Display", value: "14 inch FHD IPS" },
      { key: "os", label: "Operating System", value: "Windows 11 Home" },
    ],
    views: 1014,
    enquiries: 72,
  },
  {
    id: "prd_canon_g3770",
    name: "Canon PIXMA G3770 Wi-Fi Ink Tank Printer",
    slug: "canon-pixma-g3770-wifi-ink-tank-printer",
    sku: "CN-G3770-NEW",
    category: "Printers",
    subcategory: "Ink Tank Printers",
    brand: "Canon",
    condition: "NEW",
    regularPrice: 18900,
    sellingPrice: 16900,
    stockQuantity: 7,
    stockStatus: "IN_STOCK",
    warranty: "1 year brand warranty",
    featured: false,
    newArrival: true,
    offerText: "Free installation guidance",
    shortDescription:
      "All-in-one Wi-Fi ink tank printer for home, school, and small office use.",
    detailedDescription:
      "Print, scan, and copy with low running cost and wireless convenience.",
    image:
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1200&q=80",
    specs: [
      { key: "printer_type", label: "Printer Type", value: "Ink Tank" },
      { key: "color", label: "Mono/Color", value: "Color" },
      { key: "duplex", label: "Duplex", value: "Manual" },
      { key: "wifi", label: "Wi-Fi", value: "Yes", filterable: true },
      { key: "paper", label: "Paper Size", value: "A4, Letter" },
    ],
    views: 744,
    enquiries: 49,
  },
  {
    id: "prd_samsung_24_monitor",
    name: "Samsung 24 inch FHD Monitor",
    slug: "samsung-24-inch-fhd-monitor",
    sku: "SM-24-FHD",
    category: "Monitors",
    subcategory: "Office Monitors",
    brand: "Samsung",
    condition: "NEW",
    regularPrice: 12900,
    sellingPrice: 11490,
    stockQuantity: 14,
    stockStatus: "IN_STOCK",
    warranty: "3 years brand warranty",
    featured: false,
    newArrival: false,
    shortDescription:
      "Sharp 24-inch display for office desks, CCTV screens, and home setups.",
    detailedDescription:
      "A clean full-HD panel with HDMI input, slim bezels, and dependable brand service.",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80",
    specs: [
      { key: "screen_size", label: "Screen Size", value: "24 inch" },
      { key: "resolution", label: "Resolution", value: "1920 x 1080" },
      { key: "panel", label: "Panel", value: "IPS" },
      { key: "refresh_rate", label: "Refresh Rate", value: "75 Hz" },
      { key: "ports", label: "Ports", value: "HDMI, VGA" },
    ],
    views: 633,
    enquiries: 31,
  },
  {
    id: "prd_logitech_combo",
    name: "Logitech Wireless Keyboard Mouse Combo",
    slug: "logitech-wireless-keyboard-mouse-combo",
    sku: "LG-MK-WL",
    category: "Accessories",
    subcategory: "Keyboard & Mouse",
    brand: "Logitech",
    condition: "NEW",
    regularPrice: 2499,
    sellingPrice: 1999,
    stockQuantity: 32,
    stockStatus: "IN_STOCK",
    warranty: "1 year brand warranty",
    featured: false,
    newArrival: false,
    offerText: "Bundle discount",
    shortDescription:
      "Wireless keyboard and mouse bundle for home and office desktops.",
    detailedDescription:
      "Plug-and-play USB receiver, comfortable typing, and long battery life.",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
    specs: [
      { key: "connectivity", label: "Connectivity", value: "2.4 GHz wireless" },
      { key: "battery", label: "Battery", value: "AA/AAA" },
      { key: "layout", label: "Layout", value: "Full-size" },
      { key: "warranty", label: "Warranty", value: "1 year" },
    ],
    views: 512,
    enquiries: 27,
  },
];

export const demoDealers = [
  {
    id: "dealer_a",
    businessName: "Dealer A Computers",
    contactName: "Amit Kumar",
    referralCode: "DEALER-A",
    mobile: "919810000001",
    active: true,
    commissionRate: 5,
  },
  {
    id: "dealer_b",
    businessName: "Dealer B Electronics",
    contactName: "Bharat Shah",
    referralCode: "DEALER-B",
    mobile: "919810000002",
    active: true,
    commissionRate: 4,
  },
];

export function getProductBySlug(slug: string) {
  return demoProducts.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: DemoProduct) {
  return demoProducts
    .filter(
      (candidate) =>
        candidate.slug !== product.slug && candidate.category === product.category,
    )
    .slice(0, 3);
}
