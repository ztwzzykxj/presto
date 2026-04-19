// Core data types for Presto

export interface Presentation {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // base64 or URL, grey square if empty
  slides: Slide[];
  defaultBackground: SlideBackground;
  createdAt: number;
  updatedAt: number;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: SlideBackground;
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image';
  value: string; // colour hex / gradient CSS / image URL
}

export type SlideElement = TextElement | ImageElement | VideoElement | CodeElement;

export interface BaseElement {
  id: string;
  type: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  width: number; // 0-100 percentage
  height: number; // 0-100 percentage
  layer: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number; // em
  color: string; // hex
  fontFamily: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // URL or base64
  alt: string;
}

export interface VideoElement extends BaseElement {
  type: 'video';
  src: string; // YouTube embed URL
  autoPlay: boolean;
}

export interface CodeElement extends BaseElement {
  type: 'code';
  code: string;
  fontSize: number; // em
  language: 'c' | 'python' | 'javascript';
}

// Store shape
export interface Store {
  presentations: Record<string, Presentation>;
  presentationOrder: string[];
}

export interface AuthState {
  token: string | null;
  email: string | null;
  name: string | null;
}
