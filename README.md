![cre8ive.cv](assets/logo/logo_rectangle.png)

### JSON-based resume design studio for IT Professionals

>  *Transform JSON into stunning HTML/PDF resumes with complete control over your data*

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](package.json)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

---

## Overview

**cre8ive.cv** is a production-ready vibe coded resume generator that converts structured JSON data into beautifully styled resumes. Built for developers who value privacy, customization, and version control.

**Key Principles:**
- 🔒 **Privacy-First** — No accounts, no tracking cookies, client-side storage only
- 📝 **JSON-Driven** — Version control your resume like code
- 🎨 **Fully Customizable** — Custom HTML in any field, themes and color palettes included
- 🚀 **Dual Mode** — Both Web UI and CLI
- 🐳 **Self-hostable** —  Simple setup via Docker Compose
- 🧩 **Highly Extensible** — You can create your own themes and color palettes

---

## Features

**Core Functionality**

- ✨ Live WYSIWYG editor with real-time preview
- 📄 Export to PDF, HTML, JSON
- 🖼️ Photo support
- 🎯 Template gallery
- 🔄 Section management (toggle, reorder, rename)
- 💾 Auto-save to localStorage
- 🌐 Self-hostable

---

## Quick Start

### Docker deployment

```bash
docker compose up -d --build

# Open http://localhost:8003
```

### CLI (Batch Generation)

```bash
# Generate from JSON
node src/cli/index.js --input data/resume.json
```

---

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Analytics (optional)
ANALYTICS_ALLOWED_ORIGINS=http://localhost:8003,https://yourdomain.com
ANALYTICS_SERVER_KEY=your_key
ANALYTICS_CLIENT_TOKEN=your_token

# Cloudflare Turnstile (optional)
TURNSTILE_ENABLED=false/true
TURNSTILE_SECRET_KEY=your_secret_key

# Cluster management
CLUSTER_RESTART_HOURS=12
```

---

## FAQ

**Q: Where is my data stored?**

A: In your browser's `localStorage`. The server only renders PDFs, never stores personal data.

**Q: Can I use HTML in resume fields?**

A: Yes! All text fields support HTML markup. Example: `"bio": "Expert in <strong>React</strong>"`

**Q: How do I version control my resume?**

A: Export as JSON and commit to Git. Use CLI to regenerate PDFs from JSON.

**Q: Can I self-host?**

A: Absolutely. Docker deployment included. No external dependencies required.

**Q: Does it track users?**

A: No tracking cookies. Only Matomo anonymized traffic tracking and metadata collection (timestamp, theme, color etc.) For more read Terms&Conditions

**Q: Is thie README written with AI?**

A: Yes

---

## Contributing

Contributions welcome! This project is particularly well-suited for:
- 🎨 New themes and color palettes
- 📝 Additional resume templates
- 🔧 Bug fixes and performance improvements

