import { useState, useEffect, type FormEvent } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";
import {
  getPresentations,
  getPresentation,
  createPresentation,
  updatePresentation,
  deletePresentation,
  createSlide,
  deleteSlide,
  reorderSlides,
  addElement,
  updateElement,
  deleteElement,
  updateSlideBackground,
  getRevisions,
  restoreRevision,
  login,
  register,
  type Presentation,
  type PresentationDetail,
  type Slide,
  type SlideElement,
  type Element,
  type ElementType,
  type SlideBackground,
  type BackgroundStyle,
  type Revision,
} from "./api";
import "./App.css";


// ============ AUTH HELPERS ============

function getToken(): string | null {
  return localStorage.getItem("token");
}

function setToken(token: string) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

// ============ ERROR POPUP ============

interface ErrorPopupProps {
  message: string;
  onClose: () => void;
}

function ErrorPopup({ message, onClose }: ErrorPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="error-popup">
      <div className="error-popup-content">
        <p>{message}</p>
        <button className="btn btn-icon" onClick={onClose}>
          X
        </button>
      </div>
    </div>
  );
}

// ============ LOGIN PAGE ============

interface LoginPageProps {
  onLogin: (_email: string, _token: string) => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        const token = await register(email, password, name);
        setToken(token);
        onLogin(email, token);
      } else {
        const token = await login(email, password);
        setToken(token);
        onLogin(email, token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{isRegister ? "Register" : "Login"}</h1>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>
          {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}
          <button type="submit" className="btn btn-primary">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button className="btn btn-link" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============

interface DashboardProps {
  onLogout: () => void;
}

function Dashboard({ onLogout }: DashboardProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [error, setError] = useState("");

  const loadPresentations = async () => {
    setLoading(true);
    try {
      const data = await getPresentations();
      setPresentations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPresentations();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createPresentation({
        name: newName,
        description: newDescription,
        thumbnail: newThumbnail,
      });
      setShowNewModal(false);
      setNewName("");
      setNewDescription("");
      setNewThumbnail("");
      loadPresentations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Presentations</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            New Presentation
          </button>
        </div>
      </div>

      {presentations.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888" }}>
          No presentations yet. Create one to get started!
        </p>
      ) : (
        <div className="presentations-grid">
          {presentations.map((pres) => (
            <Link
              key={pres.id}
              to={`/presentation/${pres.id}`}
              className="presentation-card"
            >
              <div className="card-thumbnail">
                {pres.thumbnail ? (
                  <img src={pres.thumbnail} alt={pres.name} />
                ) : (
                  <div className="thumbnail-placeholder" />
                )}
              </div>
              <div className="card-info">
                <h3>{pres.name}</h3>
                <p className="card-description">{pres.description}</p>
                <p className="card-slides">{pres.slideCount} slides</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Presentation</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Presentation"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="A brief description..."
                />
              </div>
              <div className="form-group">
                <label>Thumbnail URL (optional)</label>
                <input
                  type="text"
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ELEMENT MODAL ============

interface ElementModalProps {
  type: ElementType;
  initialData?: Element;
  onSave: (_data: Partial<Element>) => void;
  onClose: () => void;
}

function ElementModal({ type, initialData, onSave, onClose }: ElementModalProps) {
  const [data, setData] = useState<Partial<Element>>(() => ({
    type,
    text: initialData?.text || "",
    fontSize: initialData?.fontSize || 1,
    color: initialData?.color || "#000000",
    fontFamily: initialData?.fontFamily || "monospace",
    x: initialData?.x ?? 10,
    y: initialData?.y ?? 10,
    width: initialData?.width ?? 50,
    height: initialData?.height ?? 30,
    imageUrl: initialData?.imageUrl || "",
    alt: initialData?.alt || "",
    videoUrl: initialData?.videoUrl || "",
    autoPlay: initialData?.autoPlay || false,
    code: initialData?.code || "",
    language: initialData?.language || "javascript",
    zIndex: initialData?.zIndex ?? 0,
  }));

  const updateData = (updates: Partial<Element>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initialData ? "Edit" : "Add"} {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        <form onSubmit={handleSubmit}>
          {type === "text" && (
            <>
              <div className="form-group">
                <label>Text</label>
                <textarea
                  value={data.text || ""}
                  onChange={(e) => updateData({ text: e.target.value })}
                  placeholder="Enter text..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Font Size (em)</label>
                <input
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={data.fontSize || 1}
                  onChange={(e) => updateData({ fontSize: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Color (HEX)</label>
                <input
                  type="text"
                  value={data.color || "#000000"}
                  onChange={(e) => updateData({ color: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Font Family</label>
                <select
                  value={data.fontFamily || "monospace"}
                  onChange={(e) => updateData({ fontFamily: e.target.value })}
                >
                  <option value="monospace">Monospace</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans-serif</option>
                  <option value="cursive">Cursive</option>
                  <option value="fantasy">Fantasy</option>
                </select>
              </div>
            </>
          )}

          {type === "image" && (
            <>
              <div className="form-group">
                <label>Width (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={data.width || 50}
                  onChange={(e) => updateData({ width: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Height (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={data.height || 50}
                  onChange={(e) => updateData({ height: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  value={data.imageUrl || ""}
                  onChange={(e) => updateData({ imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Alt Text</label>
                <input
                  type="text"
                  value={data.alt || ""}
                  onChange={(e) => updateData({ alt: e.target.value })}
                  placeholder="Image description"
                />
              </div>
            </>
          )}

          {type === "video" && (
            <>
              <div className="form-group">
                <label>Width (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={data.width || 60}
                  onChange={(e) => updateData({ width: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Height (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={data.height || 40}
                  onChange={(e) => updateData({ height: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Video URL (YouTube embed)</label>
                <input
                  type="text"
                  value={data.videoUrl || ""}
                  onChange={(e) => updateData({ videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  autoFocus
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={data.autoPlay || false}
                    onChange={(e) => updateData({ autoPlay: e.target.checked })}
                  />
                  Auto Play
                </label>
              </div>
            </>
          )}

          {type === "code" && (
            <>
              <div className="form-group">
                <label>Code</label>
                <textarea
                  value={data.code || ""}
                  onChange={(e) => updateData({ code: e.target.value })}
                  placeholder="// Your code here..."
                  autoFocus
                  style={{ minHeight: "120px", fontFamily: "monospace" }}
                />
              </div>
              <div className="form-group">
                <label>Language</label>
                <select
                  value={data.language || "javascript"}
                  onChange={(e) => updateData({ language: e.target.value })}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Font Size (em)</label>
                <input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={data.fontSize || 1}
                  onChange={(e) => updateData({ fontSize: parseFloat(e.target.value) })}
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ BACKGROUND MODAL ============

interface BackgroundModalProps {
  currentSlideBg?: SlideBackground | null;
  defaultBg?: SlideBackground | null;
  onApplyToSlide: (_bg: SlideBackground | null) => void;
  onSetDefault: (_bg: SlideBackground | null) => void;
  onClose: () => void;
}

const GRADIENT_DIRECTIONS = [
  { label: "To Right", value: "to right" },
  { label: "To Left", value: "to left" },
  { label: "To Bottom", value: "to bottom" },
  { label: "To Top", value: "to top" },
  { label: "Diagonal", value: "to bottom right" },
];

function BackgroundModal({ currentSlideBg, defaultBg, onApplyToSlide, onSetDefault, onClose }: BackgroundModalProps) {
  const [style, setStyle] = useState<BackgroundStyle>(currentSlideBg?.style || defaultBg?.style || "solid");
  const [color, setColor] = useState(currentSlideBg?.color || defaultBg?.color || "#ffffff");
  const [gradientColors, setGradientColors] = useState<string[]>(
    currentSlideBg?.gradientColors || defaultBg?.gradientColors || ["#667eea", "#764ba2"]
  );
  const [gradientDirection, setGradientDirection] = useState(
    currentSlideBg?.gradientDirection || defaultBg?.gradientDirection || "to right"
  );
  const [imageUrl, setImageUrl] = useState(currentSlideBg?.imageUrl || defaultBg?.imageUrl || "");

  const previewStyle = (): React.CSSProperties => {
    if (style === "solid") return { backgroundColor: color };
    if (style === "gradient" && gradientColors.length >= 2) {
      return { background: `linear-gradient(${gradientDirection}, ${gradientColors.join(", ")})` };
    }
    if (style === "image" && imageUrl) {
      return { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    return { backgroundColor: "#ffffff" };
  };

  const buildBackground = (): SlideBackground => {
    if (style === "solid") return { style: "solid", color };
    if (style === "gradient") {
      return { style: "gradient", gradientColors, gradientDirection };
    }
    return { style: "image", imageUrl };
  };

  const addGradientColor = () => {
    if (gradientColors.length < 5) {
      setGradientColors([...gradientColors, "#ffffff"]);
    }
  };

  const handleGradientColorChange = (index: number, value: string) => {
    const next = [...gradientColors];
    next[index] = value;
    setGradientColors(next);
  };

  const removeGradientColor = (index: number) => {
    if (gradientColors.length > 2) {
      const next = [...gradientColors];
      next.splice(index, 1);
      setGradientColors(next);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Slide Background</h2>

        <div className="background-preview" style={{ ...previewStyle(), height: 100, borderRadius: 8, marginBottom: 16, border: "1px solid #ccc" }} />

        <div className="form-group">
          <label>Background Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value as BackgroundStyle)}>
            <option value="solid">Solid Colour</option>
            <option value="gradient">Gradient</option>
            <option value="image">Image</option>
          </select>
        </div>

        {style === "solid" && (
          <div className="form-group">
            <label>Colour (HEX)</label>
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#ffffff" />
          </div>
        )}

        {style === "gradient" && (
          <>
            <div className="form-group">
              <label>Direction</label>
              <select value={gradientDirection} onChange={(e) => setGradientDirection(e.target.value)}>
                {GRADIENT_DIRECTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Colours</label>
              {gradientColors.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input type="text" value={c} onChange={(e) => handleGradientColorChange(i, e.target.value)} placeholder="#ff0000" style={{ flex: 1 }} />
                  {gradientColors.length > 2 && (
                    <button type="button" className="btn btn-icon" onClick={() => removeGradientColor(i)} title="Remove colour">X</button>
                  )}
                </div>
              ))}
              {gradientColors.length < 5 && (
                <button type="button" className="btn btn-secondary" onClick={addGradientColor} style={{ marginTop: 4 }}>+ Add Colour</button>
              )}
            </div>
          </>
        )}

        {style === "image" && (
          <div className="form-group">
            <label>Image URL</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => onApplyToSlide(null)}>
            Use Default
          </button>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onApplyToSlide(buildBackground())}>
            Apply to Slide
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onSetDefault(buildBackground())}>
            Set as Default
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ SLIDE PANEL ============

interface SlidePanelProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSelect: (_index: number) => void;
  onClose: () => void;
  onReorder: (_fromIndex: number, _toIndex: number) => void;
  defaultBackground?: SlideBackground | null;
}

function SlidePanel({ slides, currentSlideIndex, onSelect, onClose, onReorder, defaultBackground }: SlidePanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const getSlideBgStyle = (slide: Slide): React.CSSProperties => {
    const slideBg = slide.background;
    if (slideBg) {
      if (slideBg.style === "solid") return { backgroundColor: slideBg.color || "#ffffff" };
      if (slideBg.style === "gradient" && slideBg.gradientColors && slideBg.gradientColors.length >= 2) {
        return { background: `linear-gradient(${slideBg.gradientDirection || "to right"}, ${slideBg.gradientColors.join(", ")})` };
      }
      if (slideBg.style === "image" && slideBg.imageUrl) {
        return { backgroundImage: `url(${slideBg.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
      }
    }
    if (defaultBackground) {
      if (defaultBackground.style === "solid") return { backgroundColor: defaultBackground.color || "#ffffff" };
      if (defaultBackground.style === "gradient" && defaultBackground.gradientColors && defaultBackground.gradientColors.length >= 2) {
        return { background: `linear-gradient(${defaultBackground.gradientDirection || "to right"}, ${defaultBackground.gradientColors.join(", ")})` };
      }
      if (defaultBackground.style === "image" && defaultBackground.imageUrl) {
        return { backgroundImage: `url(${defaultBackground.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
      }
    }
    return { backgroundColor: "#ffffff" };
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="slide-panel-header">
          <h2>Slide Navigator (Drag to reorder)</h2>
          <button className="btn btn-icon" onClick={onClose} title="Close">X</button>
        </div>
        <div className="slide-panel-grid">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`slide-panel-item${index === currentSlideIndex ? " active" : ""}${dragOverIndex === index ? " drag-over" : ""}${draggedIndex === index ? " dragging" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(index)}
              title={`Slide ${index + 1}`}
            >
              <div className="slide-preview" style={getSlideBgStyle(slide)}>
                {slide.elements.slice(0, 5).map((el) => (
                  <div
                    key={el.id}
                    className={`slide-preview-element preview-${el.type}`}
                    style={{
                      position: "absolute",
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      zIndex: el.zIndex,
                    }}
                  >
                    {el.type === "text" && (
                      <div style={{
                        fontSize: "0.4em",
                        color: el.color || "#000",
                        fontFamily: el.fontFamily || "monospace",
                        overflow: "hidden",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}>
                        {el.text?.substring(0, 20) || ""}
                      </div>
                    )}
                    {el.type === "image" && (
                      el.imageUrl ? <img src={el.imageUrl} alt={el.alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null
                    )}
                    {el.type === "video" && (
                      <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.3em", color: "#fff" }}>VID</div>
                    )}
                    {el.type === "code" && (
                      <div style={{
                        fontSize: "0.25em",
                        fontFamily: "monospace",
                        background: "#1e1e1e",
                        color: "#d4d4d4",
                        overflow: "hidden",
                        padding: "2px",
                      }}>
                        {el.code?.substring(0, 30) || ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="slide-panel-number">Slide {index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ REVISION HISTORY ============

interface RevisionHistoryProps {
  presentationId: number;
  onClose: () => void;
  onRestore: () => void;
}

function RevisionHistory({ presentationId, onClose, onRestore }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    const revs = getRevisions(presentationId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevisions(revs);
  }, [presentationId]);

  const handleRestore = async (revisionId: string) => {
    try {
      setRestoring(revisionId);
      await restoreRevision(presentationId, revisionId);
      onRestore();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore");
    } finally {
      setRestoring(null);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal revision-modal" onClick={(e) => e.stopPropagation()}>
        <div className="revision-header">
          <h2>Revision History</h2>
          <button className="btn btn-icon" onClick={onClose} title="Close">X</button>
        </div>
        <div className="revision-list">
          {revisions.length === 0 ? (
            <p className="revision-empty">No revisions yet. Revisions are saved automatically when you make changes.</p>
          ) : (
            revisions.map((revision) => (
              <div key={revision.id} className="revision-item">
                <div className="revision-info">
                  <span className="revision-time">{formatTime(revision.timestamp)}</span>
                  <span className="revision-slides">{revision.slides.length} slide{revision.slides.length !== 1 ? "s" : ""}</span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleRestore(revision.id)}
                  disabled={restoring === revision.id}
                >
                  {restoring === revision.id ? "Restoring..." : "Restore"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============ EDIT PRESENTATION PAGE ============

function EditPresentation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [presentation, setPresentation] = useState<PresentationDetail | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(() => {
    const slideParam = searchParams.get("slide");
    return slideParam ? Math.max(0, parseInt(slideParam) - 1) : 0;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [showDeletePresModal, setShowDeletePresModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showThumbModal, setShowThumbModal] = useState(false);
  const [showDeleteSlideModal, setShowDeleteSlideModal] = useState(false);
  const [showElementModal, setShowElementModal] = useState<ElementType | null>(null);
  const [showEditModal, setShowEditModal] = useState<Element | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editThumb, setEditThumb] = useState("");
  const [showBgModal, setShowBgModal] = useState(false);
  const [defaultBackground, setDefaultBackground] = useState<SlideBackground | null | undefined>(undefined);
  const [showSlidePanel, setShowSlidePanel] = useState(false);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [slideTransition, setSlideTransition] = useState<"enter" | "exit" | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<"nw" | "ne" | "sw" | "se" | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number; elX: number; elY: number } | null>(null);

  const presentationId = id ? parseInt(id) : 0;

  useEffect(() => {
    setSearchParams({ slide: String(currentSlideIndex + 1) }, { replace: true });
  }, [currentSlideIndex, setSearchParams]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPresentation(presentationId);
      setPresentation(data);
      setEditTitle(data.name);
      setEditThumb(data.thumbnail || "");
      setSlides(data.slides || []);
      setDefaultBackground(data.defaultBackground);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [presentationId]);

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setSlideTransition("exit");
      setTimeout(() => {
        setCurrentSlideIndex(currentSlideIndex - 1);
        setSlideTransition("enter");
        setTimeout(() => setSlideTransition(null), 300);
      }, 150);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setSlideTransition("exit");
      setTimeout(() => {
        setCurrentSlideIndex(currentSlideIndex + 1);
        setSlideTransition("enter");
        setTimeout(() => setSlideTransition(null), 300);
      }, 150);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlideIndex, slides.length]);

  const handleDeletePresentation = async () => {
    try {
      await deletePresentation(presentationId);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setShowError(true);
    }
  };

  const handleUpdateTitle = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updatePresentation(presentationId, { name: editTitle });
      setShowTitleModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
      setShowError(true);
    }
  };

  const handleUpdateThumb = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updatePresentation(presentationId, { thumbnail: editThumb });
      setShowThumbModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
      setShowError(true);
    }
  };

  const handleCreateSlide = async () => {
    try {
      await createSlide(presentationId);
      await load();
      setCurrentSlideIndex((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create slide");
      setShowError(true);
    }
  };

  const handleDeleteSlide = async () => {
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    try {
      await deleteSlide(presentationId, slide.id);
      await load();
      if (currentSlideIndex >= slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, slides.length - 2));
      }
      setShowDeleteSlideModal(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes("only slide")) {
        setError("Cannot delete the only slide. Delete the presentation instead.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to delete slide");
      }
      setShowError(true);
      setShowDeleteSlideModal(false);
    }
  };

  const handleReorderSlides = async (fromIndex: number, toIndex: number) => {
    try {
      await reorderSlides(presentationId, fromIndex, toIndex);
      await load();
      if (currentSlideIndex === fromIndex) {
        setCurrentSlideIndex(toIndex);
      } else if (fromIndex < currentSlideIndex && toIndex >= currentSlideIndex) {
        setCurrentSlideIndex(currentSlideIndex - 1);
      } else if (fromIndex > currentSlideIndex && toIndex <= currentSlideIndex) {
        setCurrentSlideIndex(currentSlideIndex + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder slides");
      setShowError(true);
    }
  };

  const handleAddElement = async (elementData: Partial<Element>) => {
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    try {
      await addElement(presentationId, slide.id, elementData);
      setShowElementModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add element");
      setShowError(true);
    }
  };

  const handleUpdateElement = async (elementData: Partial<Element>) => {
    const slide = slides[currentSlideIndex];
    if (!slide || !showEditModal) return;

    try {
      await updateElement(presentationId, slide.id, showEditModal.id, elementData);
      setShowEditModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update element");
      setShowError(true);
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    try {
      await deleteElement(presentationId, slide.id, elementId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete element");
      setShowError(true);
    }
  };

  const handleApplyBgToSlide = async (bg: SlideBackground | null) => {
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    try {
      await updateSlideBackground(presentationId, slide.id, bg);
      setShowBgModal(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update background");
      setShowError(true);
    }
  };

  const handleSetDefaultBg = async (bg: SlideBackground | null) => {
    try {
      await updatePresentation(presentationId, { defaultBackground: bg });
      setShowBgModal(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default background");
      setShowError(true);
    }
  };

  const handleRightClick = (e: React.MouseEvent, element: SlideElement) => {
    e.preventDefault();
    if (window.confirm("Delete this element?")) {
      handleDeleteElement(element.id);
    }
  };

  const handleDoubleClick = (element: SlideElement) => {
    setSelectedElementId(null);
    setShowEditModal(element);
  };

  const handleElementClick = (e: React.MouseEvent, element: SlideElement) => {
    e.stopPropagation();
    setSelectedElementId(element.id);
    setShowEditModal(null);
  };

  const handleResizeStart = (e: React.MouseEvent, handle: "nw" | "ne" | "sw" | "se", element: SlideElement) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
      elX: element.x,
      elY: element.y,
    });
  };

  // Global mouse move and mouse up handlers for resizing
  useEffect(() => {
    if (resizeHandle && resizeStart && selectedElementId) {
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = (e.clientX - resizeStart.x) / 10;
        const deltaY = (e.clientY - resizeStart.y) / 10;
        const slide = slides[currentSlideIndex];
        if (!slide) return;
        const element = slide.elements.find(el => el.id === selectedElementId);
        if (!element) return;

        let newX = resizeStart.elX;
        let newY = resizeStart.elY;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;

        if (resizeHandle === "se") {
          newWidth = Math.max(1, Math.min(100 - newX, resizeStart.width + deltaX));
          newHeight = Math.max(1, Math.min(100 - newY, resizeStart.height + deltaY));
        } else if (resizeHandle === "sw") {
          newWidth = Math.max(1, resizeStart.width - deltaX);
          newHeight = Math.max(1, Math.min(100 - newY, resizeStart.height + deltaY));
          if (newWidth !== resizeStart.width) {
            newX = resizeStart.elX + (resizeStart.width - newWidth);
          }
        } else if (resizeHandle === "ne") {
          newWidth = Math.max(1, Math.min(100 - newX, resizeStart.width + deltaX));
          newHeight = Math.max(1, resizeStart.height - deltaY);
          if (newHeight !== resizeStart.height) {
            newY = resizeStart.elY + (resizeStart.height - newHeight);
          }
        } else if (resizeHandle === "nw") {
          newWidth = Math.max(1, resizeStart.width - deltaX);
          newHeight = Math.max(1, resizeStart.height - deltaY);
          if (newWidth !== resizeStart.width) {
            newX = resizeStart.elX + (resizeStart.width - newWidth);
          }
          if (newHeight !== resizeStart.height) {
            newY = resizeStart.elY + (resizeStart.height - newHeight);
          }
        }

        // Clamp to slide boundaries
        newX = Math.max(0, Math.min(100 - newWidth, newX));
        newY = Math.max(0, Math.min(100 - newHeight, newY));

        // Update element
        updateElement(presentationId, slide.id, element.id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        }).catch(() => {});
      };

      const handleMouseUp = () => {
        setResizeHandle(null);
        setResizeStart(null);
        load();
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizeHandle, resizeStart, selectedElementId, currentSlideIndex, slides, presentationId]);

  const getSlideBackgroundStyle = (): React.CSSProperties => {
    const slideBg = currentSlide?.background;
    if (slideBg) {
      if (slideBg.style === "solid") return { backgroundColor: slideBg.color || "#ffffff" };
      if (slideBg.style === "gradient" && slideBg.gradientColors && slideBg.gradientColors.length >= 2) {
        return { background: `linear-gradient(${slideBg.gradientDirection || "to right"}, ${slideBg.gradientColors.join(", ")})` };
      }
      if (slideBg.style === "image" && slideBg.imageUrl) {
        return { backgroundImage: `url(${slideBg.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
      }
    }
    if (defaultBackground) {
      if (defaultBackground.style === "solid") return { backgroundColor: defaultBackground.color || "#ffffff" };
      if (defaultBackground.style === "gradient" && defaultBackground.gradientColors && defaultBackground.gradientColors.length >= 2) {
        return { background: `linear-gradient(${defaultBackground.gradientDirection || "to right"}, ${defaultBackground.gradientColors.join(", ")})` };
      }
      if (defaultBackground.style === "image" && defaultBackground.imageUrl) {
        return { backgroundImage: `url(${defaultBackground.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
      }
    }
    return { backgroundColor: "#ffffff" };
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!presentation) return <div className="error">{error}</div>;

  const currentSlide = slides[currentSlideIndex];
  const elements = currentSlide?.elements || [];
  const hasMultipleSlides = slides.length > 1;

  return (
    <div className="edit-presentation">
      <header className="edit-header">
        <button className="btn btn-back" onClick={() => navigate("/dashboard")}>
          Back
        </button>
        <div className="title-area">
          <h1>{presentation.name}</h1>
          <button
            className="btn btn-icon"
            onClick={() => setShowTitleModal(true)}
            title="Edit title"
          >
            Edit
          </button>
        </div>
        <button
          className="btn btn-danger"
          onClick={() => setShowDeletePresModal(true)}
        >
          Delete Presentation
        </button>
      </header>

      {showError && error && (
        <ErrorPopup message={error} onClose={() => setShowError(false)} />
      )}

      <div className="slide-container">
        <div className="slide-content">
          <div className="slide-number">Slide {currentSlideIndex + 1}</div>

          <div
            className={`slide-area${slideTransition ? ` slide-transition-${slideTransition}` : ""}`}
            style={getSlideBackgroundStyle()}
            onClick={() => setSelectedElementId(null)}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className={`slide-element element-${element.type}${selectedElementId === element.id ? " selected" : ""}`}
                style={{
                  position: "absolute",
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.width}%`,
                  height: `${element.height}%`,
                  zIndex: element.zIndex,
                }}
                onClick={(e) => handleElementClick(e, element)}
                onContextMenu={(e) => handleRightClick(e, element)}
                onDoubleClick={() => handleDoubleClick(element)}
              >
                {/* Resize handles - only show when selected */}
                {selectedElementId === element.id && (
                  <>
                    <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeStart(e, "nw", element)} />
                    <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeStart(e, "ne", element)} />
                    <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeStart(e, "sw", element)} />
                    <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, "se", element)} />
                  </>
                )}
                {element.type === "text" && (
                  <div
                    className="element-text"
                    style={{
                      fontSize: `${element.fontSize || 1}em`,
                      color: element.color || "#000000",
                      fontFamily: element.fontFamily || "monospace",
                      width: "100%",
                      height: "100%",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {element.text || ""}
                  </div>
                )}

                {element.type === "image" && (
                  <img
                    src={element.imageUrl}
                    alt={element.alt || ""}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                )}

                {element.type === "video" && (
                  <iframe
                    src={`${element.videoUrl}${element.autoPlay ? "?autoplay=1" : ""}`}
                    title="Video"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}

                {element.type === "code" && (
                  <pre
                    className={`element-code language-${element.language || "javascript"}`}
                    style={{
                      fontSize: `${element.fontSize || 1}em`,
                      fontFamily: "monospace",
                      width: "100%",
                      height: "100%",
                      overflow: "auto",
                      margin: 0,
                      padding: "8px",
                      background: "#f5f5f5",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      whiteSpace: "pre",
                    }}
                  >
                    <code>{element.code || ""}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>

          {hasMultipleSlides && (
            <div className="slide-nav">
              <button
                className={`btn nav-btn ${currentSlideIndex === 0 ? "disabled" : ""}`}
                onClick={handlePrev}
                disabled={currentSlideIndex === 0}
                title="Previous slide"
              >
                Prev
              </button>
              <button
                className={`btn nav-btn ${currentSlideIndex === slides.length - 1 ? "disabled" : ""}`}
                onClick={handleNext}
                disabled={currentSlideIndex === slides.length - 1}
                title="Next slide"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="slide-actions">
        <button
          className="btn btn-secondary"
          onClick={() => setShowSlidePanel(true)}
        >
          Slide Navigator
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowRevisionHistory(true)}
        >
          Revision History
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => window.open(`/preview/${id}?slide=${currentSlideIndex + 1}`, "_blank")}
        >
          Preview
        </button>
        <button className="btn btn-primary" onClick={handleCreateSlide}>
          Add Slide
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowDeleteSlideModal(true)}
        >
          Delete Slide
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowThumbModal(true)}
        >
          Update Thumbnail
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowBgModal(true)}
        >
          Background
        </button>
        <div className="element-tools">
          <button
            className="btn btn-tool"
            onClick={() => setShowElementModal("text")}
            title="Add Text"
          >
            Add Text
          </button>
          <button
            className="btn btn-tool"
            onClick={() => setShowElementModal("image")}
            title="Add Image"
          >
            Add Image
          </button>
          <button
            className="btn btn-tool"
            onClick={() => setShowElementModal("video")}
            title="Add Video"
          >
            Add Video
          </button>
          <button
            className="btn btn-tool"
            onClick={() => setShowElementModal("code")}
            title="Add Code"
          >
            Add Code
          </button>
        </div>
      </div>

      {showDeletePresModal && (
        <div className="modal-overlay" onClick={() => setShowDeletePresModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to delete this presentation?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeletePresModal(false)}>
                No
              </button>
              <button className="btn btn-danger" onClick={handleDeletePresentation}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSlideModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteSlideModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <p>Delete this slide?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteSlideModal(false)}>
                No
              </button>
              <button className="btn btn-danger" onClick={handleDeleteSlide}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showTitleModal && (
        <div className="modal-overlay" onClick={() => setShowTitleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Title</h2>
            <form onSubmit={handleUpdateTitle}>
              <div className="form-group">
                <label>Presentation Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTitleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showThumbModal && (
        <div className="modal-overlay" onClick={() => setShowThumbModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Update Thumbnail</h2>
            <form onSubmit={handleUpdateThumb}>
              <div className="form-group">
                <label>Thumbnail URL</label>
                <input
                  type="text"
                  value={editThumb}
                  onChange={(e) => setEditThumb(e.target.value)}
                  placeholder="Image URL"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowThumbModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showElementModal && (
        <ElementModal
          type={showElementModal}
          onSave={handleAddElement}
          onClose={() => setShowElementModal(null)}
        />
      )}

      {showEditModal && (
        <ElementModal
          type={showEditModal.type}
          initialData={showEditModal}
          onSave={handleUpdateElement}
          onClose={() => setShowEditModal(null)}
        />
      )}

      {showBgModal && (
        <BackgroundModal
          currentSlideBg={currentSlide?.background}
          defaultBg={defaultBackground}
          onApplyToSlide={handleApplyBgToSlide}
          onSetDefault={handleSetDefaultBg}
          onClose={() => setShowBgModal(false)}
        />
      )}

      {showSlidePanel && (
        <SlidePanel
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          onSelect={(index) => {
            setCurrentSlideIndex(index);
            setShowSlidePanel(false);
          }}
          onClose={() => setShowSlidePanel(false)}
          onReorder={handleReorderSlides}
          defaultBackground={defaultBackground}
        />
      )}

      {showRevisionHistory && (
        <RevisionHistory
          presentationId={presentationId}
          onClose={() => setShowRevisionHistory(false)}
          onRestore={load}
        />
      )}
    </div>
  );
}

// ============ PREVIEW PRESENTATION PAGE ============

function PreviewPresentation() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [presentation, setPresentation] = useState<PresentationDetail | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(() => {
    const slideParam = searchParams.get("slide");
    return slideParam ? Math.max(0, parseInt(slideParam) - 1) : 0;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [defaultBackground, setDefaultBackground] = useState<SlideBackground | null | undefined>(undefined);
  const [slideTransition, setSlideTransition] = useState<"enter" | "exit" | null>(null);

  const presentationId = id ? parseInt(id) : 0;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getPresentation(presentationId);
        setPresentation(data);
        setSlides(data.slides || []);
        setDefaultBackground(data.defaultBackground);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [presentationId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("slide", String(currentSlideIndex + 1));
    window.history.replaceState(null, "", url.toString());
  }, [currentSlideIndex]);

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setSlideTransition("exit");
      setTimeout(() => {
        setCurrentSlideIndex(currentSlideIndex - 1);
        setSlideTransition("enter");
        setTimeout(() => setSlideTransition(null), 300);
      }, 150);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setSlideTransition("exit");
      setTimeout(() => {
        setCurrentSlideIndex(currentSlideIndex + 1);
        setSlideTransition("enter");
        setTimeout(() => setSlideTransition(null), 300);
      }, 150);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlideIndex, slides.length]);

  const getSlideBackgroundStyle = (): React.CSSProperties => {
    const slideBg = currentSlide?.background;
    if (slideBg) {
      if (slideBg.style === "solid") return { backgroundColor: slideBg.color || "#ffffff" };
      if (slideBg.style === "gradient" && slideBg.gradientColors && slideBg.gradientColors.length >= 2) {
        return { background: `linear-gradient(${slideBg.gradientDirection || "to right"}, ${slideBg.gradientColors.join(", ")})` };
      }
      if (slideBg.style === "image" && slideBg.imageUrl) {
        return { backgroundImage: `url(${slideBg.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
      }
    }
    if (defaultBackground) {
      if (defaultBackground.style === "solid") return { backgroundColor: defaultBackground.color || "#ffffff" };
      if (defaultBackground.style === "gradient" && defaultBackground.gradientColors && defaultBackground.gradientColors.length >= 2) {
        return { background: `linear-gradient(${defaultBackground.gradientDirection || "to right"}, ${defaultBackground.gradientColors.join(", ")})` };
      }
      if (defaultBackground.style === "image" && defaultBackground.imageUrl) {
        return { backgroundImage: `url(${defaultBackground.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
      }
    }
    return { backgroundColor: "#ffffff" };
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!presentation || slides.length === 0) return <div className="loading">No slides</div>;

  const currentSlide = slides[currentSlideIndex];
  const hasMultipleSlides = slides.length > 1;

  return (
    <div className="preview-container">
      <div className="preview-header">
        <h1>{presentation.name}</h1>
        <button className="btn btn-secondary" onClick={() => window.close()}>
          Close Preview
        </button>
      </div>
      <div
        className={`preview-slide-area${slideTransition ? ` slide-transition-${slideTransition}` : ""}`}
        style={getSlideBackgroundStyle()}
      >
        {currentSlide.elements.map((element) => (
          <div
            key={element.id}
            className={`preview-element element-${element.type}`}
            style={{
              position: "absolute",
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.width}%`,
              height: `${element.height}%`,
              zIndex: element.zIndex,
            }}
          >
            {element.type === "text" && (
              <div
                className="element-text"
                style={{
                  fontSize: `${element.fontSize || 1}em`,
                  color: element.color || "#000000",
                  fontFamily: element.fontFamily || "monospace",
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {element.text || ""}
              </div>
            )}
            {element.type === "image" && (
              <img
                src={element.imageUrl}
                alt={element.alt || ""}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            )}
            {element.type === "video" && (
              <iframe
                src={`${element.videoUrl}${element.autoPlay ? "?autoplay=1" : ""}`}
                title="Video"
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            {element.type === "code" && (
              <pre
                className={`element-code language-${element.language || "javascript"}`}
                style={{
                  fontSize: `${element.fontSize || 1}em`,
                  fontFamily: "monospace",
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  whiteSpace: "pre",
                }}
              >
                <code>{element.code || ""}</code>
              </pre>
            )}
          </div>
        ))}
      </div>
      {hasMultipleSlides && (
        <div className="preview-controls">
          <button
            className={`btn nav-btn ${currentSlideIndex === 0 ? "disabled" : ""}`}
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
          >
            Prev
          </button>
          <span className="slide-counter">{currentSlideIndex + 1} / {slides.length}</span>
          <button
            className={`btn nav-btn ${currentSlideIndex === slides.length - 1 ? "disabled" : ""}`}
            onClick={handleNext}
            disabled={currentSlideIndex === slides.length - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ============ APP ROOT ============

function App() {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(payload.email);
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (email: string, _token: string) => {
    setUser(email);
    void _token; // Token is stored in localStorage via setToken in LoginPage
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/dashboard"
          element={
            user || getToken() ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/presentation/:id"
          element={
            user || getToken() ? (
              <EditPresentation />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/preview/:id"
          element={<PreviewPresentation />}
        />
        <Route
          path="/"
          element={
            user || getToken() ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
