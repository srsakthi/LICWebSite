/* =========================================================
   Sangeetha - LIC & Star Health Insurance Advisor
   Vanilla JS: navigation, gallery, map, animations
   ========================================================= */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------
     Social links configuration
     Fill in real URLs below. Empty strings hide the icon.
  --------------------------------------------------- */
  var SOCIAL_LINKS = {
    facebook: "",
    x: "",
    instagram: "",
    whatsapp: "https://wa.me/919524608535"
  };

  var SOCIAL_ICONS = {
    facebook: '<svg viewBox="0 0 24 24"><path d="M13.5 21v-7.7h2.6l.4-3h-3v-1.9c0-.9.2-1.5 1.5-1.5h1.6V4.2C15.9 4.1 15 4 14 4c-2.2 0-3.7 1.3-3.7 3.8v2.5H7.7v3h2.6V21z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18.2 3h3l-6.6 7.5L22 21h-6.1l-4.8-6.3L5.6 21H2.6l7.1-8.1L2 3h6.3l4.3 5.8zm-1.1 16h1.7L7 5h-1.8z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2c2.7 0 3 0 4.1.06 1.1.05 1.8.22 2.4.46.6.25 1.1.6 1.6 1.1.5.5.85 1 1.1 1.6.24.6.4 1.3.46 2.4C21.94 8.7 22 9 22 12s0 3-.06 4.1c-.05 1.1-.22 1.8-.46 2.4-.25.6-.6 1.1-1.1 1.6-.5.5-1 .85-1.6 1.1-.6.24-1.3.4-2.4.46C15 21.94 14.7 22 12 22s-3 0-4.1-.06c-1.1-.05-1.8-.22-2.4-.46-.6-.25-1.1-.6-1.6-1.1-.5-.5-.85-1-1.1-1.6-.24-.6-.4-1.3-.46-2.4C2.06 15 2 14.7 2 12s0-3 .06-4.1c.05-1.1.22-1.8.46-2.4.25-.6.6-1.1 1.1-1.6.5-.5 1-.85 1.6-1.1.6-.24 1.3-.4 2.4-.46C9 2.06 9.3 2 12 2zm0 1.8c-2.65 0-2.97 0-4 .06-.97.04-1.5.2-1.85.34-.46.18-.8.4-1.15.75-.35.35-.57.69-.75 1.15-.14.35-.3.88-.34 1.85-.06 1.03-.06 1.35-.06 4s0 2.97.06 4c.04.97.2 1.5.34 1.85.18.46.4.8.75 1.15.35.35.69.57 1.15.75.35.14.88.3 1.85.34 1.03.06 1.35.06 4 .06s2.97 0 4-.06c.97-.04 1.5-.2 1.85-.34.46-.18.8-.4 1.15-.75.35-.35.57-.69.75-1.15.14-.35.3-.88.34-1.85.06-1.03.06-1.35.06-4s0-2.97-.06-4c-.04-.97-.2-1.5-.34-1.85a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.35-.14-.88-.3-1.85-.34-1.03-.06-1.35-.06-4-.06zm0 3.7a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 1.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4zm4.7-1.98a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>'
  };

  function renderSocialIcons() {
    var containers = document.querySelectorAll(".social-icons");
    var labels = { facebook: "Facebook", x: "X (Twitter)", instagram: "Instagram", whatsapp: "WhatsApp" };

    containers.forEach(function (container) {
      Object.keys(SOCIAL_LINKS).forEach(function (key) {
        var url = SOCIAL_LINKS[key];
        if (!url) return;
        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", labels[key]);
        a.innerHTML = SOCIAL_ICONS[key];
        container.appendChild(a);
      });
    });
  }

  /* ---------------------------------------------------
     Header: sticky shadow + mobile nav toggle
  --------------------------------------------------- */
  function initHeader() {
    var header = document.getElementById("site-header");
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("main-nav");

    function onScroll() {
      if (window.scrollY > 8) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------
     Active nav link on scroll
  --------------------------------------------------- */
  function initScrollSpy() {
    var sections = ["home", "services", "plans", "gallery", "posters", "video", "about", "contact"]
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var links = document.querySelectorAll(".nav-link");

    function setActive(id) {
      links.forEach(function (link) {
        var match = link.getAttribute("href") === "#" + id;
        link.classList.toggle("active-link", match);
      });
    }

    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------------------------------------------------
     Reveal-on-scroll animation
  --------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------
     Shared lightbox (used by both the gallery and the
     posters section)
  --------------------------------------------------- */
  var Lightbox = (function () {
    var lightbox = document.getElementById("lightbox");
    var img = document.getElementById("lightbox-img");
    var caption = document.getElementById("lightbox-caption");
    var closeBtn = document.getElementById("lightbox-close");
    if (!lightbox) return { open: function () {}, close: function () {} };

    function open(src, alt, captionText) {
      img.src = src;
      img.alt = alt || "";
      caption.textContent = captionText || "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
    }
    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hidden) close();
    });

    return { open: open, close: close };
  })();

  /* ---------------------------------------------------
     Gallery: load images/gallery.json, build cards,
     auto-scroll, prev/next, pause on hover/touch, lightbox
  --------------------------------------------------- */
  function initGallery() {
    var track = document.getElementById("gallery-track");
    var viewport = document.getElementById("gallery-viewport");
    var prevBtn = document.getElementById("gallery-prev");
    var nextBtn = document.getElementById("gallery-next");

    if (!track) return;

    fetch("images/gallery.json")
      .then(function (res) {
        if (!res.ok) throw new Error("gallery.json not found");
        return res.json();
      })
      .then(function (items) {
        if (!Array.isArray(items) || items.length === 0) {
          track.innerHTML = '<p class="gallery-loading">Gallery coming soon.</p>';
          return;
        }
        buildGallery(items);
      })
      .catch(function () {
        track.innerHTML = '<p class="gallery-loading">Gallery coming soon.</p>';
      });

    function buildGallery(items) {
      track.innerHTML = "";

      // Render each item; render twice for a seamless auto-scroll loop.
      var loopItems = items.concat(items);

      loopItems.forEach(function (item, index) {
        var card = document.createElement("div");
        card.className = "gallery-card";

        var img = document.createElement("img");
        img.src = "images/" + item.image;
        img.alt = item.title ? item.title : "Insurance gallery image";
        img.loading = "lazy";
        img.onerror = function () {
          var placeholder = document.createElement("div");
          placeholder.className = "gallery-card-placeholder";
          placeholder.textContent = item.title || "Image unavailable";
          img.replaceWith(placeholder);
        };
        card.appendChild(img);

        if (item.title || item.description) {
          var body = document.createElement("div");
          body.className = "gallery-card-body";
          if (item.title) {
            var h3 = document.createElement("h3");
            h3.textContent = item.title;
            body.appendChild(h3);
          }
          if (item.description) {
            var p = document.createElement("p");
            p.textContent = item.description;
            body.appendChild(p);
          }
          card.appendChild(body);
        }

        card.addEventListener("click", function () {
          Lightbox.open(
            "images/" + item.image,
            item.title || "Insurance gallery image",
            [item.title, item.description].filter(Boolean).join(" — ")
          );
        });

        track.appendChild(card);
      });

      startAutoScroll();
    }

    /* ---- Auto-scroll engine ---- */
    var offset = 0;
    var speed = 0.5; // px per frame
    var paused = false;
    var rafId = null;
    var halfWidth = 0;

    function measure() {
      halfWidth = track.scrollWidth / 2;
    }

    function step() {
      if (!paused && halfWidth > 0) {
        offset += speed;
        if (offset >= halfWidth) offset -= halfWidth;
        track.style.transform = "translateX(" + (-offset) + "px)";
      }
      rafId = requestAnimationFrame(step);
    }

    function startAutoScroll() {
      measure();
      window.addEventListener("resize", measure);
      if (prefersReducedMotion) return; // static gallery, manual nav only
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(step);
    }

    viewport.addEventListener("mouseenter", function () { paused = true; });
    viewport.addEventListener("mouseleave", function () { paused = false; });
    viewport.addEventListener("touchstart", function () { paused = true; }, { passive: true });
    viewport.addEventListener("touchend", function () { paused = false; }, { passive: true });

    function nudge(direction) {
      paused = true;
      var cardWidth = 310;
      offset += direction * cardWidth;
      if (halfWidth > 0) {
        if (offset < 0) offset += halfWidth;
        if (offset >= halfWidth) offset -= halfWidth;
      }
      track.style.transform = "translateX(" + (-offset) + "px)";
      window.clearTimeout(nudge._t);
      nudge._t = window.setTimeout(function () { paused = false; }, 2200);
    }

    prevBtn.addEventListener("click", function () { nudge(-1); });
    nextBtn.addEventListener("click", function () { nudge(1); });
  }

  /* ---------------------------------------------------
     Posters: load Posters/posters.json and build a
     responsive grid; clicking a poster opens the shared
     lightbox. No poster is hardcoded in the HTML.
  --------------------------------------------------- */
  function initPosters() {
    var grid = document.getElementById("poster-grid");
    if (!grid) return;

    fetch("Posters/posters.json")
      .then(function (res) {
        if (!res.ok) throw new Error("posters.json not found");
        return res.json();
      })
      .then(function (items) {
        if (!Array.isArray(items) || items.length === 0) {
          grid.innerHTML = '<p class="gallery-loading">Posters coming soon.</p>';
          return;
        }
        buildPosters(items);
      })
      .catch(function () {
        grid.innerHTML = '<p class="gallery-loading">Posters coming soon.</p>';
      });

    function buildPosters(items) {
      grid.innerHTML = "";

      items.forEach(function (item) {
        var card = document.createElement("div");
        card.className = "poster-card reveal in-view";

        var media = document.createElement("div");
        media.className = "poster-card-media";

        var img = document.createElement("img");
        img.src = "Posters/" + item.image;
        img.alt = item.title ? item.title : "Insurance poster";
        img.loading = "lazy";
        img.onerror = function () {
          media.textContent = item.title || "Image unavailable";
        };
        media.appendChild(img);
        card.appendChild(media);

        if (item.title || item.description) {
          var body = document.createElement("div");
          body.className = "poster-card-body";
          if (item.title) {
            var h3 = document.createElement("h3");
            h3.textContent = item.title;
            body.appendChild(h3);
          }
          if (item.description) {
            var p = document.createElement("p");
            p.textContent = item.description;
            body.appendChild(p);
          }
          card.appendChild(body);
        }

        card.addEventListener("click", function () {
          Lightbox.open(
            "Posters/" + item.image,
            item.title || "Insurance poster",
            [item.title, item.description].filter(Boolean).join(" — ")
          );
        });

        grid.appendChild(card);
      });
    }
  }

  /* ---------------------------------------------------
     Video: load Video/videos.json and build a responsive
     grid of native <video> players. No video is hardcoded
     in the HTML.
  --------------------------------------------------- */
  function initVideos() {
    var grid = document.getElementById("video-grid");
    if (!grid) return;

    fetch("Video/videos.json")
      .then(function (res) {
        if (!res.ok) throw new Error("videos.json not found");
        return res.json();
      })
      .then(function (items) {
        if (!Array.isArray(items) || items.length === 0) {
          grid.innerHTML = '<p class="gallery-loading">Videos coming soon.</p>';
          return;
        }
        buildVideos(items);
      })
      .catch(function () {
        grid.innerHTML = '<p class="gallery-loading">Videos coming soon.</p>';
      });

    function buildVideos(items) {
      grid.innerHTML = "";

      items.forEach(function (item) {
        var card = document.createElement("div");
        card.className = "video-card reveal in-view";

        var media = document.createElement("div");
        media.className = "video-card-media";

        var video = document.createElement("video");
        video.src = "Video/" + item.file;
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.setAttribute("aria-label", item.title || "Insurance awareness video");
        video.onerror = function () {
          media.textContent = item.title || "Video unavailable";
        };
        media.appendChild(video);
        card.appendChild(media);

        if (item.title || item.description) {
          var body = document.createElement("div");
          body.className = "video-card-body";
          if (item.title) {
            var h3 = document.createElement("h3");
            h3.textContent = item.title;
            body.appendChild(h3);
          }
          if (item.description) {
            var p = document.createElement("p");
            p.textContent = item.description;
            body.appendChild(p);
          }
          card.appendChild(body);
        }

        grid.appendChild(card);
      });
    }
  }

  /* ---------------------------------------------------
     Map (Leaflet / OpenStreetMap)
  --------------------------------------------------- */
  function initMap() {
    var mapEl = document.getElementById("map");
    if (!mapEl || typeof L === "undefined") return;

    var lat = 11.050407;
    var lng = 76.959133;

    var map = L.map(mapEl, { scrollWheelZoom: false }).setView([lat, lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    var marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup("<strong>Sangeetha</strong><br>LIC &amp; Star Health Insurance Advisor<br>Nallampalayam, Coimbatore");

    mapEl.addEventListener("click", function () { map.scrollWheelZoom.enable(); });
    mapEl.addEventListener("mouseleave", function () { map.scrollWheelZoom.disable(); });
  }

  /* ---------------------------------------------------
     Misc: footer year
  --------------------------------------------------- */
  function initMisc() {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderSocialIcons();
    initHeader();
    initScrollSpy();
    initReveal();
    initGallery();
    initPosters();
    initVideos();
    initMap();
    initMisc();
  });
})();
