export interface FileWithPreview {
  id: string;
  file: File;
  preview: string; // base64 data URL
}

export interface EstimationResult {
  text: string;
  // If structured data is expected, add more fields here
  // e.g., totalCost?: number; breakdown?: Array<{ item: string; cost: number }>;
}

// Gemini API related types (simplified for this context)
export interface GeminiImagePart {
  inlineData: {
    mimeType: string;
    data: string; // base64 encoded string
  };
}

export interface GeminiTextPart {
  text: string;
}

export type GeminiPart = GeminiImagePart | GeminiTextPart;

export interface EstimationHistoryEntry {
  id: string;
  timestamp: number;
  images: FileWithPreview[]; // Store copies of image data, not original File objects for localStorage
  result: EstimationResult;
  promptText: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
