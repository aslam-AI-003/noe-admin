// ============================================================
// Namma Ooru Express — AI Voice Call Ordering System Types
// ============================================================

// Voice Call Record
export interface VoiceCall {
  id: string;
  callId: string; // External telephony provider call ID
  callerPhone: string;
  startTime: string;
  endTime?: string;
  duration?: number; // seconds
  recordingUrl?: string;
  transcript?: CallTranscriptTurn[];
  aiConfidenceScore?: number; // 0-100
  outcome: VoiceCallOutcome;
  linkedOrderId?: string;
  escalatedToHuman: boolean;
  escalationReason?: string;
  customerName?: string;
  detectedLanguage: 'ta' | 'en' | 'tanglish';
  metadata?: {
    telephonyProvider: string;
    region?: string;
    networkType?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type VoiceCallOutcome =
  | 'order_created'
  | 'escalated_to_human'
  | 'abandoned'
  | 'no_order'
  | 'call_dropped'
  | 'in_progress';

// Call Transcript Turn
export interface CallTranscriptTurn {
  id: string;
  callId: string;
  turnIndex: number;
  speaker: 'ai' | 'customer';
  text: string;
  timestamp: string;
  detectedLanguage: 'ta' | 'en' | 'tanglish';
  confidence?: number;
}

// Human Escalation Record
export interface HumanEscalation {
  id: string;
  callId: string;
  reason: string;
  escalatedAt: string;
  agentId?: string;
  agentName?: string;
  resolution?: string;
  resolutionTime?: string;
  status: 'queued' | 'assigned' | 'resolved' | 'unresolved';
  callContext: {
    transcript: CallTranscriptTurn[];
    partialOrder?: Partial<VoiceOrderData>;
    customerPhone: string;
    customerName?: string;
  };
}

// Customer Voice Profile (built from call history)
export interface CustomerVoiceProfile {
  phoneNumber: string;
  knownName?: string;
  preferredLanguage: 'ta' | 'en' | 'tanglish';
  frequentItems: FrequentItem[];
  lastOrderId?: string;
  totalVoiceOrders: number;
  defaultArea?: string;
  defaultAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FrequentItem {
  name: string;
  nameTamil?: string;
  category: string;
  shopId?: string;
  orderCount: number;
}

// Voice Order Data (structured order extracted by AI)
export interface VoiceOrderData {
  shopId: string;
  shopName: string;
  items: VoiceOrderItem[];
  customerPhone: string;
  customerName?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  notes?: string;
  paymentMethod: 'cod'; // Voice orders are always COD initially
  orderSource: 'voice_call';
  sourceCallId: string;
}

export interface VoiceOrderItem {
  name: string;
  nameTamil?: string;
  quantity: number;
  unit: string;
  brand?: string;
  matchedProductId?: string;
  matchedPrice?: number;
  confidence: number; // 0-100 how confident AI is about this item match
}

// Order Source Extension (extends existing Order type)
export type OrderSource = 'app' | 'whatsapp' | 'voice_call' | 'human_agent';

// AI Tool Call Types (function calling for voice agent)
export interface ShopSearchRequest {
  area: string;
  itemCategory?: string;
  itemName?: string;
}

export interface ShopSearchResult {
  shopId: string;
  shopName: string;
  distance: string;
  rating: number;
  isOpen: boolean;
  hasRequestedItems: boolean;
  matchedItems?: { name: string; price: number; available: boolean }[];
}

export interface ItemSearchRequest {
  shopId: string;
  itemQuery: string;
}

export interface ItemSearchResult {
  productId: string;
  name: string;
  nameTamil: string;
  price: number;
  discountPrice?: number;
  unit: string;
  isAvailable: boolean;
  stockQuantity: number;
  brand?: string;
  variants?: { name: string; price: number; unit: string }[];
}

export interface LastOrderResult {
  orderId: string;
  shopName: string;
  items: { name: string; quantity: number; unit: string }[];
  total: number;
  createdAt: string;
}

// Telephony Webhook Payloads (Exotel/Knowlarity compatible)
export interface IncomingCallWebhook {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
  Direction: 'inbound';
  StartTime?: string;
  RecordingUrl?: string;
  Duration?: number;
}

export interface CallEndedWebhook {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: 'completed' | 'failed' | 'busy' | 'no-answer';
  Duration: number;
  RecordingUrl?: string;
  EndTime: string;
}

// Voice Analytics
export interface VoiceAnalytics {
  totalCalls: number;
  successfulOrders: number;
  escalatedCalls: number;
  abandonedCalls: number;
  averageHandleTime: number; // seconds
  averageConfidenceScore: number;
  successRate: number; // percentage
  escalationRate: number; // percentage
  peakHours: { hour: number; count: number }[];
  languageDistribution: { language: string; count: number }[];
  topItems: { name: string; count: number }[];
  dailyTrend: { date: string; calls: number; orders: number }[];
}

// Voice Agent Configuration
export interface VoiceAgentConfig {
  confidenceThreshold: number; // default 70
  maxClarificationAttempts: number; // default 2
  maxCallDuration: number; // seconds, default 300 (5 min)
  highValueOrderThreshold: number; // amount above which SMS confirmation required
  greeting: {
    ta: string;
    en: string;
  };
  fallbackAgentQueue: string;
  enableCallRecording: boolean;
  recordingRetentionDays: number; // default 90
  concurrentCallLimit: number;
}
