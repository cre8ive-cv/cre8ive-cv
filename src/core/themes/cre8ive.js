const modernTheme = require('./modern');

function getStyles(palette) {
  if (!palette) {
    throw new Error('Color palette is required for the cre8ive theme.');
  }

  return `
    ${modernTheme.getStyles(palette)}

    body {
      font-family: 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
      color: #1f2430;
      background:
        radial-gradient(circle at 12% -10%, ${palette.light} 0%, transparent 40%),
        radial-gradient(circle at 100% 0%, ${palette.accent}22 0%, transparent 34%),
        #f8f9fc;
    }

    .content-wrapper {
      background: #ffffff;
      border: 1px solid ${palette.primary}1F;
      border-radius: 14px;
      box-shadow:
        0 20px 48px ${palette.primary}18,
        0 6px 20px rgba(14, 24, 42, 0.06);
      padding: 0;
    }

    header {
      border-bottom: 0;
      background:
        linear-gradient(125deg, #ffffff 0%, #ffffff 63%, ${palette.light}AA 100%);
      border: 1px solid ${palette.primary}29;
      border-radius: 12px;
      padding: 8px 10px 8px;
      overflow: hidden;
    }

    header::before {
      content: '';
      position: absolute;
      width: 280px;
      height: 280px;
      right: -130px;
      top: -175px;
      border-radius: 50%;
      background: radial-gradient(circle, ${palette.accent}25 0%, transparent 68%);
      pointer-events: none;
    }

    h1 {
      font-family: 'Space Grotesk', 'Inter', 'Segoe UI', sans-serif;
      font-size: 33px;
      letter-spacing: -0.8px;
      color: #141821;
    }

    .title {
      color: ${palette.primary};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 13px;
    }

    .contact-item i {
      color: ${palette.primary};
    }

    .profile-photo {
      border-radius: 18% 38% 24% 32%;
      border-width: 4px;
      box-shadow: 0 10px 26px ${palette.primary}35;
    }

    h2 {
      border-radius: 10px 22px 22px 10px;
      display: inline-flex;
      align-items: center;
      background: linear-gradient(90deg, ${palette.light} 0%, #ffffff 100%);
      color: ${palette.primary};
      border: 1px solid ${palette.primary}33;
      padding: 6px 14px 6px 14px;
      margin-bottom: 12px;
      margin-left: 8px;
      letter-spacing: 0.3px;
      font-size: 16px;
    }

    h2::before {
      content: none;
      display: none;
    }

    h2::after {
      content: none;
      display: none;
    }

    .experience-item,
    .education-item,
    .project-item {
      border-left: 3px solid ${palette.primary}36;
      background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
      border-radius: 10px;
      padding: 2px 8px 2px 12px;
      margin-bottom: 10px;
      box-shadow: 0 2px 10px rgba(12, 22, 40, 0.04);
    }

    body:not(.sidebar-layout):not(.compact-layout) .experience-item,
    body:not(.sidebar-layout):not(.compact-layout) .education-item,
    body:not(.sidebar-layout):not(.compact-layout) .project-item {
      margin-left: 8px;
    }

    body:not(.sidebar-layout):not(.compact-layout) .education-item {
      padding-bottom: 2px;
    }

    .date-location {
      background: ${palette.primary}12;
      color: #33435d;
      border: 1px solid ${palette.primary}26;
      border-radius: 999px;
      font-size: 13px;
      font-style: normal;
      font-weight: 600;
    }

    li::marker {
      color: ${palette.primary};
    }

    .skill-category {
      border-left-width: 0;
      border-top: 3px solid ${palette.primary};
      border-radius: 10px;
      background: linear-gradient(180deg, #ffffff 0%, ${palette.light}88 100%);
    }

    body:not(.sidebar-layout):not(.compact-layout) .skills-grid {
      margin-left: 8px;
    }

    .skill-category h3 {
      color: #2a3345;
      letter-spacing: 0.02em;
    }

    .skill-tag {
      background: ${palette.primary}0D;
      border-color: ${palette.primary}36;
      color: #2c3447;
      border-radius: 999px;
      font-weight: 600;
      box-shadow: none;
    }

    .projects-intro {
      border-bottom-color: ${palette.primary}30;
      color: #465269;
      font-style: normal;
    }

    .technologies {
      color: #53617a;
      font-style: normal;
    }

    .gdpr-clause {
      border-top-color: ${palette.primary}22;
      color: #6c7484;
    }

    .watermark {
      color: #5f697a;
      font-style: normal;
    }

    /* ===== Sidebar layout ===== */
    body.sidebar-layout {
      background: #eef2f8;
    }

    body.sidebar-layout .sidebar-bg {
      background:
        linear-gradient(175deg, ${palette.primary} 0%, ${palette.accent} 100%);
    }

    body.sidebar-layout .sidebar {
      background: transparent;
      color: #f4f7ff;
    }

    body.sidebar-layout .sidebar-name h1 {
      font-family: 'Space Grotesk', 'Inter', 'Segoe UI', sans-serif;
      color: #ffffff;
      letter-spacing: -0.4px;
    }

    body.sidebar-layout .sidebar-name .title {
      color: #eef4ff;
      letter-spacing: 0.09em;
      font-size: 11px;
    }

    body.sidebar-layout .sidebar-contacts {
      border-bottom-color: rgba(255, 255, 255, 0.28);
    }

    body.sidebar-layout .sidebar-contacts .contact-item,
    body.sidebar-layout .sidebar-contacts .contact-item a {
      color: #f5f8ff;
    }

    body.sidebar-layout .sidebar-contacts .contact-item i {
      color: ${palette.light};
    }

    body.sidebar-layout .sidebar-bio .bio {
      color: #e6ecfb;
    }

    body.sidebar-layout .main-content {
      background: #ffffff;
      color: #1f2430;
      padding: 15px 19px 13px 17px;
    }

    body.sidebar-layout .main-content section {
      margin-bottom: 13px;
    }

    body.sidebar-layout .main-content h2 {
      background: linear-gradient(90deg, ${palette.light} 0%, #ffffff 100%);
      color: ${palette.primary};
      border-color: ${palette.primary}3B;
      margin-left: 0;
      padding: 4px 10px;
      margin-bottom: 6.5px;
    }

    body.sidebar-layout .main-content .experience-item,
    body.sidebar-layout .main-content .education-item,
    body.sidebar-layout .main-content .project-item {
      border-left-color: ${palette.primary}3D;
      background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
      margin-bottom: 8px;
      padding: 0 0 0 9px;
    }

    body.sidebar-layout .main-content .date-location {
      font-size: 10.75px;
      padding: 0 7px;
      font-weight: 500;
    }

    body.sidebar-layout .sidebar .gdpr-clause {
      border-top-color: rgba(255, 255, 255, 0.22);
      color: rgba(245, 248, 255, 0.78);
    }

    body.sidebar-layout .sidebar .watermark,
    body.sidebar-layout .sidebar .watermark a {
      color: rgba(245, 248, 255, 0.84);
    }

    @media (min-width: 701px) {
      body.compact-layout .content-wrapper {
        border-radius: 12px;
        padding: 0;
      }

      body.compact-layout h2 {
        font-size: 14px;
        padding: 4px 12px;
        margin-left: 6px;
      }

      body.compact-layout .experience-item,
      body.compact-layout .education-item,
      body.compact-layout .project-item {
        padding: 1px 7px 1px 11px;
        margin-left: 6px;
      }

      body.compact-layout .skills-grid {
        margin-left: 6px;
      }

      body.compact-layout .date-location {
        font-size: 12px;
        padding: 0 10px;
      }
    }

    @media print {
      h2 {
        display: inline-flex;
        width: auto;
        max-width: fit-content;
        break-after: avoid-page;
        page-break-after: avoid;
      }

      section > h2 + * {
        break-before: avoid-page;
        page-break-before: avoid;
      }

      body {
        background: #f8f9fc;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .content-wrapper,
      header,
      .experience-item,
      .education-item,
      .project-item,
      .skill-category,
      .date-location {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `;
}

module.exports = { name: 'cre8ive', getStyles, monochromatic: false };
