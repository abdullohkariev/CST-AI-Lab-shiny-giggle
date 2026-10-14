(function () {
  var form = document.getElementById("searchForm");
  var input = document.getElementById("searchInput");
  var clearBtn = document.getElementById("searchClear");
  var status = document.getElementById("searchStatus");
  var hits = [];
  var current = -1;

  // Parts of the page that are searched
  var areas = document.querySelectorAll(".hero, .page-hero, .stats, section, footer");

  function clearHighlights() {
    document.querySelectorAll("mark.hit").forEach(function (m) {
      var parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
    hits = [];
    current = -1;
  }

  function highlight(query) {
    var re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    areas.forEach(function (area) {
      var walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var tag = n.parentNode.nodeName;
          if (tag === "SCRIPT" || tag === "STYLE" || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          // Skip text the visitor cannot see (e.g. events hidden by a filter)
          if (n.parentNode.closest("[hidden]")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        var text = node.nodeValue;
        re.lastIndex = 0;
        if (!re.test(text)) return;
        re.lastIndex = 0;
        var frag = document.createDocumentFragment();
        var last = 0, m;
        while ((m = re.exec(text)) !== null) {
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var mark = document.createElement("mark");
          mark.className = "hit";
          mark.textContent = m[0];
          frag.appendChild(mark);
          hits.push(mark);
          last = m.index + m[0].length;
        }
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
    });
  }

  function goTo(i) {
    if (!hits.length) return;
    if (current >= 0) hits[current].classList.remove("current");
    current = (i + hits.length) % hits.length;
    hits[current].classList.add("current");
    hits[current].scrollIntoView({ behavior: "smooth", block: "center" });
    status.textContent = "Result " + (current + 1) + " of " + hits.length +
      " — press Enter for the next one.";
  }

  function runSearch() {
    var query = input.value.trim();
    clearHighlights();
    clearBtn.hidden = input.value === "";
    if (!query) { status.textContent = ""; return; }
    highlight(query);
    if (!hits.length) {
      status.textContent = "No results found for “" + query + "”. Try another word.";
    } else {
      goTo(0);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // Enter on the same query jumps to the next match
    if (hits.length && input.value.trim().toLowerCase() === (hits[0].textContent || "").toLowerCase()) {
      goTo(current + 1);
    } else {
      runSearch();
    }
  });

  input.addEventListener("input", function () {
    clearBtn.hidden = input.value === "";
    if (input.value.trim() === "") { clearHighlights(); status.textContent = ""; }
  });

  clearBtn.addEventListener("click", function () {
    input.value = "";
    clearHighlights();
    status.textContent = "";
    clearBtn.hidden = true;
    input.focus();
  });
})();

/* ---------- Navigation: smooth scroll, active link, mobile menu ---------- */
(function () {
  var header = document.querySelector(".topbar");
  var nav = document.getElementById("mainNav");
  var toggle = document.getElementById("menuToggle");
  function headerHeight() { return header.offsetHeight; }

  function scrollToTarget(target) {
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight() - 12;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

  function closeMenu() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  // Smooth scroll for links that point to a spot on the current page
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("a[href*='#']").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href");
      var parts = href.split("#");
      var file = parts[0] || here;
      if (file !== here) return; // other page: let the browser navigate
      var id = "#" + parts[1];
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
      if (history.pushState) history.pushState(null, "", id);
      closeMenu();
    });
  });

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Land on a deep link (page.html#section) with the sticky header offset
  if (location.hash.length > 1) {
    var deep = document.querySelector(location.hash);
    if (deep) setTimeout(function () { scrollToTarget(deep); }, 250);
  }
})();

/* ---------- Polish: scroll progress bar + reveal animations ---------- */
(function () {
  var bar = document.createElement("div");
  bar.className = "progress";
  document.body.appendChild(bar);
  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.pageYOffset / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", progress, { passive: true });
  progress();

  if (!("IntersectionObserver" in window)) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  document.documentElement.classList.add("js");
  var items = document.querySelectorAll(
    ".card, .tile, .step, .stat, .chip, .section-head, .callout, .contact-item, .about-visual, .about-text, .search-box"
  );
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add("in");
      io.unobserve(el);
      // drop the reveal classes afterwards so hover effects work normally
      setTimeout(function () {
        el.classList.remove("reveal", "in");
        el.style.transitionDelay = "";
      }, 1200);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

  items.forEach(function (el, i) {
    el.classList.add("reveal");
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    io.observe(el);
  });
})();

/* ---------- Upcoming events: category filter ---------- */
(function () {
  var buttons = document.querySelectorAll(".filter-btn");
  var events = document.querySelectorAll(".event");
  var empty = document.getElementById("eventEmpty");
  if (!buttons.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      buttons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var shown = 0;
      events.forEach(function (ev) {
        var match = filter === "all" || ev.getAttribute("data-category") === filter;
        ev.hidden = !match;
        if (match) shown++;
      });
      empty.hidden = shown > 0;
    });
  });
})();
