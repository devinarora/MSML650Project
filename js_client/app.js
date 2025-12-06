(function () {
  const cfg = window.APP_CONFIG;
  const state = { idToken: null, user: null };
  let showAllPosts = false; 
  // Used to prevent infinite loops when handling browser history
  let isNavigating = false;

  // --- View Switcher Helpers ---
  function showDashboard(updateHistory = true) {
    document.getElementById("dashboard-view").classList.remove("hidden");
    document.getElementById("editor-view").classList.add("hidden");
    document.getElementById("status").classList.add("hidden"); 
    
    if (updateHistory) {
        history.pushState({ view: 'dashboard' }, "", window.location.pathname);
    }
    
    listPosts(showAllPosts);
  }

  function showEditor(isNew = true, updateHistory = true) {
    document.getElementById("dashboard-view").classList.add("hidden");
    document.getElementById("editor-view").classList.remove("hidden");
    document.getElementById("status").classList.add("hidden"); 
    
    const titleEl = document.getElementById("editorTitle");
    titleEl.textContent = isNew ? "Create New Post" : "Edit Post";
    titleEl.style.color = ""; 
    
    if (isNew) {
        document.getElementById("postStatus").value = "draft";
        setReadOnly(false);
        
        if (updateHistory) {
            history.pushState({ view: 'create' }, "", "#create");
        }
    }

    if (state.user) {
        document.getElementById("authorName").value = state.user.email || state.user.name;
    }
  }

  // --- UI State Helper (Read Only Mode) ---
  function setReadOnly(isReadOnly) {
    // REMOVED "slug" from this list
    const idsToToggle = ["title", "content", "tags", "heroFile", "postStatus"];
    
    idsToToggle.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = isReadOnly;
    });

    const saveBtn = document.getElementById("saveBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const msgDiv = document.getElementById("viewModeMsg");
    const removeHeroBtn = document.getElementById("removeHeroBtn");
    const heroLabel = document.querySelector('label[for="heroFile"]');

    if (isReadOnly) {
        if(saveBtn) saveBtn.style.display = "none";
        if(deleteBtn) deleteBtn.style.display = "none";
        if(msgDiv) msgDiv.style.display = "block"; 
        
        if(removeHeroBtn) removeHeroBtn.style.display = "none";
        if(heroLabel) heroLabel.style.display = "none";
        
        const title = document.getElementById("editorTitle");
        title.textContent = "View Post";
        title.style.color = "#6b7280"; 

    } else {
        if(saveBtn) saveBtn.style.display = "block";
        if(deleteBtn) deleteBtn.style.display = "block";
        if(msgDiv) msgDiv.style.display = "none"; 

        if(removeHeroBtn) removeHeroBtn.style.display = "inline-flex";
        if(heroLabel) heroLabel.style.display = "inline-flex";
        
        document.getElementById("editorTitle").style.color = "";
    }
  }

  // --- JWT & Auth Logic ---
  function decodeJwt(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const json = decodeURIComponent(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  function loadUserFromToken() {
    if (!state.idToken) return;
    const claims = decodeJwt(state.idToken);
    if (claims) {
      const displayName = claims.email || claims.name || claims["cognito:username"] || "Unknown";
      
      state.user = {
        id: claims.sub,
        email: claims.email,
        name: displayName
      };
    }
  }

  function authUrl() {
    const p = new URLSearchParams({ client_id: cfg.userPoolClientId, response_type: "token", scope: "email openid", redirect_uri: cfg.redirectUri });
    return `https://${cfg.cognitoDomain}/oauth2/authorize?${p.toString()}`;
  }

  function logoutUrl() {
    const p = new URLSearchParams({ client_id: cfg.userPoolClientId, logout_uri: cfg.redirectUri });
    return `https://${cfg.cognitoDomain}/logout?${p.toString()}`;
  }

  // --- API Helper ---
  async function api(path, opts = {}) {
    if (!state.idToken) throw new Error("Not authenticated");
    
    const res = await fetch(cfg.apiBaseUrl + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.idToken}`,
        ...(opts.headers || {})
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert("Your session has expired. Redirecting to login...");
        localStorage.removeItem("id_token");
        window.location = authUrl();
        return new Promise(() => {}); 
      }

      const t = await res.text();
      let errMsg = t;
      try {
        const jsonErr = JSON.parse(t);
        if (jsonErr.message) errMsg = jsonErr.message;
      } catch (e) { /* ignore */ }
      
      throw new Error(errMsg);
    }

    const ct = res.headers.get("content-type") || "";
    return (ct.includes("json") && res.headers.get("content-length") !== "0") ? res.json() : res.text();
  }

  // --- CRUD Operations ---
  async function listPosts(isAllPosts) {
    const qs = new URLSearchParams();
    if (!isAllPosts && state.user) {
        qs.set("authorId", state.user.id);
    }
    
    try {
      const data = await api("/listall" + (qs.toString() ? "?" + qs.toString() : ""));
      const posts = Array.isArray(data) ? data : (data.items || []);
      const tbody = document.getElementById("postsBody");
      tbody.innerHTML = "";
      
      posts.forEach(p => {
        const isMine = state.user && (
            (p.authorId && p.authorId === state.user.id) || 
            p.authorUsername === state.user.name
        );
        
        const tr = document.createElement("tr");
        
        let dateDisplay = "—";
        if (p.status === 'draft') {
            dateDisplay = '<span style="color:#d97706; font-weight:700; font-size:0.8rem; letter-spacing:0.05em; background:#fef3c7; padding:2px 6px; border-radius:4px;">DRAFT</span>';
        } else {
            const dateRaw = p.createdAt || p.createdDate;
            dateDisplay = dateRaw ? new Date(dateRaw).toLocaleDateString() : "—";
        }
        
        let buttonsHtml = "";
        if (isMine) {
            buttonsHtml += `<button class="btn btn-small primary edit-action-btn" data-id="${p.postId}" style="margin-right:6px;">Edit</button>`;
            buttonsHtml += `<button class="btn btn-small btn-danger-outline delete-action-btn" data-id="${p.postId}">Delete</button>`;
        } 

        tr.innerHTML = `
          <td><button class="post-title-btn" data-id="${p.postId}">${p.title || "(No Title)"}</button></td>
          <td>${p.authorUsername || "Unknown"}</td>
          <td>${dateDisplay}</td>
          <td>${buttonsHtml}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) { console.error(e); }
  }

  async function loadPost(id, forceViewMode = false, updateHistory = true) {
    try {
      const p = await api(`/readone?id=${encodeURIComponent(id)}`);
      
      const isMine = state.user && (
          (p.authorId && p.authorId === state.user.id) || 
          p.authorUsername === state.user.name
      );
      
      const isReadOnly = forceViewMode || !isMine;

      setReadOnly(isReadOnly);

      document.getElementById("postId").value = p.postId;
      document.getElementById("title").value = p.title || "";
      // REMOVED SLUG LOADING
      document.getElementById("content").value = p.content || "";
      document.getElementById("tags").value = (p.tags || []).join(", ");
      document.getElementById("heroImageKey").value = p.heroImageKey || "";
      
      if (isMine && state.user.email) {
          document.getElementById("authorName").value = state.user.email;
      } else {
          document.getElementById("authorName").value = p.authorUsername || "Unknown";
      }
      
      document.getElementById("postStatus").value = p.status || "draft";
      
      const heroPrev = document.getElementById("heroPreview");
      if (p.heroImageKey) {
        heroPrev.innerHTML = `<img src="${cfg.mediaBucketPublicBaseUrl || ''}${p.heroImageKey}" />`;
      } else {
        heroPrev.innerHTML = `<div class="placeholder-img">No Image</div>`;
      }
      
      if (updateHistory) {
        const hash = isReadOnly ? `#post?id=${id}` : `#edit?id=${id}`;
        history.pushState({ view: 'post', id: id }, "", hash);
      }
      
      showEditor(false, false); 
      
      if(isReadOnly) {
          const t = document.getElementById("editorTitle");
          t.textContent = "View Post";
          t.style.color = "#6b7280";
      }

    } catch (e) { alert("Error loading post: " + e.message); }
  }

  async function savePost(e) {
    e.preventDefault();
    
    // --- AUTO GENERATE SLUG ---
    // Since we removed the input, we create it from the title
    const titleVal = document.getElementById("title").value;
    const generatedSlug = titleVal
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
        .replace(/\s+/g, '-');        // replace spaces with hyphens

    const id = document.getElementById("postId").value;
    const body = {
      postId: id || undefined,
      title: titleVal,
      slug: generatedSlug, // Auto-generated here
      content: document.getElementById("content").value,
      status: document.getElementById("postStatus").value,
      tags: document.getElementById("tags").value.split(",").map(s=>s.trim()).filter(Boolean),
      heroImageKey: document.getElementById("heroImageKey").value
    };

    const endpoint = id ? "/update" : "/create";
    const method = id ? "PUT" : "POST";

    try {
      await api(endpoint, { method, body: JSON.stringify(body) });
      document.getElementById("statusText").innerText = "Submitted Successfully!";
      document.getElementById("status").classList.remove("hidden");
    } catch (err) { alert("Submit failed: " + err.message); }
  }

  async function deletePost(id) {
    if(!confirm("Are you sure?")) return;
    try {
      await api(`/delete?id=${id}`, { method: "DELETE" });
      showDashboard(true); 
    } catch (err) { alert("Delete failed"); }
  }

  function handleRouting() {
    const hash = window.location.hash;
    
    if (hash === "#create") {
        document.getElementById("postForm").reset();
        document.getElementById("postId").value = "";
        document.getElementById("heroPreview").innerHTML = `<div class="placeholder-img">No Image Selected</div>`;
        showEditor(true, false); 
    } 
    else if (hash.startsWith("#post?id=") || hash.startsWith("#edit?id=")) {
        const id = hash.split("=")[1];
        const isEdit = hash.startsWith("#edit");
        if (id) {
            loadPost(id, !isEdit, false); 
        }
    } 
    else if (!hash || hash === "") {
        showDashboard(false); 
    }
  }

  function init() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("id_token")) {
      localStorage.setItem("id_token", hashParams.get("id_token"));
      history.replaceState({}, "", window.location.pathname);
    }
    
    state.idToken = localStorage.getItem("id_token");
    loadUserFromToken();

    if (state.idToken) {
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("logoutBtn").style.display = "inline-flex";
        
        handleRouting();
    } else {
        document.getElementById("logoutBtn").style.display = "none";
    }

    window.addEventListener("popstate", handleRouting);

    document.getElementById("loginBtn").onclick = () => window.location = authUrl();
    document.getElementById("logoutBtn").onclick = () => { localStorage.clear(); window.location = logoutUrl(); };
    
    document.getElementById("myPostsBtn").onclick = (e) => {
        showAllPosts = false;
        document.getElementById("myPostsBtn").classList.add("active");
        document.getElementById("allPostsBtn").classList.remove("active");
        listPosts(false);
    };

    document.getElementById("allPostsBtn").onclick = (e) => {
        showAllPosts = true;
        document.getElementById("allPostsBtn").classList.add("active");
        document.getElementById("myPostsBtn").classList.remove("active");
        listPosts(true);
    };

    document.getElementById("createPostBtn").onclick = () => {
        document.getElementById("postForm").reset();
        document.getElementById("postId").value = "";
        document.getElementById("heroPreview").innerHTML = `<div class="placeholder-img">No Image Selected</div>`;
        showEditor(true, true); 
    };
    
    document.getElementById("backBtn").onclick = () => {
        showDashboard(true); 
    };

    document.getElementById("postForm").onsubmit = savePost;
    document.getElementById("deleteBtn").onclick = async () => {
        const id = document.getElementById("postId").value;
        if(id) { await deletePost(id); }
    };

    document.getElementById("postsBody").onclick = (e) => {
        const btn = e.target;
        const id = btn.dataset.id;
        
        if (!id) return;

        if (btn.classList.contains("post-title-btn")) {
            loadPost(id, true, true); 
        }

        if (btn.classList.contains("edit-action-btn")) {
            loadPost(id, false, true); 
        }
        
        if (btn.classList.contains("delete-action-btn")) {
            deletePost(id);
        }
    };
  }

  init();
})();