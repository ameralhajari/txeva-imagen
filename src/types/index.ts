export type ImageModel =
  | 'gpt-image-1-mini'
  | 'gpt-image-1.5'
  | 'gpt-image-1'
  | 'dall-e-3'
  | 'dall-e-2'
  | string;

export type ImageQuality = 'standard' | 'hd' | 'low' | 'medium' | 'high';
export type ImageStyle = 'vivid' | 'natural';
export type ImageSize =
  | '1024x1024'
  | '1792x1024'
  | '1024x1792'
  | '1536x1024'
  | '1024x1536'
  | '512x512'
  | '256x256'
  | string;

export interface Generation {
  id: string;
  sessionId: string;
  prompt: string;
  revisedPrompt?: string;
  model: ImageModel;
  quality?: ImageQuality;
  style?: ImageStyle;
  size: ImageSize;
  imageUrl: string;
  referenceImages?: string[];
  createdAt: number;
}

export interface Session {
  id: string;
  title: string;
  model: ImageModel;
  createdAt: number;
  updatedAt: number;
  generations?: Generation[];
}

export interface AppSettings {
  openaiApiKey: string;
  apiBaseUrl: string;
  tursoDatabaseUrl: string;
  tursoAuthToken: string;
  defaultModel: ImageModel;
  defaultQuality: ImageQuality;
  defaultStyle: ImageStyle;
  defaultSize: ImageSize;
  language: 'ar' | 'en';
}

export interface GenerationRequestParams {
  prompt: string;
  model: ImageModel;
  quality?: ImageQuality;
  style?: ImageStyle;
  size: ImageSize;
  n?: number;
  images?: string[];
}
