function getStyles(palette) {
  if (!palette) {
    throw new Error('Color palette is required for the default theme.');
  }

  palette = {
    primary: palette.primary,
    accent: palette.accent,
    light: palette.light
  };

  return `
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
      line-height: 1.55;
      color: #333;
      background: #fff;
      padding: 40px;
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
      border-bottom: 3px solid ${palette.primary};
      padding-bottom: 20px;
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
      grid-column: 1;
      grid-row: 1;
      margin-bottom: 8px;
    }

    .header-photo {
      grid-column: 2;
      grid-row: 1 / 99;
      align-self: start;
    }

    .header-contacts {
      grid-column: 1;
      grid-row: 2;
      margin-top: 0;
      margin-bottom: 8px;
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
      width: calc(var(--header-photo-size) + var(--header-photo-gap) - 30px);
      height: calc(var(--header-photo-size) - 10px);
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

    header.no-bio .header-contacts {
      margin-bottom: 8px;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      width: 100%;
      gap: 8px 12px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      color: #555;
      min-width: 0;
      max-width: 100%;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .contact-item > * {
      min-width: 0;
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
      color: #555;
    }

    .profile-photo {
      width: 180px !important;
      height: 180px !important;
      max-width: 180px !important;
      max-height: 180px !important;
      min-width: 180px !important;
      min-height: 180px !important;
      aspect-ratio: 1 !important;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid ${palette.primary};
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }

    h1 {
      font-size: 36px;
      color: #1a1a1a;
      margin-bottom: 0;
    }

    .title {
      font-size: 20px;
      color: #7f8c8d;
      margin-bottom: 0;
    }

    .bio {
      font-size: 15px;
      line-height: 1.8;
      color: #555;
      margin-top: 0;
      margin-bottom: 0;
      font-style: italic;
    }

    section {
      margin-bottom: 30px;
    }

    h2 {
      font-size: 22px;
      color: ${palette.primary};
      border-bottom: 2px solid #ecf0f1;
      padding-top: 0;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 15px;
      letter-spacing: 1px;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    .experience-item, .education-item, .project-item {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .experience-header, .education-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 5px;
    }

    .position, .degree, .project-name {
      font-size: 18px;
      font-weight: 600;
      color: ${palette.primary};
    }

    .company, .institution {
      font-size: 16px;
      color: ${palette.accent};
      margin-bottom: 3px;
    }

    .education-level {
      font-size: 14px;
      font-weight: 400;
      color: #7f8c8d;
    }

    .date-location {
      font-size: 16px;
      color: ${palette.primary};
      font-style: italic;
      font-weight: 500;
    }

    ul {
      margin-left: 20px;
      margin-top: 8px;
    }

    li {
      margin-bottom: 5px;
      font-size: 14px;
      color: #555;
    }

    .skills-grid {
      display: flex;
      flex-wrap: nowrap;
      gap: 15px;
    }

    .skill-category {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid ${palette.accent};
      min-width: 0;
      box-sizing: border-box;
    }

    .skill-category h3 {
      font-size: 16px;
      color: ${palette.primary};
      margin-bottom: 8px;
      text-transform: capitalize;
    }

    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      background: #fff;
      padding: 5px 12px;
      border-radius: 3px;
      font-size: 13px;
      color: #555;
      border: 1px solid #e0e0e0;
      white-space: nowrap;
    }

    .projects-intro {
      font-size: 14px;
      color: #555;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ecf0f1;
      font-style: italic;
    }

    .projects-intro a {
      color: ${palette.accent};
      font-weight: 500;
    }

    section:has(.projects-intro) h2 {
      border-bottom: none;
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
      color: #555;
      margin-bottom: 5px;
    }

    .technologies {
      font-size: 13px;
      color: ${palette.primary};
      font-style: italic;
    }

    .gdpr-watermark-wrapper {
      margin-top: 0;
      margin-bottom: 0;
      padding-bottom: 0;
      page-break-inside: avoid;
      page-break-before: auto;
    }

    .gdpr-clause {
      padding-top: 3px;
      border-top: 1px solid #ecf0f1;
      font-size: 10px;
      color: #7f8c8d;
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
        font-size: 28px;
      }

      .title {
        font-size: 16px;
      }

      h2 {
        font-size: 20px;
      }

      .contact-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .contact-item {
        width: 100%;
        font-size: 14px;
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
        font-size: 24px;
      }

      .title {
        font-size: 14px;
      }

      h2 {
        font-size: 18px;
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
        padding: 20px;
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

      h2 {
        page-break-after: avoid;
      }

      .experience-item, .education-item, .project-item {
        page-break-inside: avoid;
        page-break-before: auto;
      }

      .skill-category {
        page-break-inside: avoid;
      }

      .gdpr-watermark-wrapper {
        margin-top: auto;
        page-break-inside: avoid;
        page-break-before: auto;
      }
    }
  `;
}

module.exports = { name: 'default', getStyles, monochromatic: false };
