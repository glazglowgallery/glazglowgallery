import React, { useState, useEffect, useRef } from "react";

// ============================================================
// ⚙️  CONFIGURATION
// ============================================================
const CONFIG = {
  GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN,
  GITHUB_OWNER: "glazglowgallery",
  GITHUB_REPO:  "glazglowgallery",
  GITHUB_BRANCH: "main",
  ADMIN_PASSWORD: "glazglow2026",
};
// ============================================================

const GITHUB_API = "https://api.github.com";

async function githubGet(path) {
  const res = await fetch(`${GITHUB_API}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}?ref=${CONFIG.GITHUB_BRANCH}&t=${Date.now()}`, {
    headers: { Authorization: `token ${CONFIG.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
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
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || "PUT failed"); }
  return res.json();
}

async function githubDelete(path, message, sha) {
  const res = await fetch(`${GITHUB_API}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`, {
    method: "DELETE",
    headers: { Authorization: `token ${CONFIG.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha, branch: CONFIG.GITHUB_BRANCH }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || "DELETE failed"); }
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
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Upload failed"); }
  return res.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function decodeGithubContent(content) {
  return decodeURIComponent(escape(atob(content.replace(/\n/g, ""))));
}

// ── UI Components ──
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const bg = type === "success" ? "#4a9e6b" : type === "error" ? "#c0392b" : "#B07D4F";
  return <div style={{ position:"fixed", bottom:"2rem", left:"50%", transform:"translateX(-50%)", background:bg, color:"white", padding:"1rem 2rem", borderRadius:"4px", zIndex:9999, fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", boxShadow:"0 4px 20px rgba(0,0,0,.3)", maxWidth:"90vw", textAlign:"center" }}>{message}</div>;
}

function Spinner() { return <div style={{ width:"18px", height:"18px", border:"2px solid rgba(255,255,255,.3)", borderTop:"2px solid white", borderRadius:"50%", animation:"spin .8s linear infinite", display:"inline-block" }} />; }

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
  const s = { width:"100%", padding:".75rem 1rem", border:"1.5px solid #EDE3D6", borderRadius:"4px", fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", color:"#2B1F14", background:"#FDFAF6", outline:"none", resize: multiline?"vertical":"none", minHeight: multiline?"90px":"auto" };
  return (
    <div style={{ marginBottom:"1rem" }}>
      {label && <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".4rem" }}>{label}</label>}
      {multiline ? <textarea style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/> : <input style={s} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}
    </div>
  );
}

function Btn({ children, onClick, variant="primary", disabled, loading, small, fullWidth }) {
  const base = { border:"none", cursor:disabled?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:".1em", textTransform:"uppercase", borderRadius:"2px", display:"inline-flex", alignItems:"center", gap:".5rem", transition:"all .2s", opacity:disabled?.6:1, width:fullWidth?"100%":"auto" };
  const v = {
    primary:  { background:"#2B1F14", color:"#F7F2EC", padding:small?".45rem 1rem":".75rem 1.8rem", fontSize:small?".7rem":".8rem" },
    amber:    { background:"#B07D4F", color:"#F7F2EC", padding:small?".45rem 1rem":".75rem 1.8rem", fontSize:small?".7rem":".8rem" },
    danger:   { background:"#c0392b", color:"white",   padding:small?".45rem .9rem":".7rem 1.4rem", fontSize:small?".68rem":".78rem" },
    outline:  { background:"transparent", color:"#2B1F14", border:"1.5px solid #C9B49A", padding:small?".45rem 1rem":".75rem 1.8rem", fontSize:small?".7rem":".8rem" },
    green:    { background:"#4a9e6b", color:"white",   padding:small?".45rem 1rem":".75rem 1.8rem", fontSize:small?".7rem":".8rem" },
  };
  return <button style={{...base,...v[variant]}} onClick={onClick} disabled={disabled||loading}>{loading?<Spinner/>:children}</button>;
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(43,31,20,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:"1.5rem" }}>
      <div style={{ background:"#F7F2EC", borderRadius:"4px", padding:"2rem", maxWidth:"380px", width:"100%" }}>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#2B1F14", marginBottom:"1.5rem", lineHeight:1.5 }}>{message}</p>
        <div style={{ display:"flex", gap:"1rem" }}>
          <Btn onClick={onConfirm} variant="danger">Yes, Delete</Btn>
          <Btn onClick={onCancel} variant="outline">Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════
function Login({ onLogin }) {
  const [pw, setPw] = useState(""), [error, setError] = useState("");
  const submit = () => { if(pw===CONFIG.ADMIN_PASSWORD) onLogin(); else { setError("Incorrect password."); setPw(""); }};
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#2B1F14,#4A3728)", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ background:"#F7F2EC", borderRadius:"4px", padding:"3rem 2.5rem", width:"100%", maxWidth:"400px", boxShadow:"0 20px 60px rgba(0,0,0,.4)" }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.2rem", fontWeight:300, color:"#2B1F14" }}>Glaz<span style={{ color:"#B07D4F", fontStyle:"italic" }}>Glow</span></h1>
          <p style={{ fontSize:".8rem", letterSpacing:".2em", textTransform:"uppercase", color:"#C9B49A", marginTop:".3rem" }}>Gallery Admin</p>
        </div>
        <Input label="Password" type="password" value={pw} onChange={setPw} placeholder="Enter admin password"/>
        {error && <p style={{ color:"#c0392b", fontSize:".83rem", marginBottom:"1rem", textAlign:"center" }}>{error}</p>}
        <Btn onClick={submit} variant="amber" disabled={!pw} fullWidth>Sign In →</Btn>
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
  const [deleting, setDeleting] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ title:"", category:"Resin Art", price:"", original_price:"", badge:"", description:"", image:"" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  const DEFAULT_SLUGS = ["ocean-geode-pour","sunset-fluid-art","desert-horizon","galaxy-resin-panel","warm-earth-relief","teal-agate-slice","linen-clay-weave","rose-nebula-pour"];

  useEffect(() => { loadProducts(); }, []);

  async function getProductIndex() {
    try { const d = await githubGet("content/products/index.json"); return { slugs: JSON.parse(decodeGithubContent(d.content)).products, sha: d.sha }; }
    catch { return { slugs: [...DEFAULT_SLUGS], sha: null }; }
  }

  async function saveProductIndex(slugs, sha) {
    await githubPut("content/products/index.json", JSON.stringify({ products: slugs }, null, 2), "Update product index", sha);
  }

  async function loadProducts() {
    setLoading(true);
    const { slugs } = await getProductIndex();
    const loaded = [];
    for (const slug of slugs) {
      try {
        const data = await githubGet(`content/products/${slug}.json`);
        const content = JSON.parse(decodeGithubContent(data.content));
        loaded.push({ ...content, slug, sha: data.sha });
      } catch { loaded.push({ slug, title: slug, category:"Resin Art", price:"$0", description:"", image:"", sha: null }); }
    }
    setProducts(loaded);
    setLoading(false);
  }

  function startEdit(p, idx) { setEditingIdx(idx); setAddingNew(false); setForm({ title:p.title||"", category:p.category||"Resin Art", price:p.price||"", original_price:p.original_price||"", badge:p.badge||"", description:p.description||"", image:p.image||"" }); setImageFile(null); setImagePreview(p.image||null); }
  function startAdd() { setAddingNew(true); setEditingIdx(null); setForm({ title:"", category:"Resin Art", price:"", original_price:"", badge:"", description:"", image:"" }); setImageFile(null); setImagePreview(null); }
  function cancel() { setEditingIdx(null); setAddingNew(false); setImageFile(null); setImagePreview(null); }

  function handleImageSelect(e) { const f=e.target.files[0]; if(!f)return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); }

  async function saveProduct() {
    setSaving(true);
    try {
      let imagePath = form.image;
      const slug = addingNew ? form.title.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-") : products[editingIdx].slug;
      const sha = addingNew ? null : products[editingIdx].sha;

      if (imageFile) {
        const b64 = await fileToBase64(imageFile);
        const imgPath = `images/products/${slug}-${Date.now()}.${imageFile.name.split(".").pop()}`;
        await githubPutBinary(imgPath, b64, `Upload image for ${slug}`);
        imagePath = `/${imgPath}`;
      }

      const updated = { title:form.title, category:form.category, price:form.price, description:form.description, image:imagePath };
      if (form.original_price) updated.original_price = form.original_price;
      if (form.badge) updated.badge = form.badge;

      await githubPut(`content/products/${slug}.json`, JSON.stringify(updated, null, 2), `${addingNew?"Add":"Update"} product: ${form.title}`, sha);

      if (addingNew) {
        const { slugs, sha: idxSha } = await getProductIndex();
        if (!slugs.includes(slug)) slugs.push(slug);
        await saveProductIndex(slugs, idxSha);
      }

      showToast(`✅ Product ${addingNew?"added":"saved"}! Website updates in 1-2 mins.`, "success");
      cancel(); loadProducts();
    } catch(e) { showToast(`❌ Error: ${e.message}`, "error"); }
    setSaving(false);
  }

  async function deleteProduct(p) {
    setConfirm(null); setDeleting(true);
    try {
      if (p.sha) await githubDelete(`content/products/${p.slug}.json`, `Delete product: ${p.title}`, p.sha);
      const { slugs, sha: idxSha } = await getProductIndex();
      const updated = slugs.filter(s => s !== p.slug);
      await saveProductIndex(updated, idxSha);
      showToast("✅ Product deleted! Website updates in 1-2 mins.", "success");
      cancel(); loadProducts();
    } catch(e) { showToast(`❌ Error: ${e.message}`, "error"); }
    setDeleting(false);
  }

  if (loading) return <div style={{ textAlign:"center", padding:"4rem", color:"#C9B49A" }}>Loading products...</div>;

  const showForm = editingIdx !== null || addingNew;

  if (showForm) {
    const p = addingNew ? null : products[editingIdx];
    return (
      <div>
        {confirm && <ConfirmDialog message={`Delete "${p?.title}"? This cannot be undone.`} onConfirm={() => deleteProduct(p)} onCancel={() => setConfirm(null)} />}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:"1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
            <Btn onClick={cancel} variant="outline" small>← Back</Btn>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300 }}>{addingNew?"Add New Product":`Edit: ${p?.title}`}</h3>
          </div>
          {!addingNew && <Btn onClick={() => setConfirm(true)} variant="danger" small loading={deleting}>🗑 Delete Product</Btn>}
        </div>
        <Input label="Product Name" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="e.g. Ocean Geode Pour"/>
        <div style={{ marginBottom:"1rem" }}>
          <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".4rem" }}>Category</label>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{ width:"100%", padding:".75rem 1rem", border:"1.5px solid #EDE3D6", borderRadius:"4px", fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", background:"#FDFAF6" }}>
            <option>Resin Art</option><option>Textured Art</option>
          </select>
        </div>
        <Input label="Price (e.g. $185)" value={form.price} onChange={v=>setForm({...form,price:v})} placeholder="$185"/>
        <Input label="Original Price (optional — for sale items)" value={form.original_price} onChange={v=>setForm({...form,original_price:v})} placeholder="$220"/>
        <div style={{ marginBottom:"1rem" }}>
          <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".4rem" }}>Badge</label>
          <select value={form.badge} onChange={e=>setForm({...form,badge:e.target.value})} style={{ width:"100%", padding:".75rem 1rem", border:"1.5px solid #EDE3D6", borderRadius:"4px", fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", background:"#FDFAF6" }}>
            <option value="">No Badge</option><option value="New">New</option><option value="Limited">Limited</option>
          </select>
        </div>
        <Input label="Description" value={form.description} onChange={v=>setForm({...form,description:v})} placeholder="Describe this artwork..." multiline/>
        <div style={{ marginBottom:"1.5rem" }}>
          <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".8rem" }}>Product Photo</label>
          {imagePreview && <div style={{ marginBottom:"1rem", borderRadius:"4px", overflow:"hidden", maxHeight:"180px" }}><img src={imagePreview} alt="preview" style={{ width:"100%", height:"180px", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/></div>}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display:"none" }}/>
          <Btn onClick={() => fileRef.current.click()} variant="outline" small>📷 {imagePreview?"Change Photo":"Upload Photo"}</Btn>
          {imageFile && <span style={{ fontSize:".78rem", color:"#4a9e6b", marginLeft:"1rem" }}>✓ {imageFile.name}</span>}
        </div>
        <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
          <Btn onClick={saveProduct} variant="amber" loading={saving} disabled={!form.title||!form.price}>💾 {addingNew?"Add Product":"Save Changes"}</Btn>
          <Btn onClick={cancel} variant="outline" disabled={saving}>Cancel</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader icon="🎨" title="Products" subtitle="Tap a product to edit. Use the button below to add new ones."/>
      <div style={{ marginBottom:"1.5rem" }}><Btn onClick={startAdd} variant="amber" small>+ Add New Product</Btn></div>
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
        {products.length===0 && <p style={{ color:"#C9B49A", textAlign:"center", padding:"2rem" }}>No products yet. Add your first one!</p>}
        {products.map((p,i) => (
          <div key={p.slug} style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.2rem", display:"flex", alignItems:"center", gap:"1rem" }}>
            <div onClick={() => startEdit(p,i)} style={{ display:"flex", alignItems:"center", gap:"1rem", flex:1, cursor:"pointer" }}>
              <div style={{ width:"52px", height:"52px", borderRadius:"3px", background:"#EDE3D6", flexShrink:0, overflow:"hidden" }}>
                {p.image && <img src={p.image} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", color:"#2B1F14", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.title}</p>
                <p style={{ fontSize:".75rem", color:"#C9B49A", textTransform:"uppercase", letterSpacing:".1em" }}>{p.category}</p>
              </div>
              <p style={{ color:"#B07D4F", fontWeight:500, flexShrink:0 }}>{p.price}</p>
              <span style={{ color:"#C9B49A" }}>›</span>
            </div>
            <button onClick={() => { startEdit(p,i); setTimeout(()=>setConfirm(true),50); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#c0392b", fontSize:"1.1rem", padding:".3rem", flexShrink:0 }} title="Delete">🗑</button>
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
  const [deleting, setDeleting] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name:"", location:"", review:"", rating:5 });

  const DEFAULT_SLUGS = ["priya-m","james-t","anika-r"];

  useEffect(() => { loadReviews(); }, []);

  async function getReviewIndex() {
    try { const d = await githubGet("content/reviews/index.json"); return { slugs: JSON.parse(decodeGithubContent(d.content)).reviews, sha: d.sha }; }
    catch { return { slugs: [...DEFAULT_SLUGS], sha: null }; }
  }

  async function saveReviewIndex(slugs, sha) {
    await githubPut("content/reviews/index.json", JSON.stringify({ reviews: slugs }, null, 2), "Update review index", sha);
  }

  async function loadReviews() {
    setLoading(true);
    const { slugs } = await getReviewIndex();
    const loaded = [];
    for (const slug of slugs) {
      try {
        const data = await githubGet(`content/reviews/${slug}.json`);
        const content = JSON.parse(decodeGithubContent(data.content));
        loaded.push({ ...content, slug, sha: data.sha });
      } catch {}
    }
    setReviews(loaded);
    setLoading(false);
  }

  function startEdit(r, idx) { setEditingIdx(idx); setAddingNew(false); setForm({ name:r.name||"", location:r.location||"", review:r.review||"", rating:r.rating||5 }); }
  function startAdd() { setAddingNew(true); setEditingIdx(null); setForm({ name:"", location:"", review:"", rating:5 }); }
  function cancel() { setEditingIdx(null); setAddingNew(false); }

  async function saveReview() {
    setSaving(true);
    try {
      const slug = addingNew ? form.name.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-") : reviews[editingIdx].slug;
      const sha = addingNew ? null : reviews[editingIdx].sha;
      await githubPut(`content/reviews/${slug}.json`, JSON.stringify({ name:form.name, location:form.location, review:form.review, rating:Number(form.rating) }, null, 2), `${addingNew?"Add":"Update"} review: ${form.name}`, sha);
      if (addingNew) { const { slugs, sha: idxSha } = await getReviewIndex(); if(!slugs.includes(slug)) slugs.push(slug); await saveReviewIndex(slugs, idxSha); }
      showToast(`✅ Review ${addingNew?"added":"updated"}!`, "success");
      cancel(); loadReviews();
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    setSaving(false);
  }

  async function deleteReview(r) {
    setConfirm(null); setDeleting(true);
    try {
      if (r.sha) await githubDelete(`content/reviews/${r.slug}.json`, `Delete review: ${r.name}`, r.sha);
      const { slugs, sha: idxSha } = await getReviewIndex();
      await saveReviewIndex(slugs.filter(s=>s!==r.slug), idxSha);
      showToast("✅ Review deleted!", "success");
      cancel(); loadReviews();
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    setDeleting(false);
  }

  if (loading) return <div style={{ textAlign:"center", padding:"4rem", color:"#C9B49A" }}>Loading reviews...</div>;
  const showForm = editingIdx !== null || addingNew;
  const current = editingIdx !== null ? reviews[editingIdx] : null;

  if (showForm) return (
    <div>
      {confirm && <ConfirmDialog message={`Delete review by "${current?.name}"?`} onConfirm={() => deleteReview(current)} onCancel={() => setConfirm(null)}/>}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <Btn onClick={cancel} variant="outline" small>← Back</Btn>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300 }}>{addingNew?"Add Review":`Edit: ${current?.name}`}</h3>
        </div>
        {!addingNew && <Btn onClick={() => setConfirm(true)} variant="danger" small loading={deleting}>🗑 Delete</Btn>}
      </div>
      <Input label="Customer Name" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Sarah M."/>
      <Input label="Location" value={form.location} onChange={v=>setForm({...form,location:v})} placeholder="e.g. Melbourne, VIC"/>
      <Input label="Review Text" value={form.review} onChange={v=>setForm({...form,review:v})} placeholder="What did the customer say?" multiline/>
      <div style={{ marginBottom:"1.5rem" }}>
        <label style={{ display:"block", fontSize:".78rem", letterSpacing:".12em", textTransform:"uppercase", color:"#B07D4F", marginBottom:".4rem" }}>Rating</label>
        <div style={{ display:"flex", gap:".5rem" }}>
          {[1,2,3,4,5].map(n=><button key={n} onClick={()=>setForm({...form,rating:n})} style={{ fontSize:"1.6rem", background:"none", border:"none", cursor:"pointer", opacity:n<=form.rating?1:.25 }}>★</button>)}
        </div>
      </div>
      <div style={{ display:"flex", gap:"1rem" }}>
        <Btn onClick={saveReview} variant="amber" loading={saving} disabled={!form.name||!form.review}>💾 {addingNew?"Add Review":"Save Changes"}</Btn>
        <Btn onClick={cancel} variant="outline" disabled={saving}>Cancel</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader icon="⭐" title="Reviews" subtitle="Tap a review to edit or delete it"/>
      <div style={{ marginBottom:"1.5rem" }}><Btn onClick={startAdd} variant="amber" small>+ Add New Review</Btn></div>
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
        {reviews.length===0 && <p style={{ color:"#C9B49A", textAlign:"center", padding:"2rem" }}>No reviews yet.</p>}
        {reviews.map((r,i) => (
          <div key={r.slug} style={{ background:"white", border:"1.5px solid #EDE3D6", borderLeft:"3px solid #B07D4F", borderRadius:"4px", padding:"1.2rem", display:"flex", gap:"1rem", alignItems:"flex-start" }}>
            <div onClick={() => startEdit(r,i)} style={{ flex:1, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:".4rem" }}>
                <div><p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.05rem", color:"#2B1F14" }}>{r.name}</p><p style={{ fontSize:".75rem", color:"#C9B49A" }}>{r.location}</p></div>
                <span style={{ color:"#B07D4F" }}>{"★".repeat(r.rating)}</span>
              </div>
              <p style={{ fontSize:".85rem", color:"#4A3728", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>"{r.review}"</p>
            </div>
            <button onClick={() => { startEdit(r,i); setTimeout(()=>setConfirm(true),50); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#c0392b", fontSize:"1.1rem", padding:".3rem", flexShrink:0 }}>🗑</button>
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

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d=await githubGet("content/settings.json"); setSettings(JSON.parse(decodeGithubContent(d.content))); setSha(d.sha); } catch {}
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    try { await githubPut("content/settings.json", JSON.stringify(settings,null,2), "Update settings", sha); showToast("✅ Settings saved!", "success"); load(); }
    catch(e) { showToast(`❌ ${e.message}`, "error"); }
    setSaving(false);
  }

  if (loading) return <div style={{ textAlign:"center", padding:"4rem", color:"#C9B49A" }}>Loading...</div>;

  return (
    <div>
      <SectionHeader icon="⚙️" title="Site Settings" subtitle="Update hero text, contact details, and enquiry form"/>
      <div style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginBottom:"1.5rem" }}>
        <p style={{ fontSize:".78rem", letterSpacing:".15em", textTransform:"uppercase", color:"#B07D4F", marginBottom:"1.2rem" }}>Hero Section</p>
        <Input label="Hero Title Line 1" value={settings.hero_title_1||""} onChange={v=>setSettings({...settings,hero_title_1:v})} placeholder="Where resin"/>
        <Input label="Hero Title Line 2" value={settings.hero_title_2||""} onChange={v=>setSettings({...settings,hero_title_2:v})} placeholder="meets texture, art blooms"/>
        <Input label="Hero Description" value={settings.hero_description||""} onChange={v=>setSettings({...settings,hero_description:v})} multiline placeholder="Describe your gallery..."/>
      </div>
      <div style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginBottom:"2rem" }}>
        <p style={{ fontSize:".78rem", letterSpacing:".15em", textTransform:"uppercase", color:"#B07D4F", marginBottom:"1.2rem" }}>Contact</p>
        <Input label="Contact Email" value={settings.contact_email||""} onChange={v=>setSettings({...settings,contact_email:v})} placeholder="info@glazglowgallery.com"/>
      </div>
      <Btn onClick={save} variant="amber" loading={saving}>💾 Save Settings</Btn>
      <EnquirySettings showToast={showToast}/>
      <ProcessSettings showToast={showToast}/>
      <FooterSettings showToast={showToast}/>
    </div>
  );
}

// ── Enquiry Form Settings ──
function EnquirySettings({ showToast }) {
  const [data, setData] = useState({ section_title:"First to know, first to collect", section_subtitle:"", enquiry_email:"" });
  const [sha, setSha] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { githubGet("content/enquiry.json").then(d=>{ setData(JSON.parse(decodeGithubContent(d.content))); setSha(d.sha); }).catch(()=>{}); }, []);
  async function save() { setSaving(true); try { await githubPut("content/enquiry.json", JSON.stringify(data,null,2), "Update enquiry settings", sha); showToast("✅ Enquiry section saved!", "success"); } catch(e) { showToast(`❌ ${e.message}`, "error"); } setSaving(false); }
  return (
    <div style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginTop:"1.5rem", marginBottom:"1.5rem" }}>
      <p style={{ fontSize:".78rem", letterSpacing:".15em", textTransform:"uppercase", color:"#B07D4F", marginBottom:"1.2rem" }}>Stay Connected Section</p>
      <Input label="Section Title" value={data.section_title||""} onChange={v=>setData({...data,section_title:v})} placeholder="First to know, first to collect"/>
      <Input label="Section Subtitle" value={data.section_subtitle||""} onChange={v=>setData({...data,section_subtitle:v})} multiline placeholder="Describe what subscribers get..."/>
      <Input label="Enquiry Email" value={data.enquiry_email||""} onChange={v=>setData({...data,enquiry_email:v})} placeholder="info@glazglowgallery.com"/>
      <Btn onClick={save} variant="primary" loading={saving} small>💾 Save Enquiry Settings</Btn>
    </div>
  );
}

// ── Process Steps Settings ──
function ProcessSettings({ showToast }) {
  const [steps, setSteps] = useState([]);
  const [sha, setSha] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { githubGet("content/process.json").then(d=>{ setSteps(JSON.parse(decodeGithubContent(d.content)).steps); setSha(d.sha); }).catch(()=>{}); }, []);
  function updateStep(i, field, val) { const s=[...steps]; s[i]={...s[i],[field]:val}; setSteps(s); }
  function addStep() { setSteps([...steps, { number:`0${steps.length+1}`, icon:"✨", title:"New Step", description:"Describe this step..." }]); setExpanded(steps.length); }
  function removeStep(i) { setSteps(steps.filter((_,idx)=>idx!==i)); if(expanded===i)setExpanded(null); }
  async function save() { setSaving(true); try { await githubPut("content/process.json", JSON.stringify({steps},null,2), "Update process steps", sha); showToast("✅ Process steps saved!", "success"); } catch(e) { showToast(`❌ ${e.message}`, "error"); } setSaving(false); }
  return (
    <div style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginBottom:"1.5rem" }}>
      <p style={{ fontSize:".78rem", letterSpacing:".15em", textTransform:"uppercase", color:"#B07D4F", marginBottom:"1.2rem" }}>Process Steps (How It's Made)</p>
      {steps.map((s,i)=>(
        <div key={i} style={{ border:"1px solid #EDE3D6", borderRadius:"4px", marginBottom:".8rem", overflow:"hidden" }}>
          <div onClick={()=>setExpanded(expanded===i?null:i)} style={{ padding:".9rem 1rem", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", background:"#FDFAF6" }}>
            <span style={{ fontSize:".9rem", color:"#2B1F14" }}>{s.icon} {s.title}</span>
            <div style={{ display:"flex", gap:".5rem" }}>
              <button onClick={e=>{e.stopPropagation();removeStep(i);}} style={{ background:"none", border:"none", color:"#c0392b", cursor:"pointer", fontSize:".9rem" }}>🗑</button>
              <span style={{ color:"#C9B49A" }}>{expanded===i?"▲":"▼"}</span>
            </div>
          </div>
          {expanded===i && (
            <div style={{ padding:"1rem" }}>
              <Input label="Step Number" value={s.number} onChange={v=>updateStep(i,"number",v)} placeholder="01"/>
              <Input label="Icon (emoji)" value={s.icon} onChange={v=>updateStep(i,"icon",v)} placeholder="🎨"/>
              <Input label="Title" value={s.title} onChange={v=>updateStep(i,"title",v)} placeholder="Step title"/>
              <Input label="Description" value={s.description} onChange={v=>updateStep(i,"description",v)} multiline placeholder="Describe this step..."/>
            </div>
          )}
        </div>
      ))}
      <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", marginTop:"1rem" }}>
        <Btn onClick={addStep} variant="outline" small>+ Add Step</Btn>
        <Btn onClick={save} variant="primary" loading={saving} small>💾 Save Steps</Btn>
      </div>
    </div>
  );
}

// ── Footer Settings ──
function FooterSettings({ showToast }) {
  const [footer, setFooter] = useState({ social_links:{ facebook:"", linkedin:"", pinterest:"", youtube:"" }, columns:{ shop:[], information:[], contact:[] } });
  const [sha, setSha] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeCol, setActiveCol] = useState("social");
  useEffect(() => { githubGet("content/footer.json").then(d=>{ setFooter(JSON.parse(decodeGithubContent(d.content))); setSha(d.sha); }).catch(()=>{}); }, []);
  async function save() { setSaving(true); try { await githubPut("content/footer.json", JSON.stringify(footer,null,2), "Update footer", sha); showToast("✅ Footer saved!", "success"); } catch(e) { showToast(`❌ ${e.message}`, "error"); } setSaving(false); }
  function updateSocial(key, val) { setFooter({...footer, social_links:{...footer.social_links,[key]:val}}); }
  function updateColItem(col, i, field, val) { const c={...footer.columns}; c[col]=[...c[col]]; c[col][i]={...c[col][i],[field]:val}; setFooter({...footer,columns:c}); }
  function addColItem(col) { const c={...footer.columns}; c[col]=[...c[col],{label:"New Link",url:"#"}]; setFooter({...footer,columns:c}); }
  function removeColItem(col, i) { const c={...footer.columns}; c[col]=c[col].filter((_,idx)=>idx!==i); setFooter({...footer,columns:c}); }
  const tabs = [["social","Social"],["shop","Shop"],["information","Info"],["contact","Contact"]];
  return (
    <div style={{ background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginBottom:"1.5rem" }}>
      <p style={{ fontSize:".78rem", letterSpacing:".15em", textTransform:"uppercase", color:"#B07D4F", marginBottom:"1.2rem" }}>Footer Management</p>
      <div style={{ display:"flex", gap:".4rem", marginBottom:"1.2rem", flexWrap:"wrap" }}>
        {tabs.map(([key,label])=>(
          <button key={key} onClick={()=>setActiveCol(key)} style={{ padding:".4rem .9rem", border:"1.5px solid", borderColor:activeCol===key?"#2B1F14":"#C9B49A", background:activeCol===key?"#2B1F14":"transparent", color:activeCol===key?"#F7F2EC":"#4A3728", borderRadius:"2px", cursor:"pointer", fontSize:".72rem", letterSpacing:".1em", textTransform:"uppercase" }}>{label}</button>
        ))}
      </div>
      {activeCol==="social" && (
        <div>
          {[["facebook","Facebook URL"],["linkedin","LinkedIn URL"],["pinterest","Pinterest URL"],["youtube","YouTube URL"]].map(([key,label])=>(
            <Input key={key} label={label} value={footer.social_links?.[key]||""} onChange={v=>updateSocial(key,v)} placeholder={`https://${key}.com/glazglowgallery`}/>
          ))}
        </div>
      )}
      {["shop","information","contact"].includes(activeCol) && (
        <div>
          {(footer.columns?.[activeCol]||[]).map((item,i)=>(
            <div key={i} style={{ display:"flex", gap:".5rem", alignItems:"flex-start", marginBottom:".7rem" }}>
              <div style={{ flex:1 }}>
                <Input label="Label" value={item.label} onChange={v=>updateColItem(activeCol,i,"label",v)} placeholder="Link label"/>
                <Input label="URL" value={item.url} onChange={v=>updateColItem(activeCol,i,"url",v)} placeholder="https:// or #section"/>
              </div>
              <button onClick={()=>removeColItem(activeCol,i)} style={{ background:"none", border:"none", color:"#c0392b", cursor:"pointer", fontSize:"1.1rem", marginTop:"1.8rem", flexShrink:0 }}>🗑</button>
            </div>
          ))}
          <Btn onClick={()=>addColItem(activeCol)} variant="outline" small>+ Add Link</Btn>
        </div>
      )}
      <div style={{ marginTop:"1.2rem" }}>
        <Btn onClick={save} variant="primary" loading={saving} small>💾 Save Footer</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  DESIGN TAB
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

  useEffect(() => { githubGet("index.html").then(d=>setCurrentSha(d.sha)).catch(()=>{}); }, []);

  async function exportDesign() {
    setExporting(true);
    try {
      const data = await githubGet("index.html");
      const content = decodeGithubContent(data.content);
      const blob = new Blob([content], { type:"text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href=url; a.download=`glazglowgallery-${new Date().toISOString().slice(0,10)}.html`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast("✅ Design downloaded!", "success");
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    setExporting(false);
  }

  async function copyPrompt() {
    const prompt = `You are helping redesign a website for GlazGlow Gallery, an online store selling handmade resin art and textured art pieces based in Australia.

I am attaching the current website HTML file. Please modify ONLY the visual design (colours, fonts, layout, spacing, animations, background images, section styles) based on my requirements below.

CRITICAL — You must keep ALL of the following completely unchanged:
1. Every JavaScript function: loadProducts(), loadReviews(), loadSettings(), loadProcess(), loadEnquiry(), loadFooter(), createProductCard(), createReviewCard(), filterTab(), addToCart(), submitEnquiry(), animateCursor()
2. All fetch() calls to: content/products/, content/reviews/, content/settings.json, content/process.json, content/enquiry.json, content/footer.json, content/products/index.json, content/reviews/index.json
3. All HTML element IDs: productsGrid, reviewsGrid, heroDesc, heroTitle, processGrid, enquirySection, enquiryLeft, enquiryTitle, enquirySubtitle, enquiryEyebrow, footerSocials, footerShop, footerInfo, footerContact, contactNote
4. All social icon IDs: socialFacebook, socialLinkedin, socialPinterest, socialYoutube
5. The nav structure with links to #categories, #shop, #process, #testimonials, #enquiry
6. The marquee section
7. The filter tabs with data-cat attributes
8. The cart functionality

These elements load all website content dynamically. Removing or changing them will break the website.

My design requirements:
[DESCRIBE WHAT YOU WANT HERE — for example: "Change the colour scheme to dusty rose and gold. Use a more feminine and playful font. Make the hero section full height with a soft gradient background. Add rounded corners to product cards. Make the footer lighter."]

Please return the complete modified HTML file only, with no explanation or markdown.`;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopySuccess(true); setTimeout(()=>setCopySuccess(false),3000);
      showToast("✅ AI prompt copied!", "success");
    } catch { showToast("Could not copy automatically — please copy manually", "error"); }
  }

  function handleFile(e) {
    const f=e.target.files[0];
    if(!f)return;
    if(!f.name.endsWith(".html")){showToast("Please select an HTML file","error");return;}
    setHtmlFile(f);
    const r=new FileReader(); r.onload=ev=>setHtmlContent(ev.target.result); r.readAsText(f);
    setPreviewing(false);
  }

  async function publish() {
    setPublishing(true);
    try {
      await githubPut("index.html", htmlContent, `New design: ${htmlFile.name}`, currentSha);
      showToast("🚀 Published! Website updates in 1-2 mins.", "success");
      setHtmlFile(null); setHtmlContent(null); setPreviewing(false);
      githubGet("index.html").then(d=>setCurrentSha(d.sha)).catch(()=>{});
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    setPublishing(false);
  }

  const cardStyle = { background:"white", border:"1.5px solid #EDE3D6", borderRadius:"4px", padding:"1.5rem", marginBottom:"1rem" };
  const numStyle = { width:"26px", height:"26px", background:"#2B1F14", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#F7F2EC", fontSize:".75rem", fontWeight:600, flexShrink:0 };

  return (
    <div>
      <SectionHeader icon="🖌️" title="Website Design" subtitle="Export → Modify with AI → Upload → Publish"/>

      <div style={cardStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:".8rem" }}><div style={numStyle}>1</div><p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem", color:"#2B1F14" }}>Download Current Design</p></div>
        <p style={{ fontSize:".84rem", color:"#C9B49A", marginBottom:"1rem", lineHeight:1.6 }}>Download the current website HTML file to give to an AI for modification.</p>
        <Btn onClick={exportDesign} variant="amber" loading={exporting}>⬇️ Download Current Design</Btn>
      </div>

      <div style={cardStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:".8rem" }}><div style={numStyle}>2</div><p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem", color:"#2B1F14" }}>Use This AI Prompt</p></div>
        <p style={{ fontSize:".84rem", color:"#C9B49A", marginBottom:"1rem", lineHeight:1.6 }}>Open Claude or any AI, upload the file, and send this prompt. Edit the design requirements section.</p>
        <div style={{ background:"#F7F2EC", border:"1px solid #EDE3D6", borderRadius:"4px", padding:"1rem", marginBottom:"1rem", fontSize:".77rem", color:"#4A3728", lineHeight:1.8, maxHeight:"180px", overflowY:"auto" }}>
          <p>Redesign the website for GlazGlow Gallery. Modify only the visual design. Keep all JavaScript functions (loadProducts, loadReviews, loadSettings, loadProcess, loadEnquiry, loadFooter) and all element IDs (productsGrid, reviewsGrid, processGrid, enquirySection, footerSocials, footerShop, footerInfo, footerContact) completely unchanged. Return the complete HTML file only.</p>
          <p style={{ color:"#B07D4F", marginTop:".5rem" }}>My requirements: <span style={{ color:"#c0392b", fontWeight:"bold" }}>[DESCRIBE WHAT YOU WANT]</span></p>
        </div>
        <Btn onClick={copyPrompt} variant={copySuccess?"green":"outline"}>
          {copySuccess?"✓ Copied!":"📋 Copy Full AI Prompt"}
        </Btn>
      </div>

      <div style={cardStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:".8rem" }}><div style={numStyle}>3</div><p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem", color:"#2B1F14" }}>Upload Modified Design</p></div>
        <div style={{ background:"#FFF8F0", border:"2px dashed #C9B49A", borderRadius:"4px", padding:"1.8rem", textAlign:"center" }}>
          <input ref={fileRef} type="file" accept=".html" onChange={handleFile} style={{ display:"none" }}/>
          <Btn onClick={()=>fileRef.current.click()} variant="amber">📂 Choose HTML File</Btn>
          {htmlFile && <p style={{ fontSize:".82rem", color:"#4a9e6b", marginTop:".8rem" }}>✓ {htmlFile.name} ({(htmlFile.size/1024).toFixed(1)} KB)</p>}
        </div>
      </div>

      {htmlContent && (
        <div style={{ ...cardStyle, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:".5rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".8rem" }}><div style={numStyle}>4</div><p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem", color:"#2B1F14" }}>Preview</p></div>
            <Btn onClick={()=>setPreviewing(!previewing)} variant="outline" small>{previewing?"Hide":"👁 Show Preview"}</Btn>
          </div>
          {previewing && <iframe srcDoc={htmlContent} style={{ width:"100%", height:"480px", border:"none", borderRadius:"4px", marginTop:".8rem" }} title="Preview"/>}
        </div>
      )}

      {htmlContent && <>
        <div style={{ background:"#fff3cd", border:"1px solid #ffc107", borderRadius:"4px", padding:"1rem 1.5rem", marginBottom:"1rem" }}>
          <p style={{ fontSize:".84rem", color:"#856404" }}>⚠️ Publishing replaces your entire website design. Always preview first.</p>
        </div>
        <div style={cardStyle}>
          <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:"1rem" }}><div style={numStyle}>5</div><p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem", color:"#2B1F14" }}>Publish to Website</p></div>
          <div style={{ display:"flex", gap:"1rem" }}>
            <Btn onClick={publish} variant="primary" loading={publishing}>🚀 Publish Now</Btn>
            <Btn onClick={()=>{setHtmlFile(null);setHtmlContent(null);setPreviewing(false);}} variant="outline" disabled={publishing}>✕ Clear</Btn>
          </div>
        </div>
      </>}
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

  const showToast = (message, type="info") => setToast({ message, type });

  const tabs = [
    { id:"products", label:"Products", icon:"🎨" },
    { id:"reviews",  label:"Reviews",  icon:"⭐" },
    { id:"settings", label:"Settings", icon:"⚙️" },
    { id:"design",   label:"Design",   icon:"🖌️" },
  ];

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)}/>;

  return (
    <div style={{ minHeight:"100vh", background:"#F7F2EC", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus,textarea:focus,select:focus { border-color:#B07D4F!important; box-shadow:0 0 0 3px rgba(176,125,79,.1); }
        button:active { opacity:.85; }
      `}</style>

      <div style={{ background:"#2B1F14", padding:"1rem 1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:100 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:300, color:"#F7F2EC" }}>Glaz<span style={{ color:"#E8A96B", fontStyle:"italic" }}>Glow</span> Admin</h1>
          <p style={{ fontSize:".62rem", letterSpacing:".15em", textTransform:"uppercase", color:"rgba(247,242,236,.4)" }}>Gallery Management</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <a href="https://glazglowgallery.com" target="_blank" rel="noreferrer" style={{ fontSize:".72rem", color:"#E8A96B", textDecoration:"none", letterSpacing:".1em", textTransform:"uppercase" }}>View Site ↗</a>
          <button onClick={()=>setLoggedIn(false)} style={{ background:"rgba(247,242,236,.1)", border:"1px solid rgba(247,242,236,.2)", color:"rgba(247,242,236,.6)", padding:".4rem .8rem", fontSize:".7rem", letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer", borderRadius:"2px" }}>Logout</button>
        </div>
      </div>

      <div style={{ background:"white", borderBottom:"1px solid #EDE3D6", display:"flex", position:"sticky", top:"60px", zIndex:99 }}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ flex:1, padding:".85rem .5rem", border:"none", background:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:".25rem", borderBottom:activeTab===tab.id?"2px solid #B07D4F":"2px solid transparent", color:activeTab===tab.id?"#B07D4F":"#C9B49A" }}>
            <span style={{ fontSize:"1.2rem" }}>{tab.icon}</span>
            <span style={{ fontSize:".65rem", letterSpacing:".1em", textTransform:"uppercase", fontWeight:activeTab===tab.id?500:400 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"2rem 1.5rem 6rem" }}>
        {activeTab==="products" && <ProductsTab showToast={showToast}/>}
        {activeTab==="reviews"  && <ReviewsTab  showToast={showToast}/>}
        {activeTab==="settings" && <SettingsTab showToast={showToast}/>}
        {activeTab==="design"   && <DesignTab   showToast={showToast}/>}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
