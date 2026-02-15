const modernTheme = require('./modern');

function getStyles() {
  const palette = {
    primary: '#20242b',
    accent: '#5f6672',
    light: '#f2f3f5'
  };

  return `
    ${modernTheme.getStyles(palette)}

    body {
      font-family: 'IBM Plex Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
      color: #1f2329;
      background: #ffffff;
    }

    .content-wrapper {
      background: #ffffff;
    }

    header {
      background: #ffffff;
      border-bottom: 1px solid #d4d8de;
      border-radius: 0;
      box-shadow: none;
    }

    .header-photo {
      margin-top: 0;
    }

    .contact-item,
    .contact-item a {
      color: #353b45;
    }

    .contact-item i {
      color: #5f6672;
    }

    .profile-photo {
      border: 1px solid #c8cdd5;
      background: #ffffff;
      box-shadow: none;
    }

    h1 {
      color: #151922;
      font-weight: 650;
      letter-spacing: -0.3px;
    }

    .title {
      color: #4c5461;
      font-weight: 500;
      letter-spacing: 0;
    }

    .bio {
      color: #3d4551;
      font-style: normal;
    }

    h2 {
      color: #1f2329;
      font-weight: 600;
      letter-spacing: 0.4px;
      border-bottom: 0;
      border-radius: 0;
      background: transparent;
      padding: 0 0 7px;
    }

    h2::before,
    h2::after {
      content: none;
      display: none;
    }

    .experience-item,
    .education-item,
    .project-item {
      border-left: 0;
      border-bottom: 0;
      background: transparent;
      border-radius: 0;
      box-shadow: none;
      padding-left: 0;
      padding-right: 0;
      padding-top: 0;
    }

    .position,
    .degree,
    .project-name {
      color: #191d26;
    }

    .company,
    .institution {
      color: #4c5461;
      opacity: 1;
    }

    .date-location {
      background: transparent;
      border: 0;
      color: #636c79;
      font-style: normal;
      font-family: 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
      font-size: 12px;
      padding: 0;
    }

    ul {
      padding-left: 20px;
    }

    li::marker {
      color: #5f6672;
    }

    .skill-category {
      border-left: 0;
      border-top: 0;
      border-radius: 0;
      background: transparent;
      padding-top: 10px;
      padding-left: 0;
      padding-right: 0;
    }

    .skill-category h3 {
      color: #1f2329;
      font-weight: 600;
    }

    .skill-tag {
      background: #f6f7f9;
      border: 1px solid #d9dde3;
      color: #363d48;
      border-radius: 4px;
      box-shadow: none;
    }

    .projects-intro {
      border-bottom-color: #d4d8de;
      color: #4c5461;
      font-style: normal;
    }

    .technologies {
      color: #596272;
      font-style: normal;
    }

    .project-link-line,
    .project-link {
      color: #2f3641;
    }

    .project-link:hover {
      color: #11141b;
    }

    .gdpr-clause {
      border-top-color: #d4d8de;
      color: #666f7d;
    }

    .watermark,
    .watermark a {
      color: #666f7d;
    }

    body.sidebar-layout {
      background: #ffffff;
    }

    body.sidebar-layout .sidebar-bg {
      background: #f3f5f8 !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body.sidebar-layout .sidebar {
      background: #f3f5f8 !important;
      color: #2c333e;
      border-right: 1px solid #d7dce3;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body.sidebar-layout .sidebar-name h1 {
      color: #171b24;
    }

    body.sidebar-layout .sidebar-name .title {
      color: #566070;
    }

    body.sidebar-layout .sidebar-contacts {
      border-bottom-color: #d5dae2;
    }

    body.sidebar-layout .sidebar .title,
    body.sidebar-layout .sidebar .bio,
    body.sidebar-layout .sidebar .contact-item,
    body.sidebar-layout .sidebar .contact-item a {
      color: #3e4755;
    }

    body.sidebar-layout .sidebar .contact-item i {
      color: #687182;
    }

    body.sidebar-layout .sidebar .gdpr-clause {
      border-top-color: #d5dae2;
      color: #697283;
    }

    body.sidebar-layout .sidebar .watermark,
    body.sidebar-layout .sidebar .watermark a {
      color: #697283;
    }

    body.sidebar-layout .main-content {
      background: #ffffff;
      color: #1f2329;
    }

    body.sidebar-layout .main-content h2 {
      border-bottom: 0;
      background: transparent;
    }

    body.sidebar-layout .main-content .experience-item,
    body.sidebar-layout .main-content .education-item,
    body.sidebar-layout .main-content .project-item {
      border-left: 0;
      border-bottom: 0;
      background: transparent;
    }

    @media print {
      h2 {
        display: block;
        break-after: avoid-page;
        page-break-after: avoid;
      }

      section > h2 + * {
        break-before: avoid-page;
        page-break-before: avoid;
      }
    }
  `;
}

module.exports = { name: 'minimalist', getStyles, monochromatic: true };
