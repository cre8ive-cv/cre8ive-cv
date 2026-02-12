function getStyles(palette) {
  if (!palette) {
    throw new Error('Color palette is required for the corpo theme.');
  }

  palette = {
    primary: palette.primary,
    accent: palette.accent,
    light: palette.light
  };

  return `
    /* Temporary font import to support inline Space Grotesk usage */
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .project-link-line {
      font-size: 13px;
      color: ${palette.primary};
      font-style: italic;
      font-weight: 500;
    }

    .project-link {
      color: ${palette.primary};
      transition: color 0.2s;
    }

    .project-link:hover {
      color: ${palette.accent};
      text-decoration: underline;
    }

    body {
      font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
      line-height: 1.55;
      color: #222;
      background: #fff;
      padding: 20px 40px 40px;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .content-wrapper {
      flex: 1;
    }

    .content-wrapper > *:last-child {
      margin-bottom: 0 !important;
    }

    header {
      border-bottom: 3px solid transparent;
      padding-bottom: 12px;
      margin-bottom: 30px;
      position: relative;
      display: grid;
      grid-template-columns: 1fr;
      --header-photo-size: 180px;
      --header-photo-gap: 20px;
    }

    header.has-photo {
      grid-template-columns: 1fr var(--header-photo-size);
      column-gap: var(--header-photo-gap);
      min-height: calc(var(--header-photo-size) + 10px);
    }

    .header-name {
      margin-right: 0;
      margin-bottom: 4px;
      grid-column: 1;
      grid-row: 1;
    }

    .header-photo {
      grid-column: 2;
      grid-row: 1 / 99;
      align-self: start;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding-left: var(--header-photo-gap);
      margin-top: -5px;
    }

    .header-bio {
      grid-column: 1 / 3;
      grid-row: 3;
      margin-top: 8px;
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    header.has-photo .header-bio::before {
      content: '';
      float: right;
      width: calc(var(--header-photo-size) + var(--header-photo-gap) + 8px);
      height: calc(var(--header-photo-size) + 22px);
      shape-outside: margin-box;
      /* Pull up to align with photo at header top - base case (name only + no contacts) */
      margin-top: -70px;
    }

    /* Adjust for contacts section */
    header.has-photo:has(.header-contacts) .header-bio::before {
      margin-top: -125px;
    }

    /* Adjust for title in name section */
    header.has-photo:has(.title) .header-bio::before {
      margin-top: -105px;
    }

    /* Adjust for both title and contacts */
    header.has-photo:has(.title):has(.header-contacts) .header-bio::before {
      margin-top: -155px;
    }

    .header-contacts {
      grid-column: 1;
      grid-row: 2;
      margin-top: 0;
      margin-bottom: 8px;
    }

    header.no-bio .header-contacts {
      margin-bottom: 8px;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.0fr) minmax(0, 1.0fr);
      width: 100%;
      gap: 8px 12px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #444;
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .contact-item i {
      width: 16px;
      flex-shrink: 0;
      color: ${palette.accent};
    }

    .contact-item a {
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .contact-item a {
      color: #444;
    }

    .profile-photo {
      width: 180px !important;
      height: 180px !important;
      max-width: 180px !important;
      max-height: 180px !important;
      min-width: 180px !important;
      min-height: 180px !important;
      aspect-ratio: 1 !important;
      border-radius: 4px;
      object-fit: cover;
      border: 3px solid ${palette.primary};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }

    h1 {
      font-size: 34px;
      color: #1a1a1a;
      margin-bottom: 0;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 1;
    }

    .title {
      font-size: 18px;
      color: #555;
      margin-bottom: 5px;
      font-weight: 500;
      line-height: 1.1;
      margin-top: 4px;
    }

    .bio {
      font-size: 13px;
      line-height: 1.8;
      color: #444;
      margin-top: 0;
      margin-bottom: 0;
      font-style: italic;
    }

    section {
      margin-bottom: 30px;
    }

    h2 {
      font-size: 22px;
      color: #fff;
      background: ${palette.primary};
      padding: 8px 15px;
      margin-top: 0;
      margin-bottom: 15px;
      letter-spacing: 2px;
      font-weight: 600;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    .experience-item, .education-item, .project-item {
      margin-bottom: 20px;
      page-break-inside: avoid;
      padding-left: 15px;
      border-left: 3px solid ${palette.accent};
    }

    .experience-header, .education-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 5px;
    }

    .position, .degree, .project-name {
      font-size: 18px;
      font-weight: 700;
      color: #222;
    }

    .company, .institution {
      font-size: 16px;
      color: ${palette.accent};
      margin-bottom: 3px;
      font-weight: 600;
    }

    .education-level {
      font-size: 14px;
      font-weight: 400;
      color: #666;
    }

    .date-location {
      font-size: 16px;
      color: ${palette.primary};
      font-style: italic;
      font-weight: 500;
      padding: 4px 12px;
    }

    ul {
      margin-left: 20px;
      margin-top: 8px;
    }

    li {
      margin-bottom: 5px;
      font-size: 14px;
      color: #444;
      line-height: 1.6;
    }

    .skills-grid {
      display: flex;
      flex-wrap: nowrap;
      gap: 15px;
    }

    .skill-category {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 0;
      border-left: 4px solid ${palette.accent};
      min-width: 0;
      box-sizing: border-box;
    }

    .skill-category h3 {
      font-size: 16px;
      color: ${palette.primary};
      margin-bottom: 8px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      background: #fff;
      padding: 5px 12px;
      border-radius: 0;
      font-size: 13px;
      color: #333;
      border: 1px solid #ddd;
      font-weight: 500;
      white-space: nowrap;
    }

    .projects-intro {
      font-size: 14px;
      color: #444;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #eee;
      font-style: italic;
    }

    .projects-intro a {
      color: ${palette.accent};
      font-weight: 600;
    }

    section:has(.projects-intro) h2 {
      margin-bottom: 2px;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      column-gap: 30px;
    }

    .project-description {
      font-size: 14px;
      color: #444;
      margin-bottom: 5px;
      line-height: 1.6;
    }

    .technologies {
      font-size: 13px;
      color: ${palette.primary};
      font-style: italic;
      font-weight: 500;
    }

    .gdpr-watermark-wrapper {
      margin-top: auto;
      margin-bottom: 0;
      padding-bottom: 0;
      page-break-inside: avoid;
      page-break-before: auto;
    }

    .gdpr-clause {
      padding-top: 3px;
      border-top: 1px solid ${palette.primary};
      font-size: 10px;
      color: #666;
      line-height: 1.4;
      text-align: justify;
    }

    .watermark {
      margin-top: 0px;
      margin-bottom: 0;
      padding-top: 3px;
      padding-bottom: 0;
      font-size: 11px;
      color: #666;
      text-align: center;
      font-style: italic;
      font-weight: 400;
      letter-spacing: 0.3px;
      line-height: 1.2;
    }

    .watermark a {
      color: inherit;
      text-decoration: none;
    }

    .watermark a:hover {
      text-decoration: underline;
    }

    /* Mobile responsive styles */
    @media (max-width: 700px) {
      body {
        padding: 20px;
      }

      header {
        --header-photo-size: 120px;
      }

      header.has-photo {
        grid-template-columns: 1fr var(--header-photo-size);
        column-gap: 12px;
        min-height: auto;
      }

      .header-photo {
        grid-column: 2;
        grid-row: 2;
        justify-self: end;
        align-self: start;
        padding-left: 0;
        margin-top: 0;
        margin-bottom: 0;
      }

      .header-name {
        grid-column: 1 / -1;
        grid-row: 1;
      }

      .header-contacts {
        grid-column: 1;
        grid-row: 2;
        margin-top: 0;
        margin-bottom: 8px;
      }

      .header-bio {
        grid-column: 1 / -1;
        grid-row: 3;
      }

      header.has-photo .header-bio::before {
        display: none;
      }

      .profile-photo {
        width: 120px !important;
        height: 120px !important;
        max-width: 120px !important;
        max-height: 120px !important;
        min-width: 120px !important;
        min-height: 120px !important;
      }

      h1 {
        font-size: 26px;
      }

      .title {
        font-size: 14px;
      }

      h2 {
        font-size: 20px;
        padding: 6px 12px;
      }

      .contact-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .contact-item {
        width: 100%;
        font-size: 12px;
      }

      .projects-grid {
        grid-template-columns: 1fr;
        gap: 15px;
      }

      .skills-grid {
        flex-direction: column;
        gap: 12px;
      }

      .skill-category {
        width: 100%;
      }

      .experience-item, .education-item, .project-item {
        padding-left: 10px;
      }

      .experience-header, .education-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }

      .position, .degree, .project-name {
        font-size: 16px;
      }

      .company, .institution {
        font-size: 14px;
      }

      .date-location {
        font-size: 14px;
        margin-top: 5px;
        padding: 3px 10px;
      }
    }

    @media (max-width: 480px) {
      body {
        padding: 15px;
      }

      header {
        --header-photo-size: 120px;
      }

      .profile-photo {
        width: 120px !important;
        height: 120px !important;
        max-width: 120px !important;
        max-height: 120px !important;
        min-width: 120px !important;
        min-height: 120px !important;
      }

      h1 {
        font-size: 22px;
      }

      .title {
        font-size: 12px;
      }

      h2 {
        font-size: 18px;
        padding: 5px 10px;
      }

      .experience-header, .education-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .date-location {
        margin-top: 5px;
      }
    }

    @media print {
      body {
        padding: 5px 20px 20px;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .content-wrapper {
        flex: 1;
      }

      .profile-photo {
        width: 180px !important;
        height: 180px !important;
        max-width: 180px !important;
        max-height: 180px !important;
        min-width: 180px !important;
        min-height: 180px !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .header-photo {
        margin-top: 0;
      }

      h2 {
        background: ${palette.primary};
        color: #fff;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        page-break-after: avoid;
      }

      .experience-item, .education-item, .project-item {
        page-break-inside: avoid;
        page-break-before: auto;
      }

      .skill-category {
        page-break-inside: avoid;
        background: #f5f5f5;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .gdpr-watermark-wrapper {
        margin-top: auto;
        page-break-inside: avoid;
        page-break-before: auto;
      }
    }
  `;
}

module.exports = { name: 'corpo', getStyles, monochromatic: false };
