import React, { useState, useEffect, useRef } from "react";

// ============================================================
// ⚙️  CONFIGURATION — REPLACE THESE VALUES WITH YOUR OWN
// ============================================================
const CONFIG = {
  GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN,     // Set in Cloudflare env vars
  GITHUB_OWNER: "glazglowgallery",                      // 👈 Your GitHub username
  GITHUB_REPO:  "glazglowgallery",                      // 👈 Your repository name
  GITHUB_BRANCH: "main",                                // 👈 Your branch name
  ADMIN_PASSWORD: "glazglow2026",                       // 👈 Change this password
};
// ============================================================

const GITHUB_API = "https://api.github.com";

async function githubGet(path) {
  const res = await fetch(`${GITHUB_API}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}?ref=${CONFIG.GITHUB_BRANCH}`, {
    headers: { Authorization: `token ${CONFIG.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  return res.json();
}

async function githubPut(path, content, message, sha = null) {
  const body = { message, content: btoa(unescape(encodeURIComponent(content))), branch: CONFIG.GITHUB_BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${GITHUB_API}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `token ${CONFIG.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || `GitHub PUT failed: ${res.status}`); }
  return res.json();
}

async function githubPutBinary(path, base64Content, message, sha = null) {
  const body = { message, content: base64Content, branch: CONFIG.GITHUB_BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${GITHUB_API}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `token ${CONFIG.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Upload failed"); }
  return res.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Toast ──
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const bg = type === "success" ? "#4a9e6b" : type === "error" ? "#c0392b" : "#B07D4F";
  return (
    <div style={{ position:"fixed", bottom:"2rem", left:"50%", transform:"translateX(-50%)", background:bg, color:"white", padding:"1rem 2rem", borderRadius:"4px", zIndex:9999, fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", boxShadow:"0 4px 20px rgba(0,0,0,.3)", maxWidth:"90vw", textAlign:"center" }}>
      {message}
    </div>
  );
}

function Spinner() {
  return <div style={{ width:"20px", height:"20px", border:"2px solid rgba(255,255,255,.3)", borderTop:"2px solid white", borderRadius:"50%", animation:"spin .8s linear infinite", display:"inline-block" }} />;
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom:"2rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:".4rem" }}>
        <span style={{ fontSize:"1.6rem" }}>{icon}</span>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.8rem", fontWeight:300, color:"#2B1F14" }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontSize:".85rem", color:"#4A3728", marginLeft:"2.4rem" }}>{subtitle}</p>}
    </div>
  );
}

function Input({ label, value, onChange, type="text", placeholder, multiline }) {
  const style = { width:"100%", padding:".75rem 1rem", border:"1.5px solid #EDE3D6", borderRadius:"4px", fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", color:"#2B1F14", background:"#FDFAF6", outline:"none", resize: multiline ? "vertical" : "none", minHeight: multiline ? "100px" : "auto" };
  return (
    <div style={{ marginBottom:"1rem" }}>
      {label && <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".4rem" }}>{label}</label>}
      {multiline
        ? <textarea style={style} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input style={style} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  );
}

function Btn({ children, onClick, variant="primary", disabled, loading, small }) {
  const base = { border:"none", cursor: disabled ? "not-allowed" : "pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:".1em", textTransform:"uppercase", borderRadius:"2px", display:"inline-flex", alignItems:"center", gap:".5rem", transition:"all .2s", opacity: disabled ? .6 : 1 };
  const variants = {
    primary:  { background:"#2B1F14", color:"#F7F2EC", padding: small ? ".5rem 1.2rem" : ".75rem 1.8rem", fontSize: small ? ".72rem" : ".8rem" },
    amber:    { background:"#B07D4F", color:"#F7F2EC", padding: small ? ".5rem 1.2rem" : ".75rem 1.8rem", fontSize: small ? ".72rem" : ".8rem" },
    danger:   { background:"#c0392b", color:"white",   padding: small ? ".5rem 1rem"  : ".75rem 1.5rem", fontSize: small ? ".7rem"  : ".78rem" },
    outline:  { background:"transparent", color:"#2B1F14", border:"1.5px solid #C9B49A", padding: small ? ".5rem 1.2rem" : ".75rem 1.8rem", fontSize: small ? ".72rem" : ".8rem" },
    green:    { background:"#4a9e6b", color:"white", padding: small ? ".5rem 1.2rem" : ".75rem 1.8rem", fontSize: small ? ".72rem" : ".8rem" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled || loading}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

// ══════════════════════════════════════════════
//  LOGIN SCREEN
// ══════════════════════════════════════════════
function Login({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (pw === CONFIG.ADMIN_PASSWORD) onLogin();
    else { setError("Incorrect password. Please try again."); setPw(""); }
  };
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#2B1F14 0%,#4A3728 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:"#F7F2EC", borderRadius:"4px", padding:"3rem 2.5rem", width:"100%", maxWidth:"400px", boxShadow:"0 20px 60px rgba(0,0,0,.4)" }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.2rem", fontWeight:300, color:"#2B1F14" }}>
            Glaz<span style={{ color:"#B07D4F", fontStyle:"italic" }}>Glow</span>
          </h1>
          <p style={{ fontSize:".8rem", letterSpacing:".2em", textTransform:"uppercase", color:"#C9B49A", marginTop:".3rem" }}>Gallery Admin</p>
        </div>
        <Input label="Admin Password" type="password" value={pw} onChange={setPw} placeholder="Enter password" />
        {error && <p style={{ color:"#c0392b", fontSize:".83rem", marginBottom:"1rem", textAlign:"center" }}>{error}</p>}
        <Btn onClick={submit} variant="amber" disabled={!pw}>Sign In →</Btn>
        <p style={{ fontSize:".75rem", color:"#C9B49A", textAlign:"center", marginTop:"1.5rem" }}>GlazGlow Gallery Management System</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  PRODUCTS TAB
// ══════════════════════════════════════════════
function ProductsTab({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [form, setForm] = useState({ title:"", category:"Resin Art", price:"", original_price:"", badge:"", description:"", image:"" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  const productFiles = ["ocean-geode-pour","sunset-fluid-art","desert-horizon","galaxy-resin-panel","warm-earth-relief","teal-agate-slice","linen-clay-weave","rose-nebula-pour"];

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    const loaded = [];
    for (const slug of productFiles) {
      try {
        const data = await githubGet(`content/products/${slug}.json`);
        const content = JSON.parse(atob(data.content.replace(/\n/g,"")));
        loaded.push({ ...content, slug, sha: data.sha });
      } catch { loaded.push({ slug, title: slug, category:"Resin Art", price:"$0", description:"", image:"", sha: null }); }
    }
    setProducts(loaded);
    setLoading(false);
  }

  function startEdit(p, idx) {
    setEditingIdx(idx);
    setForm({ title: p.title||"", category: p.category||"Resin Art", price: p.price||"", original_price: p.original_price||"", badge: p.badge||"", description: p.description||"", image: p.image||"" });
    setImageFile(null);
    setImagePreview(p.image || null);
  }

  function cancelEdit() { setEditingIdx(null); setImageFile(null); setImagePreview(null); }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function saveProduct() {
    setSaving(true);
    try {
      const p = products[editingIdx];
      let imagePath = form.image;
      if (imageFile) {
        const b64 = await fileToBase64(imageFile);
        const imgPath = `images/products/${p.slug}-${Date.now()}.${imageFile.name.split(".").pop()}`;
        await githubPutBinary(imgPath, b64, `Upload image for ${p.slug}`);
        imagePath = `/${imgPath}`;
      }
      const updated = { title: form.title, category: form.category, price: form.price, description: form.description, image: imagePath };
      if (form.original_price) updated.original_price = form.original_price;
      if (form.badge) updated.badge = form.badge;
      await githubPut(`content/products/${p.slug}.json`, JSON.stringify(updated, null, 2), `Update product: ${form.title}`, p.sha);
      showToast("✅ Product saved! Website will update in 1-2 minutes.", "success");
      setEditingIdx(null);
      loadProducts();
    } catch(e) { showToast(`❌ Error: ${e.message}`, "error"); }
    setSaving(false);
  }

  if (loading) return <div style={{ textAlign:"center", padding:"4rem", color:"#C9B49A" }}>Loading products...</div>;

  if (editingIdx !== null) {
    const p = products[editingIdx];
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"2rem" }}>
          <Btn onClick={cancelEdit} variant="outline" small>← Back</Btn>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300, color:"#2B1F14" }}>Edit: {p.title}</h3>
        </div>
        <Input label="Product Name" value={form.title} onChange={v => setForm({...form, title:v})} placeholder="e.g. Ocean Geode Pour" />
        <div style={{ marginBottom:"1rem" }}>
          <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".4rem" }}>Category</label>
          <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} style={{ width:"100%", padding:".75rem 1rem", border:"1.5px solid #EDE3D6", borderRadius:"4px", fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", background:"#FDFAF6" }}>
            <option>Resin Art</option>
            <option>Textured Art</option>
          </select>
        </div>
        <Input label="Price (e.g. $185)" value={form.price} onChange={v => setForm({...form, price:v})} placeholder="$185" />
        <Input label="Original Price (optional, for sale)" value={form.original_price} onChange={v => setForm({...form, original_price:v})} placeholder="$220" />
        <div style={{ marginBottom:"1rem" }}>
          <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".4rem" }}>Badge (optional)</label>
          <select value={form.badge} onChange={e => setForm({...form, badge:e.target.value})} style={{ width:"100%", padding:".75rem 1rem", border:"1.5px solid #EDE3D6", borderRadius:"4px", fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", background:"#FDFAF6" }}>
            <option value="">No Badge</option>
            <option value="New">New</option>
            <option value="Limited">Limited</option>
          </select>
        </div>
        <Input label="Description" value={form.description} onChange={v => setForm({...form, description:v})} placeholder="Describe this artwork..." multiline />
        <div style={{ marginBottom:"1.5rem" }}>
          <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".8rem" }}>Product Photo</label>
          {imagePreview && (
            <div style={{ marginBottom:"1rem", borderRadius:"4px", overflow:"hidden", maxHeight:"200px", background:"#EDE3D6" }}>
              <img src={imagePreview} alt="preview" style={{ width:"100%", height:"200px", objectFit:"cover" }} onError={e => e.target.style.display="none"} />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display:"none" }} />
          <Btn onClick={() => fileRef.current.click()} variant="outline" small>📷 {imagePreview ? "Change Photo" : "Upload Photo"}</Btn>
          {imageFile && <span style={{ fontSize:".78rem", color:"#4a9e6b", marginLeft:"1rem" }}>✓ {imageFile.name}</span>}
        </div>
        <div style={{ display:"flex", gap:"1rem", marginTop:"2rem" }}>
          <Btn onClick={saveProduct} variant="amber" loading={saving} disabled={!form.title || !form.price}>💾 Save Product</Btn>
          <Btn onClick={cancelEdit} variant="outline" disabled={saving}>Cancel</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader icon="🎨" title="Products" subtitle="Tap any product to edit its details, price, or photo" />
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
        {products.map((p, i) => (
          <div key={p.slug} onClick={() => startEdit(p, i)} style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.2rem", display:"flex", alignItems:"center", gap:"1rem", cursor:"pointer" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"3px", background:"#EDE3D6", flexShrink:0, overflow:"hidden" }}>
              {p.image && <img src={p.image} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display="none"} />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", color:"#2B1F14", marginBottom:".2rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.title}</p>
              <p style={{ fontSize:".75rem", color:"#C9B49A", letterSpacing:".1em", textTransform:"uppercase" }}>{p.category}</p>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <p style={{ color:"#B07D4F", fontWeight:500 }}>{p.price}</p>
              {p.badge && <span style={{ fontSize:".68rem", background:"#2B1F14", color:"#F7F2EC", padding:".2rem .5rem", borderRadius:"2px" }}>{p.badge}</span>}
            </div>
            <span style={{ color:"#C9B49A", fontSize:"1.2rem" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  REVIEWS TAB
// ══════════════════════════════════════════════
function ReviewsTab({ showToast }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState({ name:"", location:"", review:"", rating:5 });

  const reviewFiles = ["priya-m","james-t","anika-r"];

  useEffect(() => { loadReviews(); }, []);

  async function loadReviews() {
    setLoading(true);
    const loaded = [];
    for (const slug of reviewFiles) {
      try {
        const data = await githubGet(`content/reviews/${slug}.json`);
        const content = JSON.parse(atob(data.content.replace(/\n/g,"")));
        loaded.push({ ...content, slug, sha: data.sha });
      } catch { /* skip */ }
    }
    setReviews(loaded);
    setLoading(false);
  }

  function startEdit(r, idx) { setEditingIdx(idx); setAddingNew(false); setForm({ name: r.name||"", location: r.location||"", review: r.review||"", rating: r.rating||5 }); }
  function startAdd() { setAddingNew(true); setEditingIdx(null); setForm({ name:"", location:"", review:"", rating:5 }); }
  function cancel() { setEditingIdx(null); setAddingNew(false); }

  async function saveReview() {
    setSaving(true);
    try {
      const slug = addingNew ? form.name.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-") : reviews[editingIdx].slug;
      const sha = addingNew ? null : reviews[editingIdx].sha;
      const data = { name: form.name, location: form.location, review: form.review, rating: Number(form.rating) };
      await githubPut(`content/reviews/${slug}.json`, JSON.stringify(data, null, 2), `${addingNew?"Add":"Update"} review: ${form.name}`, sha);
      showToast(`✅ Review ${addingNew?"added":"updated"}! Website will update in 1-2 minutes.`, "success");
      cancel(); loadReviews();
    } catch(e) { showToast(`❌ Error: ${e.message}`, "error"); }
    setSaving(false);
  }

  if (loading) return <div style={{ textAlign:"center", padding:"4rem", color:"#C9B49A" }}>Loading reviews...</div>;

  if (editingIdx !== null || addingNew) {
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"2rem" }}>
          <Btn onClick={cancel} variant="outline" small>← Back</Btn>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300 }}>{addingNew ? "Add New Review" : "Edit Review"}</h3>
        </div>
        <Input label="Customer Name" value={form.name} onChange={v => setForm({...form, name:v})} placeholder="e.g. Sarah M." />
        <Input label="Location" value={form.location} onChange={v => setForm({...form, location:v})} placeholder="e.g. Melbourne, VIC" />
        <Input label="Review Text" value={form.review} onChange={v => setForm({...form, review:v})} placeholder="What did the customer say?" multiline />
        <div style={{ marginBottom:"1.5rem" }}>
          <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".4rem" }}>Rating</label>
          <div style={{ display:"flex", gap:".5rem" }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setForm({...form, rating:n})} style={{ fontSize:"1.6rem", background:"none", border:"none", cursor:"pointer", opacity: n <= form.rating ? 1 : .3 }}>★</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:"1rem" }}>
          <Btn onClick={saveReview} variant="amber" loading={saving} disabled={!form.name || !form.review}>💾 Save Review</Btn>
          <Btn onClick={cancel} variant="outline" disabled={saving}>Cancel</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader icon="⭐" title="Reviews" subtitle="Manage customer testimonials shown on your website" />
      <div style={{ marginBottom:"1.5rem" }}><Btn onClick={startAdd} variant="amber" small>+ Add New Review</Btn></div>
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
        {reviews.length === 0 && <p style={{ color:"#C9B49A", textAlign:"center", padding:"2rem" }}>No reviews yet. Add your first one!</p>}
        {reviews.map((r, i) => (
          <div key={r.slug} onClick={() => startEdit(r, i)} style={{ background:"white", border:"1.5px solid #EDE3D6", borderLeft:"3px solid #B07D4F", borderRadius:"4px", padding:"1.2rem", cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:".5rem" }}>
              <div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", color:"#2B1F14" }}>{r.name}</p>
                <p style={{ fontSize:".75rem", color:"#C9B49A" }}>{r.location}</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
                <span style={{ color:"#B07D4F" }}>{"★".repeat(r.rating)}</span>
                <span style={{ color:"#C9B49A", fontSize:"1.2rem" }}>›</span>
              </div>
            </div>
            <p style={{ fontSize:".85rem", color:"#4A3728", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>"{r.review}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  SETTINGS TAB
// ══════════════════════════════════════════════
function SettingsTab({ showToast }) {
  const [settings, setSettings] = useState({ hero_title_1:"", hero_title_2:"", hero_description:"", contact_email:"" });
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const data = await githubGet("content/settings.json");
      const content = JSON.parse(atob(data.content.replace(/\n/g,"")));
      setSettings(content); setSha(data.sha);
    } catch(e) { showToast("Could not load settings", "error"); }
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    try {
      await githubPut("content/settings.json", JSON.stringify(settings, null, 2), "Update site settings", sha);
      showToast("✅ Settings saved! Website will update in 1-2 minutes.", "success");
      loadSettings();
    } catch(e) { showToast(`❌ Error: ${e.message}`, "error"); }
    setSaving(false);
  }

  if (loading) return <div style={{ textAlign:"center", padding:"4rem", color:"#C9B49A" }}>Loading settings...</div>;

  return (
    <div>
      <SectionHeader icon="⚙️" title="Site Settings" subtitle="Update the hero text and contact details on your website" />
      <div style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginBottom:"1.5rem" }}>
        <p style={{ fontSize:".78rem", letterSpacing:".15em", textTransform:"uppercase", color:"#B07D4F", marginBottom:"1.2rem" }}>Hero Section</p>
        <Input label="Hero Title Line 1" value={settings.hero_title_1||""} onChange={v => setSettings({...settings, hero_title_1:v})} placeholder="Where resin" />
        <Input label="Hero Title Line 2" value={settings.hero_title_2||""} onChange={v => setSettings({...settings, hero_title_2:v})} placeholder="meets texture, art blooms" />
        <Input label="Hero Description" value={settings.hero_description||""} onChange={v => setSettings({...settings, hero_description:v})} placeholder="Describe your gallery..." multiline />
      </div>
      <div style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginBottom:"2rem" }}>
        <p style={{ fontSize:".78rem", letterSpacing:".15em", textTransform:"uppercase", color:"#B07D4F", marginBottom:"1.2rem" }}>Contact Details</p>
        <Input label="Contact Email" value={settings.contact_email||""} onChange={v => setSettings({...settings, contact_email:v})} placeholder="info@glazglowgallery.com" />
      </div>
      <Btn onClick={save} variant="amber" loading={saving}>💾 Save Settings</Btn>
    </div>
  );
}

// ══════════════════════════════════════════════
//  DESIGN TAB — EXPORT + AI WORKFLOW + UPLOAD
// ══════════════════════════════════════════════
function DesignTab({ showToast }) {
  const [htmlFile, setHtmlFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentSha, setCurrentSha] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    githubGet("index.html").then(d => setCurrentSha(d.sha)).catch(() => {});
  }, []);

  // ── Export current index.html ──
  async function exportCurrentDesign() {
    setExporting(true);
    try {
      const data = await githubGet("index.html");
      const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `glazglowgallery-design-${new Date().toISOString().slice(0,10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("✅ Current design downloaded successfully!", "success");
    } catch(e) {
      showToast(`❌ Export failed: ${e.message}`, "error");
    }
    setExporting(false);
  }

  // ── Copy AI prompt ──
  async function copyAiPrompt() {
    const prompt = `You are helping redesign a website for GlazGlow Gallery, an online store selling handmade resin art and textured art pieces.

I am attaching the current website HTML file. Please modify the design based on my requirements below, but keep the following JavaScript functions completely intact and unchanged:
- loadProducts() function
- loadReviews() function
- loadSettings() function
- All fetch() calls to content/products/, content/reviews/, and content/settings.json
- The products grid with id="productsGrid"
- The reviews grid with id="reviewsGrid"
- The hero description with id="heroDesc"
- The contact note with id="contactNote"

These functions are critical — removing or modifying them will break the website content.

My design requirements:
[DESCRIBE WHAT YOU WANT HERE — for example: "Make the colour scheme pink and gold, use a more playful font, add a banner at the top saying FREE SHIPPING ON ALL ORDERS, make the hero section full screen with a large background image"]

Please return the complete modified HTML file only, with no explanation.`;

    try {
      await navigator.clipboard.writeText(prompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
      showToast("✅ AI prompt copied to clipboard!", "success");
    } catch(e) {
      showToast("Could not auto-copy — please copy manually below", "error");
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".html")) { showToast("Please select an HTML file", "error"); return; }
    setHtmlFile(file);
    const reader = new FileReader();
    reader.onload = ev => setHtmlContent(ev.target.result);
    reader.readAsText(file);
    setPreviewing(false);
  }

  async function publish() {
    if (!htmlContent) return;
    setPublishing(true);
    try {
      await githubPut("index.html", htmlContent, `Deploy new website design: ${htmlFile.name}`, currentSha);
      showToast("🚀 New design published! Website will update in 1-2 minutes.", "success");
      setHtmlFile(null); setHtmlContent(null); setPreviewing(false);
      githubGet("index.html").then(d => setCurrentSha(d.sha)).catch(() => {});
    } catch(e) { showToast(`❌ Error: ${e.message}`, "error"); }
    setPublishing(false);
  }

  const stepStyle = { background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginBottom:"1rem" };
  const stepNumStyle = { width:"28px", height:"28px", background:"#2B1F14", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#F7F2EC", fontSize:".8rem", fontWeight:600, flexShrink:0 };

  return (
    <div>
      <SectionHeader icon="🖌️" title="Website Design" subtitle="Export → Modify with AI → Upload new design" />

      {/* STEP 1 — EXPORT */}
      <div style={stepStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:".8rem" }}>
          <div style={stepNumStyle}>1</div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#2B1F14" }}>Download Current Design</p>
        </div>
        <p style={{ fontSize:".85rem", color:"#C9B49A", marginBottom:"1.2rem", lineHeight:1.6 }}>
          Download your current website HTML file to give to an AI for modification.
        </p>
        <Btn onClick={exportCurrentDesign} variant="amber" loading={exporting}>
          ⬇️ Download Current Design
        </Btn>
      </div>

      {/* STEP 2 — AI PROMPT */}
      <div style={stepStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:".8rem" }}>
          <div style={stepNumStyle}>2</div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#2B1F14" }}>Give to AI with This Prompt</p>
        </div>
        <p style={{ fontSize:".85rem", color:"#C9B49A", marginBottom:"1rem", lineHeight:1.6 }}>
          Open Claude or any AI, upload the downloaded file, and use this prompt. Edit the design requirements section before sending.
        </p>
        <div style={{ background:"#F7F2EC", border:"1px solid #EDE3D6", borderRadius:"4px", padding:"1rem", marginBottom:"1rem", fontSize:".8rem", color:"#4A3728", lineHeight:1.8, fontFamily:"monospace", maxHeight:"200px", overflowY:"auto" }}>
          <p>You are helping redesign a website for GlazGlow Gallery.</p>
          <br/>
          <p>I am attaching the current HTML file. Please modify the design but keep the following JavaScript functions completely unchanged:</p>
          <p style={{ color:"#B07D4F" }}>• loadProducts() • loadReviews() • loadSettings()</p>
          <p style={{ color:"#B07D4F" }}>• All fetch() calls to content/ folder</p>
          <p style={{ color:"#B07D4F" }}>• Elements with id: productsGrid, reviewsGrid, heroDesc, contactNote</p>
          <br/>
          <p>My design requirements:</p>
          <p style={{ color:"#c0392b", fontWeight:"bold" }}>[DESCRIBE WHAT YOU WANT HERE]</p>
          <br/>
          <p>Return the complete modified HTML file only.</p>
        </div>
        <Btn onClick={copyAiPrompt} variant={copySuccess ? "green" : "outline"}>
          {copySuccess ? "✓ Copied!" : "📋 Copy Full AI Prompt"}
        </Btn>
      </div>

      {/* STEP 3 — UPLOAD */}
      <div style={stepStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:".8rem" }}>
          <div style={stepNumStyle}>3</div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#2B1F14" }}>Upload Modified Design</p>
        </div>
        <p style={{ fontSize:".85rem", color:"#C9B49A", marginBottom:"1.2rem", lineHeight:1.6 }}>
          Once the AI returns the modified HTML file, save it and upload it here.
        </p>
        <div style={{ background:"#FFF8F0", border:"2px dashed #C9B49A", borderRadius:"4px", padding:"2rem", textAlign:"center" }}>
          <input ref={fileRef} type="file" accept=".html" onChange={handleFileSelect} style={{ display:"none" }} />
          <Btn onClick={() => fileRef.current.click()} variant="amber">📂 Choose Modified HTML File</Btn>
          {htmlFile && (
            <p style={{ fontSize:".82rem", color:"#4a9e6b", marginTop:"1rem" }}>
              ✓ Selected: <strong>{htmlFile.name}</strong> ({(htmlFile.size/1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>

      {/* STEP 4 — PREVIEW */}
      {htmlContent && (
        <div style={{ ...stepStyle, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:".8rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".8rem" }}>
              <div style={stepNumStyle}>4</div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#2B1F14" }}>Preview Before Publishing</p>
            </div>
            <Btn onClick={() => setPreviewing(!previewing)} variant="outline" small>
              {previewing ? "Hide" : "👁 Preview"}
            </Btn>
          </div>
          {previewing && <iframe srcDoc={htmlContent} style={{ width:"100%", height:"500px", border:"none", borderRadius:"4px", marginTop:".5rem" }} title="Preview" />}
        </div>
      )}

      {/* WARNING */}
      {htmlContent && (
        <div style={{ background:"#fff3cd", border:"1px solid #ffc107", borderRadius:"4px", padding:"1rem 1.5rem", marginBottom:"1rem" }}>
          <p style={{ fontSize:".85rem", color:"#856404" }}>
            ⚠️ <strong>Warning:</strong> Publishing replaces your entire current website. Always preview first and check products still load correctly.
          </p>
        </div>
      )}

      {/* STEP 5 — PUBLISH */}
      {htmlContent && (
        <div style={stepStyle}>
          <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:"1rem" }}>
            <div style={stepNumStyle}>5</div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#2B1F14" }}>Publish to Website</p>
          </div>
          <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
            <Btn onClick={publish} variant="primary" loading={publishing}>🚀 Publish Now</Btn>
            <Btn onClick={() => { setHtmlFile(null); setHtmlContent(null); setPreviewing(false); }} variant="outline" disabled={publishing}>✕ Clear</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [toast, setToast] = useState(null);

  function showToast(message, type = "info") { setToast({ message, type }); }

  const tabs = [
    { id:"products", label:"Products", icon:"🎨" },
    { id:"reviews",  label:"Reviews",  icon:"⭐" },
    { id:"settings", label:"Settings", icon:"⚙️" },
    { id:"design",   label:"Design",   icon:"🖌️" },
  ];

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return (
    <div style={{ minHeight:"100vh", background:"#F7F2EC", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: #B07D4F !important; box-shadow: 0 0 0 3px rgba(176,125,79,.1); }
      `}</style>

      {/* Header */}
      <div style={{ background:"#2B1F14", padding:"1rem 1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:100 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300, color:"#F7F2EC" }}>
            Glaz<span style={{ color:"#E8A96B", fontStyle:"italic" }}>Glow</span> Admin
          </h1>
          <p style={{ fontSize:".65rem", letterSpacing:".15em", textTransform:"uppercase", color:"rgba(247,242,236,.4)", marginTop:"1px" }}>Gallery Management</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <a href="https://glazglowgallery.com" target="_blank" rel="noreferrer" style={{ fontSize:".72rem", color:"#E8A96B", textDecoration:"none", letterSpacing:".1em", textTransform:"uppercase" }}>View Site ↗</a>
          <button onClick={() => setLoggedIn(false)} style={{ background:"rgba(247,242,236,.1)", border:"1px solid rgba(247,242,236,.2)", color:"rgba(247,242,236,.6)", padding:".4rem .8rem", fontSize:".7rem", letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer", borderRadius:"2px" }}>Logout</button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background:"white", borderBottom:"1px solid #EDE3D6", display:"flex", overflowX:"auto", position:"sticky", top:"64px", zIndex:99 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex:1, minWidth:"80px", padding:".9rem .5rem", border:"none", background:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:".3rem", borderBottom: activeTab===tab.id ? "2px solid #B07D4F" : "2px solid transparent", color: activeTab===tab.id ? "#B07D4F" : "#C9B49A", transition:"all .2s" }}>
            <span style={{ fontSize:"1.2rem" }}>{tab.icon}</span>
            <span style={{ fontSize:".68rem", letterSpacing:".1em", textTransform:"uppercase", fontWeight: activeTab===tab.id ? 500 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"2rem 1.5rem 6rem" }}>
        {activeTab === "products" && <ProductsTab showToast={showToast} />}
        {activeTab === "reviews"  && <ReviewsTab  showToast={showToast} />}
        {activeTab === "settings" && <SettingsTab showToast={showToast} />}
        {activeTab === "design"   && <DesignTab   showToast={showToast} />}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
