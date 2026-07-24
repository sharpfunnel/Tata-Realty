export const CONTACT = {
  name: "Rahul Thakur",
  // The brief's form copy uses the first name only.
  firstName: "Rahul",
  role: "Channel Partner for Tata Realty",
  location: "Vashi, Navi Mumbai",
  phone: "+91 96993 22332",
  phoneHref: "tel:+919699322332",
  email: "estatebuddy55@gmail.com",
  whatsapp: "919699322332",
} as const;

export const WHATSAPP_MESSAGE =
  "Hi, I am interested in Tata Realty Ghansoli pre-launch. Please share details.";

export function whatsappLink(message: string = WHATSAPP_MESSAGE) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Budget bands are not specified in the brief - confirm with client before ads go live.
export const BUDGET_OPTIONS = [
  "Under ₹1 Cr",
  "₹1 Cr - ₹1.5 Cr",
  "₹1.5 Cr - ₹2 Cr",
  "Above ₹2 Cr",
] as const;

export const CONFIG_OPTIONS = ["2 BHK", "3 BHK", "Both"] as const;
