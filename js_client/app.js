(function () {
  const cfg = window.APP_CONFIG;
  const state = { idToken: null, accessToken: null, user: null };
  let showAllPosts = false;

  // --- JWT helpers ---
  function decodeJwt(token) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  }

  function loadUserFromToken() {
    if (!state.idToken) return;
    try {
      const claims = decodeJwt(state.idToken);
      state.user = {
        id: claims.sub,
        email: claims.email,
        name:
          claims.name ||
          claims["cognito:username"] ||
          claims.email ||
          "Unknown user",
      };
    } catch (e) {
      console.error("Failed to decode id_token", e);
    }
  }

  // --- Auth helpers (Cognito Hosted UI implicit flow) ---
  function authUrl() {
    const p = new URLSearchParams({
      client_id: cfg.userPoolClientId,
      response_type: "token", // already working for you
      scope: "email openid",
      redirect_uri: cfg.redirectUri,
    });
    return `https://${cfg.cognitoDomain}/oauth2/authorize?${p.toString()}`;
  }

  function logoutUrl() {
    const p = new URLSearchParams({
      client_id: cfg.userPoolClientId,
      logout_uri: cfg.redirectUri,
    });
    return `https://${cfg.cognitoDomain}/logout?${p.toString()}`;
  }

  function parseHash() {
    if (window.location.hash && window.location.hash.startsWith("#")) {
      const hash = new URLSearchParams(window.location.hash.substring(1));
      const idt = hash.get("id_token");
      const at = hash.get("access_token");
      if (idt) {
        localStorage.setItem("id_token", idt);
        state.idToken = idt;
      }
      if (at) {
        localStorage.setItem("access_token", at);
        state.accessToken = at;
      }
      // clear hash for neat URLs
      history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function loadSession() {
    state.idToken = localStorage.getItem("id_token");
    state.accessToken = localStorage.getItem("access_token");
  }

  function isAuthed() {
    return !!state.idToken;
  }

  function authHeader() {
    return { Authorization: `Bearer ${state.idToken}` };
  }

  // --- UI helpers ---
  const el = (id) => document.getElementById(id);

  function setStatus(msg) {
    el("statusText").textContent = msg;
  }

  function updateAuthUI() {
    const loggedIn = isAuthed();
    const loginBtn = el("loginBtn");
    const logoutBtn = el("logoutBtn");

    if (loginBtn && logoutBtn) {
      loginBtn.style.display = loggedIn ? "none" : "inline-flex";
      logoutBtn.style.display = loggedIn ? "inline-flex" : "none";
    }

    if (loggedIn && state.user) {
      setStatus(`Signed in as ${state.user.name} (${state.user.email || "no email"})`);
    } else {
      setStatus("Not authenticated. Please log in.");
    }
  }

  function fmtDate(s) {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  }

  // --- API helper ---
  async function api(path, opts = {}) {
    const res = await fetch(cfg.apiBaseUrl + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
        ...(isAuthed() ? authHeader() : {}),
      },
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("API error:", res.status, t);
      throw new Error(`API ${res.status}: ${t}`);
    }
    const ct = res.headers.get("content-type") || "";
    return (ct.includes("application/json") && res.headers.get("content-length") != "0") 
      ? res.json() : res.text();
  }

  // --- Upload URL helper ---
  async function getUploadUrl(contentType) {
    return api("/get-presigned-url", {
      method: "POST",
      body: JSON.stringify({ contentType }),
    });
  }

  // --- CRUD operations ---
  async function listPosts(showAllPublished = false) {
    const author = el("fAuthor").value.trim();
    const tag = el("fTag").value.trim();

    const qs = new URLSearchParams();

    if (author) qs.set("author", author);
    if (tag) qs.set("tag", tag);
    qs.set("all_published", showAllPublished);

    const path = "/listall" + (qs.toString() ? "?" + qs.toString() : "");
    const data = await api(path);

    const tbody = el("postsBody");
    tbody.innerHTML = "";

    const posts = Array.isArray(data) ? data : (data.items || []);
    posts.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.title}</td>
        <td>${p.authorUsername}</td>
        <td>${p.status}</td>
        <td>${fmtDate(p.createdAt)}</td>`;
      if (!showAllPublished) {
        tr.innerHTML = tr.innerHTML.concat(`
          <td>
            <button class="btn btn-ghost" data-action="edit" data-id="${p.postId}">Edit</button>
            <button class="btn danger" data-action="delete" data-id="${p.postId}">Delete</button>
          </td>`);
      }
      tbody.appendChild(tr);
    });
  }

  async function loadPost(id) {
    const p = await api(`/readone?id=${encodeURIComponent(id)}`);

    el("postId").value = p.postId;
    el("title").value = p.title || "";
    el("slug").value = p.slug || "";
    el("tags").value = (p.tags || []).join(", ");
    el("statusSel").value = p.status || "draft";
    el("content").value = p.content || "";
    el("heroImageKey").value = p.heroImageKey || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function savePost(evt) {
    evt.preventDefault();
    const id = el("postId").value || null;

    const body = {
      postId: id || undefined, // include id for update if your backend expects it
      title: el("title").value.trim(),
      slug: el("slug").value.trim(),
      tags: el("tags").value.split(",").map((s) => s.trim()).filter(Boolean),
      status: el("statusSel").value,
      content: el("content").value,
      heroImageKey: el("heroImageKey").value || null,
    };

    if (!isAuthed()) throw new Error("Not authenticated");

    const method = id ? "PUT" : "POST";
    const path = id ? "/update" : "/create";

    const out = await api(path, { method, body: JSON.stringify(body) });

    setStatus("Saved ✅");
    el("postForm").reset();
    if (out.postId && !id) el("postId").value = out.postId;
    await listPosts();
  }

  async function deletePostById(id) {
    if (!confirm("Delete this post?")) return;

    // assuming your backend expects ?id=... on /delete
    await api(`/delete?id=${encodeURIComponent(id)}`, { method: "DELETE" });

    setStatus("Deleted 🗑️");
    if (el("postId").value === id) {
      el("postForm").reset();
    }
    await listPosts();
  }

  // --- Media upload via pre-signed URL ---
  async function maybeUploadHero() {
    const file = el("heroFile").files[0];
    if (!file) return null;

    const { url, fields, key, uploadUrl, headers } = await getUploadUrl(file.type);

    // Support either S3 POST (url+fields) or PUT (uploadUrl+headers)
    if (uploadUrl) {
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: headers || { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");
      el("heroImageKey").value =
        key || new URL(uploadUrl).pathname.replace(/^\//, "");
      return el("heroImageKey").value;
    } else {
      const form = new FormData();
      Object.entries(fields || {}).forEach(([k, v]) => form.append(k, v));
      form.append("file", file);
      const up = await fetch(url, { method: "POST", body: form });
      if (!up.ok) throw new Error("Upload failed");
      el("heroImageKey").value = key || fields.key;
      return el("heroImageKey").value;
    }
  }

  // --- Wire up events ---
  function bindEvents() {
    el("loginBtn").onclick = () => {
      window.location = authUrl();
    };
    el("logoutBtn").onclick = () => {
      localStorage.removeItem("id_token");
      localStorage.removeItem("access_token");
      state.idToken = null;
      state.accessToken = null;
      window.location = logoutUrl();
    };
    el("refreshBtn").addEventListener("click", () => {
      showAllPosts ? listPosts(true) : listPosts();
    });
    el("myPostsBtn").addEventListener("click", () => {
      showAllPosts = false;
      listPosts();
      updatePostTableButtons("myPosts");
    });
    el("allPostsBtn").addEventListener("click", () => {
      showAllPosts = true;
      listPosts(true)
      updatePostTableButtons("allPosts");
    });
    el("postForm").addEventListener("submit", async (e) => {
      try {
        await maybeUploadHero();
        await savePost(e);
      } catch (err) {
        alert(err.message);
      }
    });
    el("deleteBtn").addEventListener("click", async () => {
      const id = el("postId").value;
      if (id) await deletePostById(id);
    });
    el("resetBtn").addEventListener("click", () => setStatus("Form reset."));
    el("postsBody").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === "edit") loadPost(id);
      if (action === "delete") deletePostById(id);
    });
  }

  function updatePostTableButtons(toggle = "allPosts") {
    if (!(["myPosts", "allPosts"].includes(toggle))) {
      return;
    }
    const myPostsButton = el("myPostsBtn");
    const allPostsButton = el("allPostsBtn");
    if (toggle == "allPosts") {
      allPostsButton.classList.replace("btn-ghost", "primary");
      myPostsButton.classList.replace("primary", "btn-ghost");
    } else {
      myPostsButton.classList.replace("btn-ghost", "primary");
      allPostsButton.classList.replace("primary", "btn-ghost");
    }
  }

  // --- Bootstrap ---
  (async function init() {
    parseHash();        // reads tokens from URL hash and saves to localStorage
    loadSession();      // loads tokens from localStorage into state
    loadUserFromToken(); // decode id_token -> state.user
    bindEvents();

    if (isAuthed()) {
      updateAuthUI();
      await listPosts().catch((err) => {
        console.error(err);
        setStatus("Authenticated, but failed to load posts.");
      });
    } else {
      updateAuthUI();
    }
  })();
})();
