const API_BASE = import.meta.env.VITE_API_URL || "";

// ============================================================
// Types — aligned with the backend store shape
// ============================================================

export type BackgroundStyle = 'solid' | 'gradient' | 'image';

export interface SlideBackground {
  style: BackgroundStyle;
  color?: string;
  gradientColors?: string[];
  gradientDirection?: string;
  imageUrl?: string;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'code';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  // Text
  text?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  // Image
  imageUrl?: string;
  alt?: string;
  // Video
  videoUrl?: string;
  autoPlay?: boolean;
  // Code
  code?: string;
  language?: string;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  position: number;
  background?: SlideBackground | null;
}

export interface Presentation {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  slideCount: number;
  slides: Slide[];
  defaultBackground?: SlideBackground | null;
}

export interface PresentationDetail extends Presentation {
  slides: Slide[];
  defaultBackground?: SlideBackground | null;
}

export type ElementType = 'text' | 'image' | 'video' | 'code';

export type Element = SlideElement;

export interface Store {
  presentations: Record<string, Presentation>;
  presentationOrder: string[];
}

export interface Revision {
  id: string;
  timestamp: number;
  slides: Slide[];
  defaultBackground?: SlideBackground | null;
}

// ============================================================
// Helpers
// ============================================================

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

let nextId = 1;
const genId = () => Date.now() * 1000 + nextId++;

// ============================================================
// Revision History (1 minute debounce)
// ============================================================

const REVISION_COOLDOWN_MS = 60000; // 1 minute
const MAX_REVISIONS = 50;

interface RevisionState {
  lastSaveTime: number;
  pendingSave: ReturnType<typeof setTimeout> | null;
}

const revisionState: RevisionState = {
  lastSaveTime: 0,
  pendingSave: null,
};

function saveRevision(presentationId: number, slides: Slide[], defaultBackground?: SlideBackground | null): void {
  // Clear any pending save
  if (revisionState.pendingSave) {
    clearTimeout(revisionState.pendingSave);
  }

  const now = Date.now();
  const timeSinceLastSave = now - revisionState.lastSaveTime;

  if (timeSinceLastSave < REVISION_COOLDOWN_MS) {
    // Schedule save for when cooldown expires
    revisionState.pendingSave = setTimeout(() => {
      doSaveRevision(presentationId, slides, defaultBackground);
      revisionState.pendingSave = null;
    }, REVISION_COOLDOWN_MS - timeSinceLastSave);
  } else {
    // Save immediately
    doSaveRevision(presentationId, slides, defaultBackground);
  }
}

function doSaveRevision(presentationId: number, slides: Slide[], defaultBackground?: SlideBackground | null): void {
  const key = `revisions_${presentationId}`;
  const existing = getRevisionsFromStorage(presentationId);

  const revision: Revision = {
    id: String(genId()),
    timestamp: Date.now(),
    slides: JSON.parse(JSON.stringify(slides)),
    defaultBackground: defaultBackground ? JSON.parse(JSON.stringify(defaultBackground)) : undefined,
  };

  const updated = [revision, ...existing].slice(0, MAX_REVISIONS);
  localStorage.setItem(key, JSON.stringify(updated));
  revisionState.lastSaveTime = Date.now();
}

