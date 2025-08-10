declare global {
  interface Window {
    ttq: {
      track: (event: string, parameters?: Record<string, any>) => void;
      page: () => void;
      identify: (parameters?: Record<string, any>) => void;
      load: (pixelId: string, config?: Record<string, any>, options?: Record<string, any>) => void;
    }
  }
}

// TikTok Pixel Event Parameters
interface TikTokEventData {
  content_type?: string;
  currency?: string;
  value?: number;
  content_id?: string;
  content_name?: string;
  email?: string;
  phone_number?: string;
  contents?: Array<{
    content_id: string;
    content_name: string;
    quantity: number;
    price: number;
  }>;
}

export {};