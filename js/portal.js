/* =========================================================
   Account portal: customer + admin sign-in, enquiries,
   threaded replies. Data lives in Supabase (see
   supabase/migrations); access is enforced by RLS.
   ========================================================= */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var sb = null;
  var user = null;
  var isAdmin = false;
  var profile = null;
  var enquiries = [];
  var activeId = null;
  var filter = "all";
  var search = "";
  var adminLoginAttempt = false;
  var channel = null;
  var refreshTimer = null;

  /* ---------------- helpers ---------------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function fmt(iso) {
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function setMsg(node, text, type) {
    node.textContent = text || "";
    node.className = "form-msg" + (type ? " " + type : "");
  }

  function show(id) {
    ["view-loading", "view-auth", "view-recovery", "view-app"].forEach(function (v) {
      $(v).hidden = v !== id;
    });
    $("btn-signout").hidden = id !== "view-app";
  }

  function friendlyError(err) {
    var m = (err && err.message) || "Something went wrong. Please try again.";
    if (/invalid login credentials/i.test(m)) return "Incorrect email or password.";
    if (/email not confirmed/i.test(m)) return "Please confirm your email first. Check your inbox for the confirmation link.";
    if (/rate limit|too many/i.test(m)) return "Too many attempts. Please wait a few minutes and try again.";
    if (/password should be at least/i.test(m)) return "Password must be at least 8 characters.";
    if (/failed to fetch|networkerror/i.test(m)) return "Network problem. Please check your connection and try again.";
    return m;
  }

  function pageUrl() {
    return location.origin + location.pathname;
  }

  function statusLabel(status) {
    if (isAdmin) return { open: "Needs reply", answered: "Answered", closed: "Closed" }[status];
    return { open: "Awaiting reply", answered: "Reply received", closed: "Closed" }[status];
  }

  /* ---------------- auth screens ---------------- */
  function setMode(mode) {
    document.querySelectorAll(".tab").forEach(function (t) {
      var on = t.getAttribute("data-mode") === mode;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $("form-signin").hidden = mode !== "signin";
    $("form-signup").hidden = mode !== "signup";
    $("form-admin").hidden = mode !== "admin";
    $("form-forgot").hidden = mode !== "forgot";
    $("btn-resend").hidden = true;
    setMsg($("auth-msg"), "");
  }

  function busy(form, on) {
    form.querySelectorAll("button[type=submit], input, select, textarea").forEach(function (n) { n.disabled = on; });
  }

  function initAuthForms() {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () { setMode(t.getAttribute("data-mode")); });
    });
    $("btn-forgot").addEventListener("click", function () {
      $("fp-email").value = $("si-email").value;
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      setMode("forgot");
    });
    $("btn-forgot-back").addEventListener("click", function () { setMode("signin"); });

    $("form-signin").addEventListener("submit", function (e) {
      e.preventDefault();
      signIn($("form-signin"), $("si-email").value, $("si-password").value, false);
    });
    $("form-admin").addEventListener("submit", function (e) {
      e.preventDefault();
      signIn($("form-admin"), $("ad-email").value, $("ad-password").value, true);
    });

    $("form-signup").addEventListener("submit", function (e) {
      e.preventDefault();
      var form = $("form-signup");
      var name = $("su-name").value.trim();
      var email = $("su-email").value.trim();
      var password = $("su-password").value;
      if (!name || !email) return setMsg($("auth-msg"), "Please enter your name and email.", "error");
      if (password.length < 8) return setMsg($("auth-msg"), "Password must be at least 8 characters.", "error");

      busy(form, true);
      setMsg($("auth-msg"), "Creating your account…");
      sb.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { full_name: name, phone: $("su-phone").value.trim() },
          emailRedirectTo: pageUrl()
        }
      }).then(function (res) {
        busy(form, false);
        if (res.error) return setMsg($("auth-msg"), friendlyError(res.error), "error");
        if (res.data.session) return; // confirmations disabled: onAuthStateChange takes over
        if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
          return setMsg($("auth-msg"), "This email is already registered. Please sign in instead.", "error");
        }
        form.reset();
        setMsg($("auth-msg"), "Almost done! We've sent a confirmation link to " + email + ". Open it, then sign in.", "success");
        $("btn-resend").hidden = false;
        $("btn-resend").dataset.email = email;
      });
    });

    $("btn-resend").addEventListener("click", function () {
      var email = $("btn-resend").dataset.email || $("si-email").value.trim();
      if (!email) return;
      sb.auth.resend({ type: "signup", email: email, options: { emailRedirectTo: pageUrl() } }).then(function (res) {
        setMsg($("auth-msg"), res.error ? friendlyError(res.error) : "Confirmation email sent again.", res.error ? "error" : "success");
      });
    });

    $("form-forgot").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("fp-email").value.trim();
      if (!email) return setMsg($("auth-msg"), "Please enter your email.", "error");
      var form = $("form-forgot");
      busy(form, true);
      sb.auth.resetPasswordForEmail(email, { redirectTo: pageUrl() }).then(function (res) {
        busy(form, false);
        setMsg($("auth-msg"), res.error ? friendlyError(res.error) : "If that email has an account, a reset link is on its way.", res.error ? "error" : "success");
      });
    });

    $("form-recovery").addEventListener("submit", function (e) {
      e.preventDefault();
      var pw = $("rc-password").value;
      if (pw.length < 8) return setMsg($("recovery-msg"), "Password must be at least 8 characters.", "error");
      sb.auth.updateUser({ password: pw }).then(function (res) {
        if (res.error) return setMsg($("recovery-msg"), friendlyError(res.error), "error");
        setMsg($("recovery-msg"), "Password updated.", "success");
        history.replaceState(null, "", pageUrl());
      });
    });

    $("btn-signout").addEventListener("click", function () {
      sb.auth.signOut();
    });
  }

  function signIn(form, email, password, asAdmin) {
    email = email.trim();
    if (!email || !password) return setMsg($("auth-msg"), "Please enter your email and password.", "error");
    busy(form, true);
    setMsg($("auth-msg"), "Signing in…");
    adminLoginAttempt = asAdmin;
    sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      busy(form, false);
      if (res.error) {
        adminLoginAttempt = false;
        setMsg($("auth-msg"), friendlyError(res.error), "error");
        if (/confirm/i.test(res.error.message)) {
          $("btn-resend").hidden = false;
          $("btn-resend").dataset.email = email;
        }
      }
    });
  }

  /* ---------------- session handling ---------------- */
  function handleSession(session, force) {
    if (!session) {
      user = null;
      isAdmin = false;
      stopRealtime();
      show("view-auth");
      return;
    }
    if (!force && user && user.id === session.user.id && !$("view-app").hidden) return;
    user = session.user;
    loadApp();
  }

  function loadApp() {
    show("view-loading");
    Promise.all([
      sb.rpc("claim_guest_enquiries"),
      sb.rpc("is_admin"),
      sb.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle()
    ]).then(function (r) {
      isAdmin = r[1].data === true;
      profile = r[2].data || {};

      if (adminLoginAttempt && !isAdmin) {
        adminLoginAttempt = false;
        return sb.auth.signOut().then(function () {
          setMode("admin");
          setMsg($("auth-msg"), "This account is not an administrator. Customers, please use Sign in.", "error");
        });
      }
      adminLoginAttempt = false;

      $("app-title").textContent = isAdmin ? "Enquiries inbox" : "My enquiries";
      $("app-user").textContent = user.email;
      $("app-role").textContent = isAdmin ? "Admin" : "Customer";
      $("btn-new").hidden = isAdmin;
      $("list-tools").hidden = !isAdmin;
      activeId = null;
      showDetail("empty");
      show("view-app");

      return loadEnquiries().then(function () {
        var wanted = new URLSearchParams(location.search).get("enquiry");
        if (wanted && enquiries.some(function (e) { return e.id === wanted; })) openEnquiry(wanted);
        startRealtime();
      });
    }).catch(function (err) {
      show("view-auth");
      setMsg($("auth-msg"), friendlyError(err), "error");
    });
  }

  /* ---------------- enquiry list ---------------- */
  function loadEnquiries() {
    return sb.from("enquiries").select("*").order("updated_at", { ascending: false }).limit(300).then(function (res) {
      if (res.error) throw res.error;
      enquiries = res.data || [];
      renderList();
    });
  }

  function visibleEnquiries() {
    var q = search.trim().toLowerCase();
    return enquiries.filter(function (e) {
      if (filter !== "all" && e.status !== filter) return false;
      if (!q) return true;
      return (e.contact_name + " " + e.contact_email + " " + e.subject).toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderList() {
    var list = $("enquiry-list");
    list.innerHTML = "";
    var items = visibleEnquiries();
    var empty = $("list-empty");

    if (items.length === 0) {
      empty.hidden = false;
      empty.textContent = enquiries.length === 0
        ? (isAdmin ? "No enquiries yet." : "You haven't sent any enquiries yet. Use “New enquiry” to ask Sangeetha a question.")
        : "No enquiries match.";
    } else {
      empty.hidden = true;
    }

    items.forEach(function (e) {
      var li = el("li");
      var btn = el("button", "enquiry-item" + (e.id === activeId ? " active" : ""));
      btn.type = "button";
      var top = el("div", "enquiry-item-top");
      top.appendChild(el("strong", "", isAdmin ? e.contact_name : e.subject));
      top.appendChild(el("span", "badge badge-" + e.status, statusLabel(e.status)));
      btn.appendChild(top);
      btn.appendChild(el("span", "enquiry-item-sub", isAdmin ? e.subject : "Updated " + fmt(e.updated_at)));
      if (isAdmin) btn.appendChild(el("span", "enquiry-item-sub", fmt(e.updated_at)));
      btn.addEventListener("click", function () { openEnquiry(e.id); });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function showDetail(which) {
    $("detail-empty").hidden = which !== "empty";
    $("detail-new").hidden = which !== "new";
    $("detail-thread").hidden = which !== "thread";
    $("portal-layout").classList.toggle("show-detail", which !== "empty");
  }

  /* ---------------- thread ---------------- */
  function openEnquiry(id) {
    activeId = id;
    renderList();
    showDetail("thread");
    setMsg($("reply-msg"), "");
    $("form-reply").reset();
    return loadThread();
  }

  function loadThread() {
    var enquiry = enquiries.filter(function (e) { return e.id === activeId; })[0];
    if (!enquiry) return Promise.resolve();

    $("th-subject").textContent = enquiry.subject;
    var badge = $("th-status");
    badge.textContent = statusLabel(enquiry.status);
    badge.className = "badge badge-" + enquiry.status;

    var contact = enquiry.contact_name + " · " + enquiry.contact_email + (enquiry.contact_phone ? " · " + enquiry.contact_phone : "");
    $("th-contact").textContent = isAdmin ? contact : "Started " + fmt(enquiry.created_at);
    $("admin-actions").hidden = !isAdmin;
    if (isAdmin) {
      $("act-mail").href = "mailto:" + encodeURIComponent(enquiry.contact_email) + "?subject=" + encodeURIComponent("Re: " + enquiry.subject);
      $("act-call").hidden = !enquiry.contact_phone;
      if (enquiry.contact_phone) $("act-call").href = "tel:" + enquiry.contact_phone.replace(/[^\d+]/g, "");
      $("act-close").textContent = enquiry.status === "closed" ? "Reopen" : "Mark closed";
    }
    var closedForCustomer = !isAdmin && enquiry.status === "closed";
    $("form-reply").hidden = closedForCustomer;
    $("closed-note").hidden = !closedForCustomer;

    return sb.from("enquiry_messages").select("*").eq("enquiry_id", activeId).order("created_at", { ascending: true }).then(function (res) {
      if (res.error) throw res.error;
      var box = $("messages");
      box.innerHTML = "";
      (res.data || []).forEach(function (m) {
        var mine = isAdmin ? m.sender_role === "admin" : m.sender_role !== "admin";
        var who = m.sender_role === "admin" ? "Sangeetha" : (isAdmin ? enquiry.contact_name : "You");
        var bubble = el("div", "bubble " + (mine ? "mine" : "theirs"));
        bubble.appendChild(el("div", "bubble-meta", who + " · " + fmt(m.created_at)));
        bubble.appendChild(el("div", "bubble-body", m.body));
        box.appendChild(bubble);
      });
      box.scrollTop = box.scrollHeight;
    }).catch(function (err) {
      setMsg($("reply-msg"), friendlyError(err), "error");
    });
  }

  function initThreadActions() {
    document.querySelectorAll("[data-back]").forEach(function (b) {
      b.addEventListener("click", function () { activeId = null; renderList(); showDetail("empty"); });
    });

    $("form-reply").addEventListener("submit", function (e) {
      e.preventDefault();
      var body = $("rp-body").value.trim();
      if (!body) return setMsg($("reply-msg"), "Please write a reply first.", "error");
      var form = $("form-reply");
      busy(form, true);
      sb.from("enquiry_messages").insert({ enquiry_id: activeId, body: body }).then(function (res) {
        busy(form, false);
        if (res.error) return setMsg($("reply-msg"), friendlyError(res.error), "error");
        form.reset();
        setMsg($("reply-msg"), "Sent.", "success");
        return loadEnquiries().then(loadThread);
      });
    });

    $("act-close").addEventListener("click", function () {
      var enquiry = enquiries.filter(function (x) { return x.id === activeId; })[0];
      var next = enquiry.status === "closed" ? "open" : "closed";
      sb.from("enquiries").update({ status: next }).eq("id", activeId).then(function (res) {
        if (res.error) return setMsg($("reply-msg"), friendlyError(res.error), "error");
        return loadEnquiries().then(loadThread);
      });
    });

    $("act-delete").addEventListener("click", function () {
      if (!window.confirm("Delete this enquiry and all its messages? This cannot be undone.")) return;
      sb.from("enquiries").delete().eq("id", activeId).then(function (res) {
        if (res.error) return setMsg($("reply-msg"), friendlyError(res.error), "error");
        activeId = null;
        showDetail("empty");
        return loadEnquiries();
      });
    });
  }

  /* ---------------- new enquiry (customers) ---------------- */
  function initNewEnquiry() {
    $("btn-new").addEventListener("click", function () {
      activeId = null;
      renderList();
      $("nw-name").value = (profile && profile.full_name) || "";
      $("nw-phone").value = (profile && profile.phone) || "";
      setMsg($("new-msg"), "");
      showDetail("new");
    });

    $("form-new").addEventListener("submit", function (e) {
      e.preventDefault();
      var form = $("form-new");
      var name = $("nw-name").value.trim();
      var message = $("nw-message").value.trim();
      if (!name) return setMsg($("new-msg"), "Please enter your name.", "error");
      if (!message) return setMsg($("new-msg"), "Please write a message.", "error");

      busy(form, true);
      setMsg($("new-msg"), "Sending…");
      sb.rpc("create_enquiry", {
        p_name: name,
        p_email: user.email,
        p_phone: $("nw-phone").value.trim(),
        p_subject: $("nw-topic").value,
        p_message: message
      }).then(function (res) {
        busy(form, false);
        if (res.error) return setMsg($("new-msg"), friendlyError(res.error), "error");
        $("nw-message").value = "";
        return loadEnquiries().then(function () { return openEnquiry(res.data); });
      });
    });
  }

  /* ---------------- refresh + realtime ---------------- */
  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      if (!user || $("view-app").hidden) return;
      loadEnquiries().then(function () { if (activeId && !$("detail-thread").hidden) return loadThread(); });
    }, 400);
  }

  function startRealtime() {
    stopRealtime();
    try {
      channel = sb.channel("portal-" + user.id)
        .on("postgres_changes", { event: "*", schema: "public", table: "enquiry_messages" }, refreshSoon)
        .on("postgres_changes", { event: "*", schema: "public", table: "enquiries" }, refreshSoon)
        .subscribe();
    } catch (e) { /* live updates are optional; the Refresh button still works */ }
  }

  function stopRealtime() {
    if (channel && sb) { try { sb.removeChannel(channel); } catch (e) { /* ignore */ } }
    channel = null;
  }

  function initToolbar() {
    $("btn-refresh").addEventListener("click", refreshSoon);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refreshSoon(); });

    $("filter-chips").addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      filter = chip.getAttribute("data-filter");
      document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === chip); });
      renderList();
    });
    $("list-search").addEventListener("input", function (e) { search = e.target.value; renderList(); });
  }

  /* ---------------- boot ---------------- */
  function init() {
    initAuthForms();
    initThreadActions();
    initNewEnquiry();
    initToolbar();

    window.getSupabase().then(function (client) {
      sb = client;
      sb.auth.onAuthStateChange(function (event, session) {
        // Defer: calling Supabase from inside this callback can deadlock the client.
        setTimeout(function () {
          if (event === "PASSWORD_RECOVERY") { show("view-recovery"); return; }
          if (event === "TOKEN_REFRESHED") return;
          handleSession(session, false);
        }, 0);
      });
    }).catch(function (err) {
      show("view-auth");
      setMsg($("auth-msg"), friendlyError(err), "error");
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
