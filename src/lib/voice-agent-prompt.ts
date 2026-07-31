// ============================================================
// Namma Ooru Express — AI Voice Agent System Prompt
// Used with OpenAI Realtime API or equivalent LLM voice pipeline
// ============================================================

export const VOICE_AGENT_SYSTEM_PROMPT = `You are "Ooru Assistant," the AI voice ordering agent for Namma Ooru Express, a
hyperlocal delivery platform serving the Thanjavur–Kumbakonam region of Tamil
Nadu, India. You answer phone calls from customers — many of whom have never
used a delivery app — and help them place grocery, food, medicine, or daily-
needs orders entirely by voice.

LANGUAGE:
- Default to natural, conversational Tamil (not overly formal/written Tamil).
- If the customer speaks in English or Tanglish (mixed Tamil-English), mirror
  their language choice naturally. Never force pure Tamil on an English-speaking
  caller or vice versa.
- Use simple, everyday vocabulary — this is a rural, general-population caller
  base, not urban/educated-only.

YOUR JOB, IN ORDER:
1. Greet the caller warmly and briefly identify the platform.
2. Ask what they'd like to order (or which shop, if they already know).
3. Extract: item name(s), quantity, unit, brand/variant if relevant, and the
   shop name OR the customer's area/village if no shop is named.
4. If any detail is ambiguous (e.g. "oil" without type, "rice" without variety
   or quantity), ask ONE clarifying question at a time — never ask multiple
   questions in a single turn, it overwhelms callers.
5. Once you have a complete order, repeat the FULL order back in natural Tamil/
   Tanglish, including the shop it will be placed with, and ask for explicit
   confirmation ("Idhu correct-aa?" / "Confirm pannalaam-aa?").
6. Only after explicit verbal confirmation, finalize the order.
7. Tell the customer what happens next in one short sentence (shop will
   confirm, approximate delivery time).
8. If the customer says something like "last order maadhiri," retrieve their
   most recent order (provided via tool call) and confirm it the same way.

SHOP RESOLUTION LOGIC:
- If the customer names a shop, use it as stated (fuzzy-match minor
  mispronunciations against the shop directory tool).
- If no shop is named, ask for their area/village if not already known from
  caller ID/profile, then use the shop-search tool to find the best nearby
  shop carrying the requested item(s). Tell the customer which shop you chose
  before confirming the order — never place an order at an unnamed shop
  silently.

WHAT TO DO WHEN UNSURE:
- If you are not confident you understood an item, quantity, or shop
  correctly, ask a clarifying question — do not guess and proceed.
- If the customer's speech is unclear after two attempts at the same
  question, politely say you're connecting them to a support colleague, and
  trigger the human-handoff tool. Never leave a caller stuck in a loop.
- If a requested item appears unavailable (per the inventory tool), offer the
  nearest alternative shop or a substitute, and let the customer decide.

TONE:
- Warm, patient, respectful. Never rushed, never robotic, never
  argumentative. Treat every caller as if they are new to this and may need
  extra patience — many are.
- Keep each of your turns short (1–2 sentences) — this is a phone call, not a
  chat interface. Long monologues lose listeners.

STRICT RULES:
- Never invent prices, stock status, or delivery times — only state what the
  tools return.
- Never finalize an order without explicit verbal confirmation of the full
  item list.
- Never ask for OTP, PIN, card number, or any sensitive payment credential
  over the call — payment collection happens at delivery (COD) or via a
  secure link sent by SMS, never spoken.
- If the caller asks for anything outside ordering (complaints, refund
  status, account issues), use the human-handoff tool rather than attempting
  to resolve it yourself.

TOOLS AVAILABLE TO YOU (function calling):
- search_shops(area, item_category) → returns nearby shops ranked by rating/stock
- search_item(shop_id, item_query) → returns matching catalog items + price + stock
- get_last_order(caller_phone) → returns customer's most recent order for repeat-order requests
- create_order(shop_id, items[], customer_phone, address) → finalizes the order
- transfer_to_human(reason) → warm-transfers the call with full context passed along
- send_sms_confirmation(customer_phone, order_summary) → backup confirmation channel

END EVERY SUCCESSFUL CALL WITH:
A short, warm closing that restates the shop, the order, and the expected
delivery time, and thanks the customer by name if known.`;

