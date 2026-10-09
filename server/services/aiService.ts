import { GoogleGenAI } from '@google/genai';
import { Campaign, BloodDonor, BloodRequest } from '../../src/types/index.js';

export class AIService {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } catch (e) {
        console.warn('Gemini client initialization warning:', e);
      }
    }
  }

  async askAssistant(
    prompt: string,
    contextData: {
      campaigns?: Campaign[];
      bloodDonors?: BloodDonor[];
      bloodRequests?: BloodRequest[];
      userRole?: string;
    } = {}
  ): Promise<string> {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      return 'Hello! I am HopeCare AI. How can I assist you today with donations, blood requests, or volunteering?';
    }

    // Try live Gemini 3.8 Flash if API key is present
    if (this.client && process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are "HopeCare AI", the intelligent humanitarian assistant for HopeCare Foundation (Bangladesh).
Your mission is to help people donate, find emergency blood donors, create emergency blood requests, and register as volunteers.
Always be warm, compassionate, respectful, and transparent.
Available context:
- Currency is Bangladeshi Taka (BDT / ৳).
- Payment methods supported: bKash, Nagad, SSLCommerz, and International Card.
- Blood donation intervals require 90 days.
- Emergency Blood Hotline: +880 1800-467322 (24/7).
- Key active campaigns: ${contextData.campaigns?.map(c => `"${c.title}" (Target ৳${c.targetAmount}, Raised ৳${c.collectedAmount})`).slice(0, 5).join('; ') || 'Various healthcare, flood relief, education campaigns'}.
- Mention that blood donations are voluntary and hospital medical staff must oversee cross-matching.
Answer clearly in concise markdown with helpful bullet points. Answer in English, or if the user asked in Bangla, reply in polite Bangla.`;

        const response = await this.client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${cleanPrompt}` }] }
          ]
        });

        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to humanitarian knowledge engine:', err?.message || err);
      }
    }

    // High-fidelity domain knowledge engine fallback
    const lower = cleanPrompt.toLowerCase();

    if (lower.includes('blood') || lower.includes('donor') || lower.includes('রক্ত')) {
      if (lower.includes('o+') || lower.includes('o-') || lower.includes('a+') || lower.includes('b+') || lower.includes('ab+')) {
        return `### 🩸 HopeCare Blood Matching System
We have verified blood donors across 64 districts in Bangladesh!
- **How to request:** Click the **"Request Blood"** button in the header or emergency banner.
- **Urgent cases:** Mark the emergency level as **Critical** for priority hospital dispatch.
- **Hotline:** For immediate life-saving coordination, call our 24/7 emergency hotline at **+880 1800-467322**.
- **Privacy notice:** Donor contact details are protected and shared responsibly to prevent spam.`;
      }
      return `### 🩸 Becoming a Blood Donor or Finding Blood
- **Eligibility:** Age 18–60, minimum 48 kg weight (45 kg for females), and at least 3 months (90 days) since your last donation.
- **Search Donors:** Use our **Blood Donors** page to filter by Blood Group, Division, District, and Upazila.
- **Registration:** You can register as a donor in under 60 seconds through your profile dashboard.`;
    }

    if (lower.includes('donate') || lower.includes('bkash') || lower.includes('nagad') || lower.includes('দান') || lower.includes('টাকা')) {
      return `### 💝 How to Donate to HopeCare Foundation
Your contributions go directly to verified beneficiaries with zero administrative deduction from general public funds.
1. **Choose a Campaign:** Explore our **Causes & Campaigns** page (e.g., Pediatric Heart Surgery, Flood Relief, Slum Education).
2. **Select Amount:** Choose preset amounts (৳500, ৳1,000, ৳5,000) or enter any custom amount.
3. **Payment Methods:**
   - **bKash:** Merchant Number \`01800-467322\`
   - **Nagad:** Instant digital merchant gateway
   - **SSLCommerz & Cards:** Visa, Mastercard, American Express
4. **Digital Receipt:** Immediately receive a downloadable, verified official donation receipt with a unique transaction ID.`;
    }

    if (lower.includes('volunteer') || lower.includes('join') || lower.includes('স্বেচ্ছাসেবক')) {
      return `### 🤝 Join as a HopeCare Volunteer
We welcome university students, healthcare workers, and civic leaders across all 8 divisions of Bangladesh.
- **Volunteer Roles:** Emergency Blood Coordination, Flood/Disaster Relief, Slum School Teaching, Medical Camp Support.
- **How to Apply:** Click **"Become a Volunteer"** on the home page or navigation menu, fill in your district, upazila, and skills.
- **Benefits:** Certificate of humanitarian service, life-saving leadership training, and direct impact.`;
    }

    if (lower.includes('campaign') || lower.includes('cause') || lower.includes('mariam') || lower.includes('flood')) {
      return `### 🎯 High-Priority Active Campaigns
Here are our most urgent verified appeals right now:
1. **Emergency Pediatric Heart Surgery for Little Mariam** — Target ৳350,000 (Over 76% funded)
2. **Flood Rehabilitation & Clean Water in Sunamganj** — Installing 40 deep tube-wells and repairing shelters
3. **Slum Children Education & Daily Nutrition (Mirpur)** — Free school supplies and midday meals for 180 kids
4. **Free Cataract Eye Surgery Camp (Cumilla)** — Restoring vision for 100 poor elders
Click **"Donate Now"** on any card to support.`;
    }

    return `### HopeCare Foundation Humanitarian Support
Thank you for reaching out to HopeCare Foundation. Here is how we can help you right now:
- **Donate to a verified cause:** Browse our **Campaigns** section and donate via bKash, Nagad, or Card.
- **Search or Request Blood:** Access our real-time matching network with donors in your Upazila.
- **Apply as a Volunteer:** Join our nationwide team of humanitarian first responders.
- **24/7 Emergency Line:** Call **+880 1800-467322** for critical blood emergencies.`;
  }
}

export const aiService = new AIService();
