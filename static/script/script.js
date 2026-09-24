/* =========================================================
   MAC — Shared frontend script
   Mock data until MAC.config.apiBase is set to your backend.
   ========================================================= */
(function () {
  "use strict";

  var MAC = (window.MAC = window.MAC || {});
  MAC.config = Object.assign(
    {
      /* Set before this script loads, e.g.:
         <script>window.MAC = { config: { apiBase: 'http://localhost:3000' } };</script>
         Or: <meta name="mac-api-base" content="http://localhost:3000"> */
      apiBase: "",
      mockDelay: 900,
      redirectAfterLogin: "profile.html"
    },
    MAC.config || {}
  );

  var apiMeta = document.querySelector('meta[name="mac-api-base"]');
  if (apiMeta && apiMeta.content && !MAC.config.apiBase) {
    MAC.config.apiBase = apiMeta.content.replace(/\/$/, "");
  }

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- API helper (swap mock → real fetch) ---------- */
  MAC.api = function (path, options) {
    options = options || {};
    var base = MAC.config.apiBase;
    var method = (options.method || "GET").toUpperCase();
    var body = options.body;

    if (!base) {
      return new Promise(function (resolve) {
        window.setTimeout(function () {
          resolve({ ok: true, mock: true, data: options.mockData || null });
        }, MAC.config.mockDelay);
      });
    }

    var headers = Object.assign(
      { Accept: "application/json" },
      body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {},
      options.headers || {}
    );

    return fetch(base + path, {
      method: method,
      headers: headers,
      credentials: options.credentials || "include",
      body: body
        ? body instanceof FormData
          ? body
          : typeof body === "string"
            ? body
            : JSON.stringify(body)
        : undefined
    }).then(function (res) {
      return res.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!res.ok) {
          var err = new Error((data && (data.message || data.error)) || "Request failed");
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  };

  MAC.showBanner = function (banner, message, isError) {
    if (!banner) return;
    banner.classList.remove("show", "error");
    void banner.offsetWidth;
    banner.textContent = message;
    if (isError) banner.classList.add("error");
    banner.classList.add("show");
  };

  MAC.formToObject = function (form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = value;
    });
    return data;
  };

  /* ---------- Active nav highlight ---------- */
  (function () {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll("nav a, .mobile-nav-panel > a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
      if (href && href === page) a.classList.add("active");
    });
  })();

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var isActive = item.classList.contains("active");
      document.querySelectorAll(".faq-item").forEach(function (i) {
        i.classList.remove("active");
      });
      if (!isActive) item.classList.add("active");
    });
  });

  /* ---------------- Header shadow on scroll ---------------- */
  var header = document.querySelector("header");
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("scrolled", window.scrollY > 12);
    };
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();
  }

  /* ---------------- Mobile nav drawer ---------------- */
  var navToggle = document.querySelector(".mobile-nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  if (navToggle && mobileNav) {
    var closeBtn = mobileNav.querySelector(".mobile-nav-close");
    var openNav = function () {
      mobileNav.classList.add("open");
      document.body.classList.add("nav-open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Close menu");
    };
    var closeNav = function () {
      mobileNav.classList.remove("open");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    };
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.addEventListener("click", function () {
      if (mobileNav.classList.contains("open")) closeNav();
      else openNav();
    });
    if (closeBtn) closeBtn.addEventListener("click", closeNav);
    mobileNav.addEventListener("click", function (e) {
      if (e.target === mobileNav) closeNav();
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 960 && mobileNav.classList.contains("open")) closeNav();
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) {
        el.classList.add("in-view");
      });
    } else {
      var groups = {};
      revealEls.forEach(function (el) {
        var group = el.getAttribute("data-reveal-group") || "_default";
        groups[group] = groups[group] || [];
        groups[group].push(el);
      });
      Object.keys(groups).forEach(function (g) {
        groups[g].forEach(function (el, idx) {
          el.style.setProperty("--reveal-delay", idx * 0.08 + "s");
        });
      });
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* ---------------- Animated ammo/XP bar fill on view ---------------- */
  var ammoFills = document.querySelectorAll(".ammo-fill");
  if (ammoFills.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      ammoFills.forEach(function (el) {
        el.classList.add("filled");
      });
    } else {
      var ammoIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("filled");
              ammoIo.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      ammoFills.forEach(function (el) {
        ammoIo.observe(el);
      });
    }
  }

  /* ---------------- Count-up stat numbers ---------------- */
  var counters = document.querySelectorAll(".stat-big[data-count]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    var animateCount = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1400;
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    };
    var countIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) {
      countIo.observe(el);
    });
  }

  /* ---------------- Testimonial carousel ---------------- */
  var testiQuote = document.querySelector(".testi-quote");
  if (testiQuote) {
    var testimonials = [
      {
        quote:
          "They thoroughly analyze our industry and target audience, allowing them to develop customized campaigns that effectively reach and engage our customers. Their creative ideas and cutting-edge techniques have helped us stay ahead of the competition.",
        name: "Michael Kaizer",
        role: "CEO / Basecamp Corp"
      },
      {
        quote:
          "Response times, reporting clarity, and campaign performance all improved the moment this team took over our accounts. It finally feels like our marketing has a chain of command.",
        name: "Dana Whitfield",
        role: "Head of Growth / Northline Retail"
      },
      {
        quote:
          "We went into this expecting another vendor relationship. Instead we got a squad that treats our KPIs like mission objectives — and hits them.",
        name: "Ravi Patel",
        role: "Founder / Ferro Outdoor"
      },
      {
        quote:
          "Every sprint ends with a debrief that actually explains the why behind the numbers, not just the numbers. That transparency is rare.",
        name: "Elena Vasquez",
        role: "Marketing Director / Cobalt Labs"
      },
      {
        quote:
          "Our organic traffic tripled in two quarters, but what stuck with us most was how methodically they got there — no shortcuts, no guesswork.",
        name: "Tomasz Nowak",
        role: "COO / Aurex Fintech"
      }
    ];
    var idx = 0;
    var opName = document.querySelector(".op-name");
    var opRole = document.querySelector(".op-role");
    var counterEl = document.querySelector(".counter");
    var prevBtn = document.querySelector(".testi-controls .round-btn:first-child");
    var nextBtn = document.querySelector(".testi-controls .round-btn:last-child");

    var renderTesti = function () {
      var pad = function (n) {
        return String(n + 1).padStart(2, "0");
      };
      var apply = function () {
        var t = testimonials[idx];
        testiQuote.textContent = t.quote;
        if (opName) opName.textContent = t.name;
        if (opRole) opRole.textContent = t.role;
        if (counterEl)
          counterEl.innerHTML = pad(idx) + "<span>/0" + testimonials.length + "</span>";
        testiQuote.classList.remove("switching");
      };
      if (reduceMotion) {
        apply();
        return;
      }
      testiQuote.classList.add("switching");
      window.setTimeout(apply, 220);
    };

    if (prevBtn)
      prevBtn.addEventListener("click", function () {
        idx = (idx - 1 + testimonials.length) % testimonials.length;
        renderTesti();
      });
    if (nextBtn)
      nextBtn.addEventListener("click", function () {
        idx = (idx + 1) % testimonials.length;
        renderTesti();
      });
  }

  /* =========================================================
     LOGIN / REGISTER PAGE LOGIC
     ========================================================= */
  var authTabs = document.querySelector(".auth-tabs");
  var footNote = document.getElementById("authFootLogin");

  var setActiveTab = function (which) {
    if (!authTabs) return;
    authTabs.setAttribute("data-active", which);
    authTabs.querySelectorAll(".auth-tab").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === which);
    });
    var loginForm = document.getElementById("loginForm");
    var registerForm = document.getElementById("registerForm");
    if (loginForm) loginForm.classList.toggle("hidden", which !== "login");
    if (registerForm) registerForm.classList.toggle("hidden", which !== "register");
    if (footNote) {
      if (which === "register") {
        footNote.innerHTML =
          'Already have a callsign? <a href="#" data-switch-to="login">Sign in</a>';
      } else {
        footNote.innerHTML =
          'Not registered yet? <a href="#" data-switch-to="register">Create an account</a>';
      }
    }
  };

  if (authTabs) {
    authTabs.querySelectorAll(".auth-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveTab(btn.getAttribute("data-tab"));
      });
    });
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-switch-to]");
    if (!link) return;
    e.preventDefault();
    setActiveTab(link.getAttribute("data-switch-to"));
  });

  /* password visibility toggles */
  document.querySelectorAll(".toggle-visibility").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = btn.parentElement.querySelector("input");
      if (!input) return;
      var isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
      btn.classList.toggle("is-visible", isHidden);
    });
  });

  /* simple password strength meter */
  var pwInput = document.getElementById("registerPassword");
  var strengthBars = document.querySelectorAll(".field-strength span");
  if (pwInput && strengthBars.length) {
    pwInput.addEventListener("input", function () {
      var val = pwInput.value;
      var score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 10) score++;
      if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      var colors = ["#2e3528", "#ff6a6a", "#ffa500", "#4caf50", "#4caf50"];
      strengthBars.forEach(function (bar, i) {
        bar.style.background = i < score ? colors[score] : "#2e3528";
      });
    });
  }

  /* form submit → MAC.api (mock until apiBase is set) */
  document.querySelectorAll("form[data-auth-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var invalid = false;
      form.querySelectorAll("input[required], textarea[required], select[required]").forEach(
        function (input) {
          var field = input.closest(".field");
          var ok = input.value.trim().length > 0 && input.checkValidity();
          if (field) field.classList.toggle("invalid", !ok);
          if (!ok) invalid = true;
        }
      );
      if (invalid) return;

      var submitBtn = form.querySelector(".auth-submit");
      if (!submitBtn) return;
      submitBtn.classList.add("loading");
      submitBtn.disabled = true;

      var endpoint = form.getAttribute("data-endpoint") || "/api/form";
      var payload = MAC.formToObject(form);
      var scope = form.closest(".auth-panel, .contact-form-panel") || document;
      var banner =
        scope.querySelector(".auth-status-banner") ||
        document.querySelector(".auth-status-banner");

      MAC.api(endpoint, { method: "POST", body: payload })
        .then(function () {
          MAC.showBanner(
            banner,
            form.getAttribute("data-success-message") || "Success.",
            false
          );
          form.reset();
          if (strengthBars.length)
            strengthBars.forEach(function (b) {
              b.style.background = "#2e3528";
            });
          if (form.id === "loginForm" && MAC.config.apiBase && MAC.config.redirectAfterLogin) {
            window.setTimeout(function () {
              location.href = MAC.config.redirectAfterLogin;
            }, 600);
          }
        })
        .catch(function (err) {
          MAC.showBanner(banner, err.message || "Something went wrong.", true);
        })
        .then(function () {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
        });
    });
  });

  /* =========================================================
     TERMS PAGE — TOC scrollspy
     ========================================================= */
  var tocLinks = document.querySelectorAll('.terms-toc-panel a[href^="#"]');
  var termsSections = document.querySelectorAll(".terms-section[id]");
  if (tocLinks.length && termsSections.length && "IntersectionObserver" in window) {
    var setActiveLink = function (id) {
      tocLinks.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    };
    var termsIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    termsSections.forEach(function (s) {
      termsIo.observe(s);
    });

    tocLinks.forEach(function (a) {
      a.addEventListener("click", function () {
        window.setTimeout(function () {
          setActiveLink(a.getAttribute("href").slice(1));
        }, 50);
      });
    });
  }

  /* =========================================================
     LEADERBOARD PAGE
     ========================================================= */
  var MOCK_LEADERBOARD = [
    { rank: 1, name: "Nova Renner", team: "Ignis Squad", score: 9840, winrate: 78, trend: "up" },
    { rank: 2, name: "Kaito Vance", team: "Steel Circuit", score: 9510, winrate: 74, trend: "up" },
    { rank: 3, name: "Mira Castillo", team: "Ember Row", score: 9225, winrate: 71, trend: "down" },
    { rank: 4, name: "Dex Okafor", team: "Ignis Squad", score: 8890, winrate: 69, trend: "up" },
    { rank: 5, name: "Priya Lindqvist", team: "Northline", score: 8640, winrate: 66, trend: "flat" },
    { rank: 6, name: "Rafael Suto", team: "Steel Circuit", score: 8410, winrate: 65, trend: "down" },
    { rank: 7, name: "Wren Achebe", team: "Ember Row", score: 8155, winrate: 63, trend: "up" },
    { rank: 8, name: "Lucia Marchetti", team: "Northline", score: 7920, winrate: 61, trend: "flat" },
    { rank: 9, name: "Tobias Kane", team: "Ignis Squad", score: 7688, winrate: 59, trend: "down" },
    { rank: 10, name: "Anya Petrova", team: "Steel Circuit", score: 7440, winrate: 58, trend: "up" },
    { rank: 11, name: "Femi Adeyemi", team: "Ember Row", score: 7205, winrate: 56, trend: "flat" },
    { rank: 12, name: "Sana Yamada", team: "Northline", score: 6980, winrate: 55, trend: "down" },
    { rank: 13, name: "Bram Ostrowski", team: "Ignis Squad", score: 6742, winrate: 53, trend: "up" },
    { rank: 14, name: "Isolde Marn", team: "Steel Circuit", score: 6510, winrate: 52, trend: "flat" },
    { rank: 15, name: "Cole Barrington", team: "Ember Row", score: 6288, winrate: 50, trend: "down" },
    { rank: 16, name: "Yara Haddad", team: "Northline", score: 6055, winrate: 49, trend: "up" },
    { rank: 17, name: "Dmitri Volkov", team: "Ignis Squad", score: 5830, winrate: 47, trend: "flat" },
    { rank: 18, name: "Grace Fontaine", team: "Steel Circuit", score: 5610, winrate: 46, trend: "down" },
    { rank: 19, name: "Amir Farrokhi", team: "Ember Row", score: 5395, winrate: 44, trend: "up" },
    { rank: 20, name: "Nadia Solberg", team: "Northline", score: 5180, winrate: 43, trend: "flat" }
  ];

  MAC.fetchLeaderboard = function () {
    return MAC.api("/api/leaderboard", { mockData: MOCK_LEADERBOARD }).then(function (res) {
      return Array.isArray(res) ? res : res.data || MOCK_LEADERBOARD;
    });
  };

  var lbTableBody = document.getElementById("lbTableBody");
  if (lbTableBody) {
    var lbPlayers = MOCK_LEADERBOARD.slice();
    var lbSearchInput = document.getElementById("lbSearch");
    var lbSortSelect = document.getElementById("lbSort");
    var lbPaginationEl = document.getElementById("lbPagination");
    var lbPageSize = 10;
    var lbCurrentPage = 1;

    var trendIcon = function (trend) {
      if (trend === "up")
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="18 15 12 9 6 15"/></svg>';
      if (trend === "down")
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg>';
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    };

    var escapeHtml = function (str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };

    var getFilteredSorted = function () {
      var term = (lbSearchInput ? lbSearchInput.value : "").trim().toLowerCase();
      var sortBy = lbSortSelect ? lbSortSelect.value : "rank";
      var list = lbPlayers.filter(function (p) {
        return (
          p.name.toLowerCase().indexOf(term) !== -1 ||
          p.team.toLowerCase().indexOf(term) !== -1
        );
      });
      return list.slice().sort(function (a, b) {
        if (sortBy === "score") return b.score - a.score;
        if (sortBy === "winrate") return b.winrate - a.winrate;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return a.rank - b.rank;
      });
    };

    var renderLeaderboard = function () {
      var list = getFilteredSorted();
      var totalPages = Math.max(1, Math.ceil(list.length / lbPageSize));
      if (lbCurrentPage > totalPages) lbCurrentPage = totalPages;
      var start = (lbCurrentPage - 1) * lbPageSize;
      var pageItems = list.slice(start, start + lbPageSize);

      if (!pageItems.length) {
        lbTableBody.innerHTML = '<div class="lb-empty">No operators match your search.</div>';
      } else {
        lbTableBody.innerHTML = pageItems
          .map(function (p) {
            var initials = p.name
              .split(" ")
              .map(function (n) {
                return n[0];
              })
              .join("")
              .slice(0, 2);
            return (
              "" +
              '<div class="lb-row' +
              (p.rank <= 3 ? " top" : "") +
              '">' +
              '  <div class="lb-rank">#' +
              p.rank +
              "</div>" +
              '  <div class="lb-player">' +
              '    <div class="lb-avatar" title="' +
              escapeHtml(initials) +
              '"></div>' +
              '    <div class="lb-name-wrap"><div class="lb-name">' +
              escapeHtml(p.name) +
              '</div><div class="lb-team">' +
              escapeHtml(p.team) +
              "</div></div>" +
              "  </div>" +
              '  <div class="lb-score">' +
              p.score.toLocaleString() +
              "</div>" +
              '  <div class="lb-winrate lb-col-winrate">' +
              p.winrate +
              "%</div>" +
              '  <div class="lb-trend ' +
              escapeHtml(p.trend) +
              '">' +
              trendIcon(p.trend) +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      }

      if (lbPaginationEl) {
        var btns = "";
        btns +=
          '<button class="lb-page-btn" data-page="prev" ' +
          (lbCurrentPage === 1 ? "disabled" : "") +
          ' aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="15 18 9 12 15 6"/></svg></button>';
        for (var i = 1; i <= totalPages; i++) {
          btns +=
            '<button class="lb-page-btn' +
            (i === lbCurrentPage ? " active" : "") +
            '" data-page="' +
            i +
            '">' +
            i +
            "</button>";
        }
        btns +=
          '<button class="lb-page-btn" data-page="next" ' +
          (lbCurrentPage === totalPages ? "disabled" : "") +
          ' aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg></button>';
        lbPaginationEl.innerHTML = btns;
      }
    };

    if (lbSearchInput)
      lbSearchInput.addEventListener("input", function () {
        lbCurrentPage = 1;
        renderLeaderboard();
      });
    if (lbSortSelect)
      lbSortSelect.addEventListener("change", function () {
        lbCurrentPage = 1;
        renderLeaderboard();
      });
    if (lbPaginationEl) {
      lbPaginationEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".lb-page-btn");
        if (!btn || btn.disabled) return;
        var page = btn.getAttribute("data-page");
        if (page === "prev") lbCurrentPage = Math.max(1, lbCurrentPage - 1);
        else if (page === "next") lbCurrentPage = lbCurrentPage + 1;
        else lbCurrentPage = parseInt(page, 10);
        renderLeaderboard();
        lbTableBody.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "nearest"
        });
      });
    }

    MAC.fetchLeaderboard().then(function (rows) {
      if (Array.isArray(rows) && rows.length) lbPlayers = rows;
      renderLeaderboard();
    });
  }

  /* =========================================================
     TOURNAMENTS PAGE
     ========================================================= */
  var MOCK_TOURNAMENTS = [
    { name: "Ignis Cup: Spring Clash", game: "Vector Arena", status: "live", prize: 25000, participants: 128, date: "Sep 24, 2026" },
    { name: "Steel Circuit Open", game: "Rift Legion", status: "live", prize: 18000, participants: 64, date: "Sep 25, 2026" },
    { name: "Northline Invitational", game: "Vector Arena", status: "upcoming", prize: 40000, participants: 32, date: "Oct 02, 2026" },
    { name: "Ember Row Showdown", game: "Skyforge Tactics", status: "upcoming", prize: 15000, participants: 96, date: "Oct 08, 2026" },
    { name: "Midnight Protocol Series", game: "Rift Legion", status: "upcoming", prize: 22000, participants: 48, date: "Oct 14, 2026" },
    { name: "Command Line Championship", game: "Vector Arena", status: "completed", prize: 50000, participants: 256, date: "Sep 02, 2026" },
    { name: "Skyforge Winter Qualifier", game: "Skyforge Tactics", status: "completed", prize: 12000, participants: 64, date: "Aug 18, 2026" },
    { name: "Rift Legion Proving Grounds", game: "Rift Legion", status: "completed", prize: 9000, participants: 32, date: "Aug 05, 2026" },
    { name: "Operator Ascension Series", game: "Vector Arena", status: "upcoming", prize: 30000, participants: 128, date: "Oct 20, 2026" },
    { name: "Ember Row Rapid Fire", game: "Skyforge Tactics", status: "live", prize: 8000, participants: 32, date: "Sep 23, 2026" },
    { name: "Northline Rookie Cup", game: "Rift Legion", status: "upcoming", prize: 6000, participants: 64, date: "Oct 05, 2026" },
    { name: "Steel Circuit Finals", game: "Vector Arena", status: "completed", prize: 60000, participants: 16, date: "Jul 30, 2026" }
  ];

  MAC.fetchTournaments = function () {
    return MAC.api("/api/tournaments", { mockData: MOCK_TOURNAMENTS }).then(function (res) {
      return Array.isArray(res) ? res : res.data || MOCK_TOURNAMENTS;
    });
  };

  var tourneyGrid = document.getElementById("tourneyGrid");
  if (tourneyGrid) {
    var tournaments = MOCK_TOURNAMENTS.slice();
    var tourneySearchInput = document.getElementById("tourneySearch");
    var tourneySortSelect = document.getElementById("tourneySort");
    var tourneyChips = document.querySelectorAll(".filter-chip");
    var tourneyCountEl = document.getElementById("tourneyCount");
    var activeStatus = "all";

    var money = function (n) {
      return "$" + n.toLocaleString();
    };

    var escapeHtml = function (str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };

    var renderTournaments = function () {
      var term = (tourneySearchInput ? tourneySearchInput.value : "").trim().toLowerCase();
      var sortBy = tourneySortSelect ? tourneySortSelect.value : "date";

      var list = tournaments.filter(function (t) {
        var matchesStatus = activeStatus === "all" || t.status === activeStatus;
        var matchesTerm =
          t.name.toLowerCase().indexOf(term) !== -1 ||
          t.game.toLowerCase().indexOf(term) !== -1;
        return matchesStatus && matchesTerm;
      });

      list = list.slice().sort(function (a, b) {
        if (sortBy === "prize") return b.prize - a.prize;
        if (sortBy === "participants") return b.participants - a.participants;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return new Date(a.date) - new Date(b.date);
      });

      if (tourneyCountEl) {
        tourneyCountEl.textContent =
          list.length + (list.length === 1 ? " Tournament Found" : " Tournaments Found");
      }

      if (!list.length) {
        tourneyGrid.innerHTML =
          '<div class="tourney-empty">No tournaments match your filters. Try a different search or status.</div>';
        return;
      }

      tourneyGrid.innerHTML = list
        .map(function (t) {
          var badgeLabel =
            t.status === "live" ? "Live Now" : t.status === "upcoming" ? "Upcoming" : "Completed";
          var ctaLabel = t.status === "completed" ? "View Results" : "View Bracket";
          return (
            "" +
            '<article class="tourney-card" data-reveal>' +
            '  <div class="tourney-top-row">' +
            '    <span class="game-tag">' +
            escapeHtml(t.game) +
            "</span>" +
            '    <span class="status-badge ' +
            escapeHtml(t.status) +
            '"><span class="dot"></span>' +
            badgeLabel +
            "</span>" +
            "  </div>" +
            "  <h3>" +
            escapeHtml(t.name) +
            "</h3>" +
            '  <div class="tourney-stats">' +
            '    <div class="tourney-stat"><div class="label">Prize Pool</div><div class="value prize">' +
            money(t.prize) +
            "</div></div>" +
            '    <div class="tourney-stat"><div class="label">Slots</div><div class="value">' +
            t.participants +
            "</div></div>" +
            "  </div>" +
            '  <div class="tourney-foot">' +
            '    <span class="tourney-date">' +
            escapeHtml(t.date) +
            "</span>" +
            '    <a class="intel-open" href="#">' +
            ctaLabel +
            '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
            "    </a>" +
            "  </div>" +
            "</article>"
          );
        })
        .join("");

      tourneyGrid.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("in-view");
      });
    };

    if (tourneySearchInput) tourneySearchInput.addEventListener("input", renderTournaments);
    if (tourneySortSelect) tourneySortSelect.addEventListener("change", renderTournaments);
    tourneyChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        tourneyChips.forEach(function (c) {
          c.classList.remove("active");
        });
        chip.classList.add("active");
        activeStatus = chip.getAttribute("data-status");
        renderTournaments();
      });
    });

    MAC.fetchTournaments().then(function (rows) {
      if (Array.isArray(rows) && rows.length) tournaments = rows;
      renderTournaments();
    });
  }

  /* =========================================================
     LIVE STREAMING PAGE
     ========================================================= */
  var liveTabs = document.querySelectorAll(".live-tab");
  var streamCards = document.querySelectorAll(".stream-card[data-status]");
  if (liveTabs.length && streamCards.length) {
    liveTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        liveTabs.forEach(function (t) {
          t.classList.remove("active");
        });
        tab.classList.add("active");
        var status = tab.getAttribute("data-status");
        streamCards.forEach(function (card) {
          var show = status === "all" || card.getAttribute("data-status") === status;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  var chatBody = document.getElementById("chatBody");
  var chatForm = document.getElementById("chatForm");
  if (chatBody && chatForm) {
    var chatNames = ["Rook_7", "ByteMarshal", "Cinder", "Onyx_Ops", "Wraith.exe", "Halcyon"];
    var chatLines = [
      "that flank was insane",
      "GG that rotation was clean",
      "clutch on point B!",
      "MVP performance right there",
      "let's go!!",
      "that's the play of the tournament"
    ];
    var escapeHtml = function (str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };
    var addChatMessage = function (name, text, mine) {
      var row = document.createElement("div");
      row.className = "chat-msg";
      row.innerHTML =
        '<div class="cm-avatar"></div><div><span class="cm-name' +
        (mine ? " green" : "") +
        '">' +
        escapeHtml(name) +
        ':</span><span class="cm-text">' +
        escapeHtml(text) +
        "</span></div>";
      chatBody.appendChild(row);
      chatBody.scrollTop = chatBody.scrollHeight;
    };

    chatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = chatForm.querySelector("input");
      if (!input || !input.value.trim()) return;
      var text = input.value.trim();
      input.value = "";
      addChatMessage("You", text, true);
      /* When backend is ready: MAC.api('/api/chat', { method:'POST', body:{ message: text } }) */
    });

    if (!reduceMotion) {
      window.setInterval(function () {
        var name = chatNames[Math.floor(Math.random() * chatNames.length)];
        var line = chatLines[Math.floor(Math.random() * chatLines.length)];
        addChatMessage(name, line, false);
      }, 4200);
    }
  }

  /* clear invalid state as user types */
  document.querySelectorAll(".field input, .field textarea, .field select").forEach(function (input) {
    input.addEventListener("input", function () {
      var field = input.closest(".field");
      if (field) field.classList.remove("invalid");
    });
  });

  /* =========================================================
     PROFILE PAGE — tabs + settings form
     ========================================================= */
  var profileTabs = document.querySelectorAll(".profile-tab");
  if (profileTabs.length) {
    var panels = document.querySelectorAll(".tab-panel");
    var activateProfileTab = function (name) {
      profileTabs.forEach(function (t) {
        t.classList.toggle("active", t.getAttribute("data-tab") === name);
      });
      panels.forEach(function (p) {
        p.classList.toggle("active", p.id === "panel-" + name);
      });
    };
    profileTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activateProfileTab(tab.getAttribute("data-tab"));
      });
    });
  }

  var settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = settingsForm.querySelector(".settings-save-btn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Saving…";
      }
      var payload = {
        displayName: (document.getElementById("displayName") || {}).value,
        handle: (document.getElementById("handle") || {}).value,
        email: (document.getElementById("emailSetting") || {}).value,
        currentPassword: (document.getElementById("currentPw") || {}).value,
        newPassword: (document.getElementById("newPw") || {}).value
      };
      MAC.api("/api/profile", { method: "PUT", body: payload })
        .then(function () {
          if (btn) btn.textContent = "Saved";
          window.setTimeout(function () {
            if (btn) {
              btn.textContent = "Save Changes";
              btn.disabled = false;
            }
          }, 1200);
        })
        .catch(function () {
          if (btn) {
            btn.textContent = "Save Changes";
            btn.disabled = false;
          }
        });
    });
  }
})();
