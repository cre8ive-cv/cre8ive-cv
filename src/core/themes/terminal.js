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

    @media (min-width: 701px) {
      body.compact-layout header {
        margin-bottom: 24px;
      }

      body.compact-layout section {
        padding-top: 6px;
      }

      body.compact-layout section:first-of-type {
        padding-top: 0;
      }
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
      margin-bottom: 28px;
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
      margin-top: 7px;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    }

    section:first-of-type h2 {
      margin-top: 0;
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
      line-height: 1.35;
    }

    body.sidebar-layout .sidebar-bg {
      background: linear-gradient(180deg, #102117 0%, #0b0f10 100%);
    }

    body.sidebar-layout .sidebar {
      color: #a0f6b2;
      padding: 20px 14px 12px;
    }

    body.sidebar-layout .sidebar-name::before {
      content: none;
      display: none;
    }

    body.sidebar-layout .sidebar-photo {
      margin-bottom: 10px;
    }

    body.sidebar-layout .sidebar-photo .profile-photo {
      width: 138px !important;
      height: 138px !important;
      max-width: 138px !important;
      max-height: 138px !important;
      min-width: 138px !important;
      min-height: 138px !important;
      border-width: 2px;
    }

    body.sidebar-layout .sidebar-name {
      margin-bottom: 10px;
      gap: 6px;
    }

    body.sidebar-layout .sidebar-name h1 {
      color: #d8ffe1;
      font-size: 23px;
      line-height: 1.08;
    }

    body.sidebar-layout .sidebar-name .title {
      color: #7fd793;
      font-style: normal;
      font-size: 11px;
      line-height: 1.15;
    }

    body.sidebar-layout .sidebar-contacts {
      border-bottom-color: rgba(103, 240, 136, 0.28);
      margin-bottom: 10px;
      padding-bottom: 10px;
    }

    body.sidebar-layout .sidebar-contacts .contact-item,
    body.sidebar-layout .sidebar-contacts .contact-item a {
      color: #a6ffb9;
      font-family: 'IBM Plex Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10.75px;
      line-height: 1.25;
    }

    body.sidebar-layout .sidebar-contacts .contact-item {
      gap: 6px;
      margin-bottom: 5px;
    }

    body.sidebar-layout .sidebar-contacts .contact-item i {
      color: #67f088;
      width: 12px;
      font-size: 10px;
      margin-top: 1px;
    }

    body.sidebar-layout .sidebar-bio .bio {
      color: #7fd793;
      font-size: 11.5px;
      line-height: 1.32;
    }

    body.sidebar-layout .sidebar-bio .bio p,
    body.sidebar-layout .sidebar-bio .bio ul,
    body.sidebar-layout .sidebar-bio .bio ol {
      margin: 0 0 4px 0;
    }

    body.sidebar-layout .sidebar-bio .bio ul,
    body.sidebar-layout .sidebar-bio .bio ol {
      padding-left: 14px;
    }

    body.sidebar-layout .sidebar-bio .bio li {
      margin: 0 0 2px 0;
    }

    body.sidebar-layout .main-content {
      background: #0f1517;
      color: #9ff7b0;
      padding: 16px 20px 14px 18px;
    }

    body.sidebar-layout .main-content section {
      margin-bottom: 14px;
    }

    body.sidebar-layout .main-content h2 {
      border-bottom-color: #2e6f4a;
      color: #86ffa3;
      font-size: 14px;
      padding: 3.5px 10px;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
      text-transform: none;
    }

    body.sidebar-layout .main-content h2::before {
      content: none;
      display: none;
    }

    body.sidebar-layout .main-content .experience-item,
    body.sidebar-layout .main-content .education-item,
    body.sidebar-layout .main-content .project-item {
      border-left-color: #2e6f4a;
      margin-bottom: 8px;
      padding-left: 9px;
    }

    body.sidebar-layout .main-content .experience-header,
    body.sidebar-layout .main-content .education-header {
      margin-bottom: 2px;
    }

    body.sidebar-layout .main-content .position,
    body.sidebar-layout .main-content .degree,
    body.sidebar-layout .main-content .project-name {
      color: #d8ffe1;
      font-size: 11.5px;
    }

    body.sidebar-layout .main-content .company,
    body.sidebar-layout .main-content .institution,
    body.sidebar-layout .main-content li,
    body.sidebar-layout .main-content .project-description,
    body.sidebar-layout .main-content .projects-intro {
      color: #9ff7b0;
      font-size: 10.5px;
    }

    body.sidebar-layout .main-content .education-level,
    body.sidebar-layout .main-content .technologies {
      color: #7fd793;
      font-size: 10px;
    }

    body.sidebar-layout .main-content .date-location,
    body.sidebar-layout .main-content .project-link-line,
    body.sidebar-layout .main-content .project-link {
      color: #67f088;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
      font-size: 10.25px;
      padding: 0 6px;
    }

    body.sidebar-layout .main-content ul {
      margin-left: 13px;
      margin-top: 2px;
    }

    body.sidebar-layout .main-content li {
      margin-bottom: 1.5px;
    }

    body.sidebar-layout .main-content .skills-grid {
      gap: 7px;
    }

    body.sidebar-layout .main-content .skill-category {
      padding: 7px;
    }

    body.sidebar-layout .main-content .skill-category h3 {
      font-size: 11.5px;
      margin-bottom: 4px;
    }

    body.sidebar-layout .main-content .skill-tags {
      gap: 3px;
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
      padding: 1px 6px;
      font-size: 9.5px;
    }

    body.sidebar-layout .main-content .projects-grid {
      gap: 9px;
      column-gap: 18px;
    }

    .gdpr-watermark {
      color: #4f8f66;
    }

    @media print {
      header {
        margin-bottom: 24px;
      }

      h2 {
        display: block;
        break-after: avoid-page;
        page-break-after: avoid;
      }

      section > h2 + * {
        break-before: avoid-page;
        page-break-before: avoid;
      }

      body {
        background: #0b0f10;
        color: #9ff7b0;
        text-shadow: 0 0 0.45px rgba(159, 247, 176, 0.45);
        padding: 0;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      body.compact-layout {
        padding: 0;
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