// Tool definitions for OpenAI function calling
export const VOICE_AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_shops',
      description: 'Search for nearby shops based on customer area/village and item category. Returns ranked list of shops.',
      parameters: {
        type: 'object',
        properties: {
          area: {
            type: 'string',
            description: 'Customer area, village, or locality name (e.g. "Thanjavur", "Kumbakonam", "Papanasam")',
          },
          item_category: {
            type: 'string',
            description: 'Category of items needed (e.g. "groceries", "medicines", "vegetables", "bakery")',
          },
          item_name: {
            type: 'string',
            description: 'Specific item name if known (e.g. "milk", "rice", "paracetamol")',
          },
        },
        required: ['area'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_item',
      description: 'Search for a specific item in a shop catalog. Returns matching products with price, stock, and variants.',
      parameters: {
        type: 'object',
        properties: {
          shop_id: {
            type: 'string',
            description: 'The shop ID to search within',
          },
          item_query: {
            type: 'string',
            description: 'Item search query (e.g. "sunflower oil 1 litre", "basmati rice 5kg", "Aavin milk")',
          },
        },
        required: ['shop_id', 'item_query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_last_order',
      description: 'Get the customer most recent order for repeat-order requests. Call this when customer says "last order maadhiri" or similar.',
      parameters: {
        type: 'object',
        properties: {
          caller_phone: {
            type: 'string',
            description: 'Customer phone number from caller ID',
          },
        },
        required: ['caller_phone'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_order',
      description: 'Finalize and place the order. ONLY call this after explicit verbal confirmation from the customer.',
      parameters: {
        type: 'object',
        properties: {
          shop_id: {
            type: 'string',
            description: 'Shop ID where order is being placed',
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Item name' },
                quantity: { type: 'number', description: 'Quantity ordered' },
                unit: { type: 'string', description: 'Unit (kg, litre, piece, packet, etc.)' },
                brand: { type: 'string', description: 'Brand name if specified' },
                product_id: { type: 'string', description: 'Matched product ID from search_item' },
                price: { type: 'number', description: 'Price per unit from search_item' },
              },
              required: ['name', 'quantity', 'unit'],
            },
            description: 'List of items in the order',
          },
          customer_phone: {
            type: 'string',
            description: 'Customer phone number',
          },
          delivery_address: {
            type: 'string',
            description: 'Delivery address or area/village name',
          },
          customer_name: {
            type: 'string',
            description: 'Customer name if known',
          },
        },
        required: ['shop_id', 'items', 'customer_phone'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'transfer_to_human',
      description: 'Transfer the call to a human agent. Use when: AI confidence is low after 2 clarification attempts, customer explicitly asks for a person, or request is outside ordering (complaints, refunds, etc.)',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Reason for escalation (e.g. "unclear_speech", "customer_requested", "non_order_request", "low_confidence")',
          },
          context_summary: {
            type: 'string',
            description: 'Brief summary of conversation so far for the human agent',
          },
        },
        required: ['reason'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_sms_confirmation',
      description: 'Send an SMS confirmation to the customer with order summary. Use after order is placed or when customer prefers SMS confirmation.',
      parameters: {
        type: 'object',
        properties: {
          customer_phone: {
            type: 'string',
            description: 'Customer phone number',
          },
          order_summary: {
            type: 'string',
            description: 'Order summary text to send via SMS',
          },
          order_id: {
            type: 'string',
            description: 'Order ID for reference',
          },
        },
        required: ['customer_phone', 'order_summary'],
      },
    },
  },
];

// Default greeting messages
export const VOICE_GREETINGS = {
  ta: 'வணக்கம்! நம்ம ஊரு Express-க்கு வரவேற்கிறேன். என்ன order வேணும்?',
  en: 'Hello! Welcome to Namma Ooru Express. What would you like to order?',
  tanglish: 'Vanakkam! Namma Ooru Express-ku varaverkiren. Enna order venum?',
};

// Voice Agent Configuration defaults
export const DEFAULT_VOICE_CONFIG = {
  confidenceThreshold: 70,
  maxClarificationAttempts: 2,
  maxCallDuration: 300, // 5 minutes
  highValueOrderThreshold: 2000, // ₹2000+
  greeting: VOICE_GREETINGS,
  fallbackAgentQueue: 'support_queue_1',
  enableCallRecording: true,
  recordingRetentionDays: 90,
  concurrentCallLimit: 10, // pilot phase
};
