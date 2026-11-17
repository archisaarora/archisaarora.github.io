/* ------------------------------------------------------------------
   All site content lives in this one file.
   Add a project: push an object onto `projects`. Set `demo` to the id a file in js/demos/
   registers, or leave it out for a project with no live demo.
------------------------------------------------------------------ */
window.PORTFOLIO = {
  profile: {
    name: "Archisa Arora",
    line: "Software engineer studying computer science at Penn. I build backend systems and secure hardware, and I co-direct the club that builds Penn's rockets.",
    email: "archisaarora@gmail.com",
    github: "https://github.com/archisaarora",
    linkedin: "https://linkedin.com/in/archisaarora",
    resumePdf: "assets/Archisa_Arora_Resume.pdf"
  },

  /* The first screen. Keep these short: the projects below do the talking. */
  hero: {
    tagline: "I build software for fintech, defense and robotics, where innovation moves fastest and the problems are worth solving.",
    facts: [
      "Computer science + statistics at Penn",
      "Backend and software development intern at Smart Twigs and Altheros Capital",
      "Co-director of Penn Aerospace Club"
    ],
    highlights: [
      { big: "180+", small: "members across the four build teams I co-direct" },
      { big: "3rd", small: "Citadel & Citadel Securities trading challenge at Penn" },
      { big: "Top 6", small: "a16z NYC Tech Week hackathon" },
      { big: "200+", small: "students in the organization SwipeMeet was built for" }
    ],
    /* The three links under the highlights: leadership under the first, awards under the middle two, projects under the last. */
    more: [
      { text: "See more leadership", href: "#resume-leadership" },
      { text: "See more awards", href: "#resume-awards" },
      { text: "See more projects", href: "#work" }
    ]
  },

  /* Skills, sorted by type. Shown as boxes near the bottom of the page and at the end of the resume. */
  skills: [
    { group: "Languages", items: ["TypeScript", "Python", "Java", "C++", "JavaScript", "SQL"] },
    { group: "Frameworks", items: ["Next.js", "React", "React Native", "FastAPI", "Flask", "Laravel", "PyQt5"] },
    { group: "Databases and data", items: ["PostgreSQL", "Supabase", "SQLAlchemy", "Firebase", "pandas", "scikit-learn"] },
    { group: "DevOps and cloud", items: ["Cloudflare R2", "Cloudflare Stream", "AWS EC2"] },
    { group: "Security and APIs", items: ["JWT auth", "Row-level security", "REST API design", "Webhooks", "WebSockets"] },
    { group: "Testing", items: ["Vitest", "Playwright", "PGlite"] },
    { group: "Hardware and embedded", items: ["Raspberry Pi", "Teensy / FreeRTOS", "LoRa telemetry", "UART", "PWM servo control"] }
  ],

  /* Every project in the Work deck. `demo` is the id a file in js/demos/ registers.
     `wide: true` gives the demo the full width. `tag` is the short label on its tab. */
  projects: [
    {
      id: "swipemeet", name: "SwipeMeet", tag: "Full stack", status: "Full-stack web app", resume: true,
      hook: "Helps Penn students meet across grades over a dining-hall guest swipe.",
      /* Bullets shown on the Resume tab. */
      resumePoints: [
        "Deployed a full-stack dining-swipe matching platform for a 200+ member Penn student organization (Hack4Impact), pairing students through role-based Swiper/Guest profiles and real-time private chat, which led to 10+ meals being scheduled",
        "Built a PostgreSQL backend on Supabase with 35+ row-level security policies and database triggers that enforce access control, anti-spam rate limits and profanity masking at the database layer, plus passwordless OTP authentication restricted to @upenn.edu",
        "Engineered a meal-scheduling flow where users propose, accept and rate meals, with an interactive Leaflet map of the dining halls and one-click Google Calendar/.ics export, all tested with Vitest, in-memory Postgres (PGlite) and Playwright end-to-end tests"
      ],
      summary: "Guests, usually upperclassmen who would like to be swiped in, post when they are free for a meal. Swipers, usually underclassmen with guest swipes to share, browse those posts and send a short request.",
      built: [
        "Accepting a request opens a private chat that updates live, where either person proposes a date, time and dining hall",
        "After the meal each person rates the other (1 to 5 stars plus an optional note); ratings show on profiles and in Browse",
        "Explicit, sexual and rude language is masked everywhere members write, enforced in the database",
        "Anyone with a verified @upenn.edu email can join and choose a role; moderators can remove members who misuse the site"
      ],
      /* Each entry is [technology, what it does in this project]. */
      stack: [
        ["Next.js", "pages and server routes"],
        ["TypeScript", "typed end to end"],
        ["Supabase Auth", "@upenn.edu email sign-in"],
        ["PostgreSQL", "35+ row-level security policies, triggers, language masking"],
        ["Supabase Storage", "file uploads"],
        ["Vitest", "unit tests on in-memory Postgres"],
        ["Playwright", "end-to-end tests"]
      ],
      links: [],
      demo: "swipemeet", demoLabel: "A small stand-in for the request flow",
      demoNote: "Made-up posts, to show how a Swiper browses and sends a request."
    },
    {
      id: "securesafe", name: "SecureSafe", tag: "Hardware", status: "Hardware project, explained step by step", resume: true,
      hook: "A door that wants a PIN and your fingerprint before it moves.",
      /* Bullets shown on the Resume tab. */
      resumePoints: [
        "Engineered a hardware-based IoT security system on Raspberry Pi using Python, biometric fingerprint sensors and dual servo motors, achieving sub-500ms end-to-end authentication latency across MFA (email PIN + fingerprint)",
        "Built a full-stack Flask/Firebase web application with role-based access control, an admin audit dashboard and 3-tier user management",
        "Open-sourced on GitHub with reproducible hardware documentation"
      ],
      summary: "A two-factor door lock on a Raspberry Pi: an emailed one-time PIN, then a fingerprint scan, then a servo drives a rack-and-pinion bolt. Senior capstone built with Nandini Venkatesh.",
      built: [
        "Flask backend that talks to an optical fingerprint sensor over UART and to servos through a PCA9685 PWM driver",
        "Firebase accounts with role-based access, root approval of new users and a login audit dashboard",
        "One-time PINs generated with Python's secrets module and delivered over SMTP"
      ],
      stack: [
        ["Python", "all backend logic"],
        ["Flask", "web app and API"],
        ["Firebase", "accounts, roles and login logs"],
        ["UART", "talks to the fingerprint sensor"],
        ["SMTP", "emails the one-time PIN"],
        ["Raspberry Pi", "runs the lock and drives the servos"]
      ],
      links: [{ text: "Code on GitHub", href: "https://github.com/archisaarora/SecureSafe" }],
      demo: "securesafe", demoLabel: "How it works: a walkthrough, not the real app",
      demoNote: "The real system is a physical door. This replays its four steps so you can see the flow."
    },
    {
      id: "cotraveler", name: "Co-traveler detection", tag: "Research", status: "Research, shown on synthetic data",
      hook: "Finds who is travelling together in a million location pings.",
      summary: "Finding people who move together in spatiotemporal location data, from a research internship in NJIT's data science department with Professor David Bader.",
      built: [
        "Pipelines that preprocess over a million location pings into per-entity paths",
        "Indexing and query strategies that cut similarity-search latency across experiments",
        "Validation against a labelled ground-truth set (100 ft, 10 s)"
      ],
      stack: [
        ["Python", "the whole pipeline"],
        ["pandas", "loads and reshapes the pings"],
        ["scikit-learn KDTree", "nearby-point search"],
        ["NetworkX", "co-travel graph"]
      ],
      links: [{ text: "Code on GitHub", href: "https://github.com/archisaarora/Archisa-Cotraveler-Algorithm" }],
      demo: "cotraveler", demoLabel: "The detector running on simulated walkers",
      demoNote: "The research data isn't public, so the walkers are simulated with a few hidden groups. Precision and recall are computed against that ground truth."
    },
    {
      id: "telemetry", name: "Rocket telemetry", tag: "Aerospace software", status: "Aerospace software, Penn rocketry team", wide: true, resume: true,
      hook: "The data link for Penn's rocket: from packets leaving the flight computer to a live dashboard on the ground.",
      /* Bullets shown on the Resume tab. */
      resumePoints: [
        "Built the telemetry pipeline for Penn's rocketry team in C++ and Python: a CRC-16-checked binary protocol (41-byte state packets at 5 Hz, 90-byte health packets at 1 Hz) sent from a FreeRTOS flight computer over a LoRa radio link",
        "Wrote a Python ground station that decodes packets, logs every field to CSV and serves live JSON over WebSocket and HTTP, with flight replay and a hardware-free simulation mode for development",
        "Developed a PyQt5/pyqtgraph dashboard with five live views (flight, sensors, state estimator, 3D OpenGL trajectory, system health) plus past-launch review for checking sensor calibration"
      ],
      summary: "For Penn's rocketry team I built the path the data takes: the packets the flight computer sends over the radio, the ground station that decodes and serves them, and the dashboard the team watches during a flight and uses afterwards to review past launches and check calibration. It runs alongside the team's FreeRTOS flight computer on a Teensy 4.1.",
      built: [
        "Packed binary packets in C++ with sequence numbers and a CRC-16: a 41-byte state packet at 5 Hz and a 90-byte health packet at 1 Hz, over a 427.76 MHz LoRa link",
        "Python ground station that reads the receiver over USB, decodes each packet once, logs everything to CSV and serves JSON over WebSocket and HTTP",
        "PyQt5 dashboard with five tabs: flight graphs, raw sensors, estimator against barometer and GPS, a 3D trajectory with live attitude, and system health with link statistics and packet loss",
        "Past-launch saving and CSV replay, so earlier flights can be reviewed and calibration checked",
        "A simulated-flight mode and a host test that encodes with the firmware code and decodes with the Python module, to confirm both sides agree byte for byte"
      ],
      stack: [
        ["C++", "packet encoder on the flight computer"],
        ["Python", "ground station and dashboard"],
        ["PyQt5 + pyqtgraph", "live plots and tabs"],
        ["PyOpenGL", "3D trajectory and attitude"],
        ["WebSocket / HTTP", "JSON API from the ground station"],
        ["LoRa (RFM95)", "radio link, 427.76 MHz"],
        ["FreeRTOS on Teensy 4.1", "the flight computer it runs with"],
        ["Arduino", "receiver bridge firmware"]
      ],
      links: [
        { text: "Dashboard on GitHub", href: "https://github.com/UPennRocketry/live-telemetry-dashboard-v2" },
        { text: "Flight computer and ground station on GitHub", href: "https://github.com/UPennRocketry/flightcomputer-v3-rtos" }
      ],
      demo: "telemetry", demoLabel: "A simulated flight sent through the real packet format",
      demoNote: "The flight is invented. Each packet uses the same 41-byte layout and CRC-16 as the real system, crosses a lossy pretend radio, and is decoded and plotted here. The real dashboard is a desktop app."
    },
    {
      id: "digidetect", name: "DigiDetect", tag: "Machine learning", status: "Machine learning", wide: true, resume: true,
      hook: "Teaching a computer to read my handwriting, with a neural network I built from scratch.",
      /* Bullets shown on the Resume tab. */
      resumePoints: [
        "Implemented a 13,000-parameter neural network from scratch in JavaScript (forward propagation, backpropagation, softmax cross-entropy, momentum SGD) with no ML framework",
        "Reached 95% accuracy on 1,000 held-out MNIST digits after 2.4 seconds of in-browser training on 5,000 examples, with an option to train on the full 60,000-image dataset",
        "Built an interactive site to train the model, compare hidden-layer sizes (32, 64, 128) and classify hand-drawn digits, backed by tests that check backpropagation against numerical gradients"
      ],
      summary: "I wanted to understand what actually happens inside a neural network instead of calling a library and getting a prediction back, so I built one: a multilayer perceptron that learns to recognize handwritten digits from 0 to 9.",
      built: [
        "Forward propagation, backpropagation and mini-batch gradient descent written by hand in JavaScript",
        "Experiments with hidden-layer sizes of 32, 64 and 128 neurons",
        "Trained on MNIST, tracking training loss and test accuracy as the model learns",
        "A drawing pad to write your own digits and see what the model predicts"
      ],
      stack: [
        ["JavaScript", "the network, written by hand"],
        ["HTML / CSS", "training view and drawing pad"],
        ["MNIST", "handwritten digit dataset"],
        ["Node.js", "runs the tests"]
      ],
      links: [{ text: "Code on GitHub", href: "https://github.com/archisaarora/DigiDetect" }],
      demo: "digidetect", demoLabel: "Training in your browser right now",
      demoNote: "This panel uses the bundled sample of 6,000 MNIST digits at 14 by 14 pixels. The full project can also load all 70,000."
    }
  ],

  /* The Path timeline, newest first. kind "work" entries appear under Experience, "school" under Education. */
  experience: [
    {
      kind: "work", org: "Smart Twigs", role: "Software Engineering Intern", when: "May to November 2026", dates: "05/2026 – 11/2026",
      points: [
        "Built a zero-downtime migration of the platform's media storage to Cloudflare R2, with instant rollback and on-device resizing and compression to keep image traffic off the API server.",
        "Shipped photo and video posting end to end on Cloudflare Stream: an additive database schema, a direct-upload backend with a signature-verified webhook, and adaptive HLS playback.",
        "Redesigned the authentication layer of a Laravel and React Native social platform, unifying users, organizations and brands into one identity model with membership-based role permissions and per-request re-verification on the JWT."
      ]
    },
    {
      kind: "work", org: "Altheros Capital", role: "Backend Development Intern", when: "February to August 2026", dates: "02/2026 – 08/2026",
      points: [
        "Architected a FastAPI backend with a pluggable AI provider gateway supporting hot-swappable LLM integrations and per-request token accounting, backed by PostgreSQL/SQLAlchemy models for prompt templates, variants, delivery logs and response tracking.",
        "Built a prompt delivery engine with variant rotation, anti-repetition windowing and a multi-tier gateway fallback chain.",
        "Rebuilt authentication into a full JWT access and refresh token lifecycle with rotation, server-side revocation and hashed persistence, replacing a legacy UUID-session model.",
        "Standardized the REST API with global exception handlers and /v1 versioning, and wrote 127+ automated and smoke integration tests across auth, chat and prompt workflows."
      ]
    },
    {
      kind: "school", org: "University of Pennsylvania", role: "BSE in Computer Science, Minor in Statistics and Data Science", when: "2025 to present", dates: "2025 – Present",
      points: [
        "Coursework: Data Structures & Algorithms, Computer Systems, Applied Machine Learning, Linear Algebra, Statistics for Data Science, Probability, Automata & Time Complexity.",
        "Co-director of Penn Aerospace Club, President of Penn Undergraduate Women in AI, developer in Hack4Impact, Society of Women Engineers Advocacy Committee."
      ]
    },
    {
      kind: "work", org: "New Jersey Institute of Technology", role: "Research Intern", when: "April 2024 to June 2025", dates: "04/2024 – 06/2025",
      points: [
        "Designed data pipelines for preprocessing thousands of spatiotemporal mobility records to detect co-traveling entities, and optimized indexing and query strategies across large movement datasets.",
        "Mentored 5+ students on computational research methods and presented findings to 150+ scholars and faculty."
      ]
    },
    {
      kind: "school", org: "Middlesex County College", role: "Associate's in Mathematics", when: "2023 to 2025", dates: "2023 – 2025",
      points: ["Completed through the High School Scholars Program while in high school. Graduated with Highest Honors."]
    }
  ],

  resume: {
    education: [
      {
        title: "BSE in Computer Science, Minor in Statistics and Data Science",
        org: "University of Pennsylvania", when: "2025 – Present",
        detail: "Relevant coursework: Data Structures & Algorithms, Computer Systems, Applied Machine Learning, Linear Algebra, Statistics for Data Science, Probability, Automata & Time Complexity, Java, C++. Part of Penn's Society of Women Engineers Advocacy Committee. Developer in Hack4Impact."
      },
      {
        title: "Associate's in Mathematics",
        org: "Middlesex County College", when: "2023 – 2025",
        detail: "Completed through the High School Scholars Program. Graduated with Highest Honors."
      }
    ],
    leadership: [
      {
        title: "Co-director, Penn Aerospace Club", when: "05/2026 – Present",
        detail: "Manage four build teams (rocket, aircraft, weather balloon and jet engines) and 18 project groups with 180+ members. Work with the university administration on funding, machining and building approval. Manage communications with large tech companies to create direct recruiting pipelines. Host organization meetings, events and club recruiting."
      },
      {
        title: "President, Penn Undergraduate Women in AI", when: "05/2026 – Present",
        detail: "Manage a coalition of Penn women interested in AI and its applications. Host events and talks with industry workers for professional development."
      },
      {
        title: "Class President, Edison Academy Magnet School", when: "10/2022 – 06/2025",
        detail: "Raised $6000+ in a 176-person school. Set the precedent of class trips and hosted 20+ events by coordinating with student committees and administration at the local and regional level. Voiced student concerns at district board meetings. Won the district's Principal's Association Award."
      }
    ],
    awards: [
      ["Startup Internship Award", "University of Pennsylvania Venture Lab"],
      ["3rd Place, Interactive Trading Challenge at UPenn", "Citadel & Citadel Securities"],
      ["Finalist (Top 6), a16z NYC Tech Week Hackathon", "with Lightning AI and The Sentience Company"],
      ["National Merit Scholar", "1 of 2,500 scholars to win the $2,500 award out of 1.5 million applicants. Perfect score of 1520/1520."],
      ["10th Place National, Partnership with Business Project", "Future Business Leaders of America (FBLA)"],
      ["AWS EC2 Basics Certification", "Amazon Web Services"]
    ]
  }
};
