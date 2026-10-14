/* CST Assistant: a small rule-based chatbot that answers from the website's own content. */
(function () {
  var TOPICS = [
    {
      keys: ["hello", "hi", "hey", "salom", "privet", "good morning", "good afternoon"],
      answer: "Hello! I'm the CST Assistant. Ask me about admissions, academics, the campus, student life, events or how to contact us.",
      links: []
    },
    {
      keys: ["admission", "apply", "application", "enrol", "enroll", "join", "register", "how do i get in"],
      answer: "Admissions is a five-step conversation: <b>Enquire</b>, <b>Visit Campus</b>, <b>Apply</b> (transcripts, ID and two photos), <b>Assessment</b> (English and maths placement from Grade 1, plus a family interview) and <b>Enrolled</b>. Applications are rolling, and High School seats are limited, so apply early.",
      links: [["Admissions", "admissions.html"]]
    },
    {
      keys: ["mid-year", "mid year", "midyear", "transfer", "join late"],
      answer: "Yes, mid-year entry is possible when seats remain in the year group. Admissions will review your child's records and advise on timing.",
      links: [["Contact Admissions", "contact.html"]]
    },
    {
      keys: ["document", "paper", "transcript", "records", "what do i need"],
      answer: "Typically identification documents, recent school records or transcripts, and two photos. Admissions will guide you step by step.",
      links: [["Admissions", "admissions.html"]]
    },
    {
      keys: ["tour", "visit", "open house", "see the school", "see the campus"],
      answer: "You can register for the next Open House or ask for a private tour. Contact us and we'll confirm a time with you directly.",
      links: [["Book a Tour", "contact.html"]]
    },
    {
      keys: ["fee", "tuition", "price", "cost", "how much", "scholarship"],
      answer: "Fees aren't listed on this website. Please email admissions@canadianschool.uz or call +998 77 777 85 85 and the team will send you the details.",
      links: [["Contact", "contact.html"]]
    },
    {
      keys: ["start", "first day", "term", "begin", "when does school", "calendar", "2026"],
      answer: "The 2026–2027 school year began on Wednesday, 2 September 2026, the day after Independence Day.",
      links: [["Admissions", "admissions.html"]]
    },
    {
      keys: ["nova scotia", "diploma", "canadian", "canada", "pathway", "university", "graduate", "graduation"],
      answer: "Grades 10–12 follow the Nova Scotia provincial curriculum (Pre-Calculus, Chemistry, Physics, Biology, Canadian History, Global Politics and more). Graduates can leave with three qualifications: the <b>Nova Scotia High School Diploma</b>, the <b>Uzbekistan National Certificate</b> and the <b>CST Diploma</b>.",
      links: [["Nova Scotia Pathway", "academics.html#nova-scotia"]]
    },
    {
      keys: ["future", "coding", "ai", "robot", "technology", "web design", "cyber", "course"],
      answer: "Future-Ready Studies are mandatory, not optional extras: Web Design, Photo/Video &amp; Content, Vibe Coding &amp; App Design, Robotics, Digital Media &amp; Animation, AI Literacy &amp; Cyber Security, Philosophy &amp; Ethics, Effective Communication, Personal Finance and University Guidance.",
      links: [["Future-Ready Studies", "academics.html#future-ready"]]
    },
    {
      keys: ["grade", "age", "primary", "middle", "high school", "kindergarten", "k-12", "k–12", "journey", "academic", "curriculum", "subject"],
      answer: "CST is one continuous K–12 school: <b>Lower Primary</b> (K–2, ages 5–8), <b>Upper Primary</b> (3–5, ages 8–11), <b>Middle School</b> (6–9, ages 11–15) and <b>High School</b> (10–12, ages 15–18). The core is English, Maths, Science and Social Studies, alongside languages, arts and Future-Ready Studies.",
      links: [["The Journey, Ages 5–18", "academics.html#journey"]]
    },
    {
      keys: ["language", "russian", "uzbek", "english", "trilingual"],
      answer: "Russian starts in Kindergarten and Uzbek in Grade 3, so students grow up trilingual alongside English. The office team speaks English, Russian and Uzbek.",
      links: [["Academics", "academics.html"]]
    },
    {
      keys: ["timetable", "schedule", "period", "lesson time", "hours of school", "school day"],
      answer: "A typical day: breakfast 08:00, homeroom 08:30, six periods through to 15:45, then an after-school activity 16:05–17:00. The Grade 12 weekly timetable is on the Academics page.",
      links: [["Weekly Timetable", "academics.html"]]
    },
    {
      keys: ["class size", "teacher", "ratio", "small class"],
      answer: "Class sizes are capped at twenty so every child is known by name, and teachers eat lunch with students and attend their concerts.",
      links: [["About CST", "about.html"]]
    },
    {
      keys: ["campus", "facility", "facilities", "lab", "library", "gym", "studio", "building"],
      answer: "One campus serves the whole school: three science labs, a library, an Innovation &amp; Robotics Lab (3D printers, electronics), a content studio, a podcast studio, a VR lab and a dining hall. On Fridays students train at a partner gym.",
      links: [["Our Campus", "campus.html"]]
    },
    {
      keys: ["food", "lunch", "breakfast", "dining", "cafeteria", "meal", "vegetarian", "snack", "eat"],
      answer: "Meals are cooked in the school's own kitchen: breakfast at 8:00, a full hot lunch at 12:30 with a vegetarian main every day, and snacks to bridge energy gaps.",
      links: [["Dining &amp; Cafeteria", "campus.html"]]
    },
    {
      keys: ["sport", "football", "swim", "basketball", "tennis", "athletic", "gymnasium"],
      answer: "Students play football, basketball and volleyball, plus swimming, athletics, gymnastics, martial arts and mountain trips. Every Friday all students train at a partner gym (football, tennis, swimming, badminton, basketball).",
      links: [["Student Life", "student-life.html"]]
    },
    {
      keys: ["club", "activity", "activities", "after school", "after-school", "mun", "model un", "art", "music", "choir", "volunteer", "student life"],
      answer: "Every student commits to at least one co-curricular activity a year. Options include sports, arts and performance, FIRST LEGO League and FIRST Tech Challenge robotics, Model UN, volunteering and supervised after-school study.",
      links: [["Student Life", "student-life.html"]]
    },
    {
      keys: ["event", "upcoming", "happening", "what's on", "whats on", "parent-teacher", "conference", "track", "remembrance"],
      answer: "Upcoming events: Musical Theatre Rehearsal (Oct 19), Parent–Teacher Conferences (Oct 23, 2–6 pm), Intramurals (Oct 27), District Track Meet (Oct 29), Robotics Club Showcase (Nov 3) and the Remembrance Day Assembly (Nov 6).",
      links: [["Upcoming Events", "index.html#events"]]
    },
    {
      keys: ["news", "medal", "olympiad", "greenwich", "latest", "award"],
      answer: "Recent news: the 2026–2027 year began on 2 September; seven projects won twelve medals (2 gold, 4 silver, 6 bronze) at the Greenwich Olympiad in London; and nine graduates of the Class of 2026 received their diplomas on 13 June.",
      links: [["News", "news.html"]]
    },
    {
      keys: ["mission", "vision", "value", "motto", "about", "history", "founded", "who are you", "what is cst"],
      answer: "Canadian School of Tashkent (CST), founded in 2022, is Uzbekistan's first Canadian school. Our mission: <i>in the spirit of excellence and collaboration, fostering curiosity and character in every student, every day.</i> Core values: Curiosity, Excellence, Responsibility, Collaboration.",
      links: [["About CST", "about.html"]]
    },
    {
      keys: ["licen", "accredit", "recognis", "recogniz", "cis", "council of international"],
      answer: "CST is licensed by Uzbekistan's Ministry of Preschool and School Education (K–12), Grades 10–12 are licensed by the Province of Nova Scotia, and the school is a member of the Council of International Schools (CIS).",
      links: [["Licenses", "about.html#licenses"]]
    },
    {
      keys: ["principal", "director", "leader", "head", "staff", "rahmani", "poirier"],
      answer: "Leadership: Meena Rahmani (Executive Director), Ramish Rahmani (Operations Director) and Mr. Roch-Alain Poirier (High School Nova Scotia Program Principal).",
      links: [["Leadership", "about.html#leadership"]]
    },
    {
      keys: ["nationalit", "international", "students from", "diverse"],
      answer: "Thirty-four nationalities learn side by side at CST.",
      links: [["About CST", "about.html"]]
    },
    {
      keys: ["contact", "phone", "call", "email", "mail", "address", "where", "location", "map", "office", "open", "reach"],
      answer: "📍 4 Ferghana Yuli, Mirabad District, Tashkent<br>📞 +998 77 777 85 85<br>✉️ admissions@canadianschool.uz<br>🕗 Office hours: Mon–Fri, 8:30 AM – 5:00 PM. We reply within one working day.",
      links: [["Contact", "contact.html"]]
    },
    {
      keys: ["thank", "thanks", "rahmat", "spasibo", "bye"],
      answer: "You're welcome! Anything else I can help with?",
      links: []
    }
  ];

  var SUGGESTIONS = ["How do I apply?", "Tell me about Nova Scotia", "What's on campus?", "Upcoming events", "Contact details"];
  var FALLBACK = "I'm not sure about that one. Try asking about admissions, academics, campus, student life, events or contact details, or reach the team at admissions@canadianschool.uz.";

  function normalize(s) {
    return " " + s.toLowerCase().replace(/[^a-z0-9Ѐ-ӿ'–\- ]/g, " ").replace(/\s+/g, " ") + " ";
  }

  function reply(text) {
    var q = normalize(text);
    var best = null, bestScore = 0;
    TOPICS.forEach(function (t) {
      var score = 0;
      t.keys.forEach(function (k) {
        // short keys must match whole words so "ai" doesn't hit "admission"
        var hit = k.length <= 3 ? q.indexOf(" " + k + " ") !== -1 : q.indexOf(k) !== -1;
        if (hit) score += k.length;
      });
      if (score > bestScore) { best = t; bestScore = score; }
    });
    return best || { answer: FALLBACK, links: [["Contact", "contact.html"]] };
  }

  var root = document.createElement("div");
  root.className = "cb";
  root.innerHTML =
    '<button type="button" class="cb-launch" id="cbLaunch" aria-label="Open chat assistant" aria-expanded="false" aria-controls="cbPanel">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/></svg>' +
    '</button>' +
    '<div class="cb-panel" id="cbPanel" role="dialog" aria-label="CST Assistant" hidden>' +
      '<header class="cb-head"><div><strong>CST Assistant</strong><span>Ask about the school</span></div>' +
      '<button type="button" class="cb-close" id="cbClose" aria-label="Close chat">✕</button></header>' +
      '<div class="cb-log" id="cbLog" aria-live="polite"></div>' +
      '<div class="cb-chips" id="cbChips"></div>' +
      '<form class="cb-form" id="cbForm" autocomplete="off">' +
        '<input type="text" id="cbInput" placeholder="Type your question…" aria-label="Your question" maxlength="200">' +
        '<button type="submit" aria-label="Send">➤</button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  var launch = document.getElementById("cbLaunch");
  var panel = document.getElementById("cbPanel");
  var log = document.getElementById("cbLog");
  var chips = document.getElementById("cbChips");
  var form = document.getElementById("cbForm");
  var input = document.getElementById("cbInput");
  var greeted = false;

  function addMsg(html, who, isText) {
    var d = document.createElement("div");
    d.className = "cb-msg " + who;
    if (isText) d.textContent = html; else d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function addBot(topic) {
    var html = topic.answer;
    if (topic.links && topic.links.length) {
      html += '<div class="cb-links">' + topic.links.map(function (l) {
        return '<a href="' + l[1] + '">' + l[0] + " →</a>";
      }).join("") + "</div>";
    }
    addMsg(html, "bot");
  }

  function ask(text) {
    text = text.trim();
    if (!text) return;
    addMsg(text, "user", true);
    var typing = addMsg("…", "bot typing", true);
    setTimeout(function () {
      typing.remove();
      addBot(reply(text));
    }, 350);
  }

  function setOpen(open) {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", open ? "true" : "false");
    root.classList.toggle("open", open);
    if (open) {
      if (!greeted) {
        greeted = true;
        addMsg("Hi! 👋 I'm the CST Assistant. I can answer questions using the information on this website.", "bot");
      }
      input.focus();
    } else {
      launch.focus();
    }
  }

  SUGGESTIONS.forEach(function (s) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = s;
    b.addEventListener("click", function () { ask(s); });
    chips.appendChild(b);
  });

  launch.addEventListener("click", function () { setOpen(panel.hidden); });
  document.getElementById("cbClose").addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) setOpen(false);
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = "";
    ask(v);
  });
})();
