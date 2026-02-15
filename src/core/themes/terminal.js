const classicTheme = require('./classic');

function getStyles() {
  return `
    ${classicTheme.getStyles()}

    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

    body {
      font-family: 'IBM Plex Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
      background: #0b0f10;
      color: #9ff7b0;
      text-shadow: 0 0 0.45px rgba(159, 247, 176, 0.45);
      padding: 8px;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body.compact-layout {
      padding: 8px;
    }

    .content-wrapper {
      background: linear-gradient(180deg, #0f1517 0%, #0b0f10 100%);
      border: 2px solid #1f4c31;
      border-radius: 12px;
      padding: 22px 22px 14px;
      box-shadow: inset 0 0 0 1px rgba(45, 118, 78, 0.25), 0 8px 24px rgba(0, 0, 0, 0.35);
      position: relative;
      overflow: hidden;
    }

    .content-wrapper::before {
      content: '';
    }

    .content-wrapper > * {
      position: relative;
      z-index: 1;
    }

    header {
      border-bottom: 1px solid #2e6f4a;
    }

    h1 {
      color: #d8ffe1;
      letter-spacing: -0.2px;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    }

    .title {
      color: #82d998;
      font-style: normal;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    }

    .bio,
    .contact-item,
    .company,
    .institution,
    li,
    .project-description,
    .cert-item,
    .award-item {
      color: #9ff7b0;
    }

    .bio {
      color: #7fd793;
    }

    .contact-item a {
      color: #a6ffb9;
    }

    .contact-item i,
    .date-location,
    .project-link-line,
    .project-link,
    .language-level {
      color: #67f088;
    }

    .project-link:hover,
    a:hover {
      color: #c6ffd2;
      text-decoration-color: #67f088;
    }

    h2 {
      color: #86ffa3;
      border-bottom: 1px solid #2e6f4a;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      position: relative;
      padding-left: 13px;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    }

    h2::before {
      content: '>';
      position: absolute;
      left: 0;
      color: #67f088;
      font-weight: 700;
    }

    .experience-item,
    .education-item,
    .project-item {
      border-left: 1px solid #2e6f4a;
      padding-left: 14px;
    }

    .position,
    .degree,
    .project-name {
      color: #d8ffe1;
    }

    .education-level,
    .technologies {
      color: #7fd793;
    }

    .skill-tag {
      background: #102117;
      border: 1px solid #2a6443;
      color: #98f0ad;
      border-radius: 3px;
    }

    .skill-category {
      background: #101b14;
      border: 1px solid #1f4a31;
    }

    .skill-category h3 {
      color: #84f7a0;
    }

    .profile-photo {
      border: 3px solid #2e6f4a;
      box-shadow: 0 0 0 1px rgba(110, 233, 137, 0.2), 0 0 16px rgba(80, 200, 120, 0.2);
      border-radius: 6px;
      filter: grayscale(10%) contrast(1.06);
    }

    .languages-grid,
    .certifications-grid,
    .awards-grid {
      border-left: 1px solid #2e6f4a;
      padding-left: 14px;
    }

    .header-name::before,
    .sidebar-name::before {
      content: '$ whoami';
      display: block;
      margin-bottom: 6px;
      font-size: 11px;
      letter-spacing: 0.25px;
      color: #67f088;
      font-weight: 600;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    }

    body.sidebar-layout {
      background: #0b0f10;
      color: #9ff7b0;
    }

    body.sidebar-layout .sidebar-bg {
      background: linear-gradient(180deg, #102117 0%, #0b0f10 100%);
    }

    body.sidebar-layout .sidebar {
      color: #a0f6b2;
    }

    body.sidebar-layout .sidebar-name h1 {
      color: #d8ffe1;
    }

    body.sidebar-layout .sidebar-name .title {
      color: #7fd793;
      font-style: normal;
    }

    body.sidebar-layout .sidebar-contacts {
      border-bottom-color: rgba(103, 240, 136, 0.28);
    }

    body.sidebar-layout .sidebar-contacts .contact-item,
    body.sidebar-layout .sidebar-contacts .contact-item a {
      color: #a6ffb9;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    }

    body.sidebar-layout .sidebar-contacts .contact-item i {
      color: #67f088;
    }

    body.sidebar-layout .sidebar-bio .bio {
      color: #7fd793;
    }

    body.sidebar-layout .main-content {
      background: #0f1517;
      color: #9ff7b0;
    }

    body.sidebar-layout .main-content h2 {
      border-bottom-color: #2e6f4a;
      color: #86ffa3;
    }

    body.sidebar-layout .main-content .experience-item,
    body.sidebar-layout .main-content .education-item,
    body.sidebar-layout .main-content .project-item {
      border-left-color: #2e6f4a;
    }

    body.sidebar-layout .main-content .position,
    body.sidebar-layout .main-content .degree,
    body.sidebar-layout .main-content .project-name {
      color: #d8ffe1;
    }

    body.sidebar-layout .main-content .company,
    body.sidebar-layout .main-content .institution,
    body.sidebar-layout .main-content li,
    body.sidebar-layout .main-content .project-description,
    body.sidebar-layout .main-content .projects-intro {
      color: #9ff7b0;
    }

    body.sidebar-layout .main-content .education-level,
    body.sidebar-layout .main-content .technologies {
      color: #7fd793;
    }

    body.sidebar-layout .main-content .date-location,
    body.sidebar-layout .main-content .project-link-line,
    body.sidebar-layout .main-content .project-link {
      color: #67f088;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    }

    body.sidebar-layout .main-content .skill-category {
      background: #101b14;
      border-color: #1f4a31;
    }

    body.sidebar-layout .main-content .skill-tag {
      background: #102117;
      border-color: #2a6443;
      color: #98f0ad;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    }

    .gdpr-watermark {
      color: #4f8f66;
    }

    @media print {
      body {
        background: #0b0f10;
        color: #9ff7b0;
        text-shadow: 0 0 0.45px rgba(159, 247, 176, 0.45);
        padding: 8px;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      body.compact-layout {
        padding: 8px;
      }

      .content-wrapper {
        background: linear-gradient(180deg, #0f1517 0%, #0b0f10 100%);
        border-color: #1f4c31;
        box-shadow: inset 0 0 0 1px rgba(45, 118, 78, 0.25), 0 8px 24px rgba(0, 0, 0, 0.35);
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .content-wrapper::before {
        color: #67f088;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `;
}

module.exports = { name: 'terminal', getStyles, monochromatic: true };