function getRevisionsFromStorage(presentationId: number): Revision[] {
  const key = `revisions_${presentationId}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export const getRevisions = (presentationId: number): Revision[] => {
  return getRevisionsFromStorage(presentationId);
};

export const restoreRevision = async (presentationId: number, revisionId: string): Promise<void> => {
  const revisions = getRevisionsFromStorage(presentationId);
  const revision = revisions.find(r => r.id === revisionId);
  if (!revision) throw new Error("Revision not found");

  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");

  pres.slides = JSON.parse(JSON.stringify(revision.slides));
  pres.slideCount = revision.slides.length;
  pres.defaultBackground = revision.defaultBackground ? JSON.parse(JSON.stringify(revision.defaultBackground)) : null;

  await saveStore(store);
};

// ============================================================
// Store persistence (backend has GET/PUT /store)
// ============================================================

interface StoreResponse {
  store: Store;
}

async function getStore(): Promise<Store> {
  const res = await fetch(`${API_BASE}/store`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error("Failed to load store");
  const data: StoreResponse = await res.json();
  // Ensure store has expected shape
  if (!data.store) return { presentations: {}, presentationOrder: [] };
  if (!data.store.presentations) data.store.presentations = {};
  if (!data.store.presentationOrder) data.store.presentationOrder = [];
  return data.store;
}

async function saveStore(store: Store): Promise<void> {
  const res = await fetch(`${API_BASE}/store`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ store }),
  });
  if (!res.ok) throw new Error("Failed to save store");
}

// ============================================================
// Presentation API — mapped onto GET/PUT /store
// ============================================================

export const getPresentations = async (): Promise<Presentation[]> => {
  const store = await getStore();
  return store.presentationOrder
    .map((id) => store.presentations[id])
    .filter(Boolean);
};

export const getPresentation = async (id: number): Promise<PresentationDetail> => {
  const store = await getStore();
  const pres = store.presentations[String(id)];
  if (!pres) throw new Error("Presentation not found");
  return pres as PresentationDetail;
};

export const createPresentation = async (data: {
  name: string;
  description: string;
  thumbnail: string;
}): Promise<Presentation> => {
  const store = await getStore();
  const id = genId();
  const newPres: Presentation = {
    id,
    name: data.name,
    description: data.description,
    thumbnail: data.thumbnail,
    slideCount: 1,
    slides: [
      {
        id: String(genId()),
        elements: [],
        position: 0,
        background: null,
      },
    ],
    defaultBackground: null,
  };
  store.presentations[String(id)] = newPres;
  store.presentationOrder.push(String(id));
  await saveStore(store);
  // Save initial revision
  saveRevision(id, newPres.slides, newPres.defaultBackground);
  return newPres;
};

export const updatePresentation = async (
  id: number,
  data: { name?: string; description?: string; thumbnail?: string; defaultBackground?: SlideBackground | null }
): Promise<Presentation> => {
  const store = await getStore();
  const pres = store.presentations[String(id)];
  if (!pres) throw new Error("Presentation not found");
  if (data.name !== undefined) pres.name = data.name;
  if (data.description !== undefined) pres.description = data.description;
  if (data.thumbnail !== undefined) pres.thumbnail = data.thumbnail;
  if (data.defaultBackground !== undefined) {
    pres.defaultBackground = data.defaultBackground;
    // Save revision when defaultBackground changes
    saveRevision(id, pres.slides, pres.defaultBackground);
  }
  await saveStore(store);
  return pres;
};

export const deletePresentation = async (id: number): Promise<void> => {
  const store = await getStore();
  if (!store.presentations[String(id)]) throw new Error("Presentation not found");
  delete store.presentations[String(id)];
  store.presentationOrder = store.presentationOrder.filter((pid) => pid !== String(id));
  await saveStore(store);
};

// ============================================================
// Slide API — stored inside Presentation.slides
// ============================================================

export const createSlide = async (presentationId: number): Promise<Slide> => {
  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");
  const newSlide: Slide = {
    id: String(genId()),
    elements: [],
    position: pres.slides.length,
    background: null,
  };
  pres.slides.push(newSlide);
  pres.slideCount = pres.slides.length;
  await saveStore(store);
  saveRevision(presentationId, pres.slides, pres.defaultBackground);
  return newSlide;
};

export const deleteSlide = async (
  presentationId: number,
  slideId: number | string
): Promise<void> => {
  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");
  if (pres.slides.length === 1) {
    throw new Error("Cannot delete the only slide");
  }
  const sid = String(slideId);
  pres.slides = pres.slides.filter((s) => s.id !== sid);
  // Re-index positions
  pres.slides.forEach((s, i) => { s.position = i; });
  pres.slideCount = pres.slides.length;
  await saveStore(store);
  saveRevision(presentationId, pres.slides, pres.defaultBackground);
};

export const reorderSlides = async (
  presentationId: number,
  fromIndex: number,
  toIndex: number
): Promise<void> => {
  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");
  if (fromIndex < 0 || fromIndex >= pres.slides.length) return;
  if (toIndex < 0 || toIndex >= pres.slides.length) return;
  const [moved] = pres.slides.splice(fromIndex, 1);
  pres.slides.splice(toIndex, 0, moved);
  // Re-index positions
  pres.slides.forEach((s, i) => { s.position = i; });
  await saveStore(store);
  saveRevision(presentationId, pres.slides, pres.defaultBackground);
};

// ============================================================
// Element API — stored inside Presentation.slides[].elements
// ============================================================

export const getElements = async (
  presentationId: number,
  slideId: number | string
): Promise<SlideElement[]> => {
  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");
  const slide = pres.slides.find((s) => s.id === String(slideId));
  if (!slide) throw new Error("Slide not found");
  return slide.elements;
};

export const addElement = async (
  presentationId: number,
  slideId: number | string,
  elementData: Partial<SlideElement>
): Promise<SlideElement> => {
  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");
  const slide = pres.slides.find((s) => s.id === String(slideId));
  if (!slide) throw new Error("Slide not found");
  const element: SlideElement = {
    id: String(genId()),
    type: 'text',
    x: 10,
    y: 10,
    width: 50,
    height: 30,
    zIndex: slide.elements.length,
    ...elementData,
  } as SlideElement;
  slide.elements.push(element);
  await saveStore(store);
  saveRevision(presentationId, pres.slides, pres.defaultBackground);
  return element;
};

export const updateElement = async (
  presentationId: number,
  slideId: number | string,
  elementId: number | string,
  updates: Partial<SlideElement>
): Promise<SlideElement> => {
  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");
  const slide = pres.slides.find((s) => s.id === String(slideId));
  if (!slide) throw new Error("Slide not found");
  const element = slide.elements.find((e) => e.id === String(elementId));
  if (!element) throw new Error("Element not found");
  Object.assign(element, updates);
  await saveStore(store);
  saveRevision(presentationId, pres.slides, pres.defaultBackground);
  return element;
};

export const deleteElement = async (
  presentationId: number,
  slideId: number | string,
  elementId: number | string
): Promise<void> => {
  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");
  const slide = pres.slides.find((s) => s.id === String(slideId));
  if (!slide) throw new Error("Slide not found");
  slide.elements = slide.elements.filter((e) => e.id !== String(elementId));
  await saveStore(store);
  saveRevision(presentationId, pres.slides, pres.defaultBackground);
};

// ============================================================
// Slide Background — stored inside Slide.background
// ============================================================

export const updateSlideBackground = async (
  presentationId: number,
  slideId: number | string,
  background: SlideBackground | null
): Promise<Slide> => {
  const store = await getStore();
  const pres = store.presentations[String(presentationId)];
  if (!pres) throw new Error("Presentation not found");
  const slide = pres.slides.find((s) => s.id === String(slideId));
  if (!slide) throw new Error("Slide not found");
  slide.background = background;
  await saveStore(store);
  saveRevision(presentationId, pres.slides, pres.defaultBackground);
  return slide;
};

// ============================================================
// Auth API — already correct, calls actual backend endpoints
// ============================================================

export const login = async (email: string, password: string): Promise<string> => {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  return data.token;
};

export const register = async (
  email: string,
  password: string,
  name: string
): Promise<string> => {
  const res = await fetch(`${API_BASE}/admin/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new Error("Registration failed");
  const data = await res.json();
  return data.token;
};

export const logout = async (): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/auth/logout`, {
    method: "POST",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Logout failed");
};
