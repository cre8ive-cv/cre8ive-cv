function getStyles(palette) {
  if (!palette) {
    throw new Error('Color palette is required for the modern theme.');
  }

  palette = {
    primary: palette.primary,
    accent: palette.accent,
    light: palette.light || palette.accent
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
      line-height: 1.47;
      color: #1a1a1a;
      background: #fff;
      padding: 16px 34px 34px;
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
      padding-bottom: 12px;
      margin-bottom: 24px;
      position: relative;
      background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
      border-radius: 8px;
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
      gap: 6px 10px;
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
      border-radius: 50%;
      object-fit: cover;
      border: 5px solid transparent;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, ${palette.accent}, color-mix(in srgb, ${palette.primary} 60%, ${palette.accent}), ${palette.accent}) border-box;
      box-shadow: 0 8px 16px ${palette.primary}33;
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }

    h1 {
      font-size: 31px;
      color: #1a1a1a;
      margin-bottom: 0;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 1;
    }

    .title {
      font-size: 16px;
      color: #666;
      margin-bottom: 5px;
      font-weight: 400;
      line-height: 1.1;
      margin-top: 4px;
    }

    .bio {
      font-size: 12px;
      line-height: 1.65;
      color: #444;
      margin-top: 0;
      margin-bottom: 0;
      font-style: italic;
    }

    .bio p,
    .bio ul,
    .bio ol,
    .bio li {
      font: inherit;
      color: inherit;
      line-height: inherit;
      margin: 0 0 6px 0;
    }

    .bio ul,
    .bio ol {
      padding-left: 16px;
    }

    .bio li {
      margin: 0 0 4px 0;
    }

    section {
      margin-bottom: 24px;
    }

    h2 {
      font-size: 20px;
      color: ${palette.primary};
      border-bottom: none;
      padding: 7px 15px;
      margin-top: 0;
      margin-bottom: 12px;
      letter-spacing: 2px;
      font-weight: 700;
      position: relative;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    h2::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(to bottom, ${palette.primary}, ${palette.accent});
      border-radius: 2px;
    }

    .experience-item, .education-item, .project-item {
      margin-bottom: 16px;
      page-break-inside: avoid;
      padding-left: 15px;
      border-left: 2px solid #e8e8e8;
    }

    .experience-header, .education-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 5px;
    }

    .position, .degree, .project-name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .company {
      font-size: 13px;
      color: ${palette.primary};
      opacity: 0.65;
      font-weight: 400;
    }

    .company * {
      display: inline !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .institution {
      font-size: 15px;
      color: ${palette.primary};
      margin-bottom: 3px;
      font-weight: 500;
    }

    .education-level {
      font-size: 14px;
      font-weight: 400;
      color: #888;
    }

    .date-location {
      font-size: 15px;
      color: #666;
      font-style: italic;
      font-weight: 500;
      background: ${palette.light};
      padding: 0 12px;
      border-radius: 4px;
    }

    ul {
      margin-left: 18px;
      margin-top: 6px;
    }

    li {
      margin-bottom: 4px;
      font-size: 14px;
      color: #444;
    }

    .skills-grid {
      display: flex;
      flex-wrap: nowrap;
      gap: 12px;
    }

    .skill-category {
      background: linear-gradient(135deg, ${palette.light} 0%, #ffffff 100%);
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid ${palette.primary};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      min-width: 0;
      box-sizing: border-box;
    }

    .skill-category h3 {
      font-size: 15px;
      color: ${palette.primary};
      margin-bottom: 7px;
      text-transform: capitalize;
      font-weight: 700;
    }

    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill-tag {
      background: #fff;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 13px;
      color: #444;
      border: 1px solid #d0d0d0;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      white-space: nowrap;
    }

    .projects-intro {
      font-size: 14px;
      color: #444;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e8e8e8;
      font-style: italic;
    }

    .projects-intro a {
      color: ${palette.primary};
      font-weight: 600;
    }

    section:has(.projects-intro) h2 {
      border-bottom: none;
      margin-bottom: 2px;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 17px;
      column-gap: 26px;
    }

    .project-description {
      font-size: 14px;
      color: #444;
      margin-bottom: 5px;
    }

    .technologies {
      font-size: 13px;
      color: #666;
      font-style: italic;
      font-weight: 500;
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
      border-top: 1px solid #e8e8e8;
      font-size: 10px;
      color: #888;
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

    @media (min-width: 701px) {
      /* Tight layout overrides */
      body.compact-layout {
        line-height: 1.4;
        padding: 12px 28px 28px;
      }

      body.compact-layout header {
        margin-bottom: 18px;
      }

      body.compact-layout header.has-photo .header-bio::before {
        height: calc(var(--header-photo-size) + 44px);
      }

      body.compact-layout h1 {
        font-size: 28px;
      }

      body.compact-layout h2 {
        font-size: 18px;
        padding: 5px 15px;
        margin-bottom: 10px;
      }

      body.compact-layout .title {
        font-size: 15px;
      }

      body.compact-layout .bio {
        font-size: 12px;
        line-height: 1.5;
      }

      body.compact-layout section {
        margin-bottom: 18px;
      }

      body.compact-layout .experience-item,
      body.compact-layout .education-item,
      body.compact-layout .project-item {
        margin-bottom: 12px;
      }

      body.compact-layout .position,
      body.compact-layout .degree,
      body.compact-layout .project-name {
        font-size: 15px;
      }

      body.compact-layout .company,
      body.compact-layout .institution {
        font-size: 14px;
      }

      body.compact-layout .date-location {
        font-size: 13px;
      }

      body.compact-layout ul {
        margin-top: 4px;
        margin-left: 16px;
      }

      body.compact-layout li {
        font-size: 13px;
        margin-bottom: 3px;
      }

      body.compact-layout .contact-grid {
        display: grid;
        grid-auto-flow: row;
        justify-content: start;
        align-items: center;
        column-gap: clamp(8px, 2.4vw, 18px);
        row-gap: 5px;
      }

      body.compact-layout .contact-item {
        font-size: 12px;
        white-space: nowrap;
        flex: 0 0 auto;
        gap: 2px;
      }

      body.compact-layout .skills-grid {
        gap: 10px;
      }

      body.compact-layout .skill-category {
        padding: 10px;
      }

      body.compact-layout .skill-category h3 {
        font-size: 14px;
        margin-bottom: 6px;
      }

      body.compact-layout .skill-tags {
        gap: 5px;
      }

      body.compact-layout .skill-tag {
        padding: 3px 9px;
        font-size: 12px;
      }

      body.compact-layout .projects-grid {
        gap: 14px;
        column-gap: 22px;
      }

    }

    /* ===== Sidebar layout ===== */
    body.sidebar-layout {
      display: block;
      padding: 0;
      margin: 0;
      width: 100%;
      max-width: 794px;
      min-height: 100vh;
      line-height: 1.35;
    }

    body.sidebar-layout .sidebar-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 30%;
      height: 100%;
      background: ${palette.primary};
      z-index: 0;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body.sidebar-layout .sidebar-container {
      display: flex;
      width: 100%;
      min-height: 100vh;
      position: relative;
      z-index: 1;
    }

    body.sidebar-layout .sidebar {
      width: 30%;
      flex-shrink: 0;
      padding: 22px 16px 16px;
      display: flex;
      flex-direction: column;
      color: #ecf0f1;
      min-height: 100vh;
      font-variant-emoji: normal;
      background: ${palette.primary};
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body.sidebar-layout .sidebar-top {
      flex: 1 1 auto;
    }

    body.sidebar-layout .sidebar-bottom {
      margin-top: auto;
      padding-top: 10px;
    }

    body.sidebar-layout .sidebar-bottom .gdpr-clause {
      border-top-color: rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.6);
      font-size: 7px;
      line-height: 1.3;
      text-align: left;
    }

    body.sidebar-layout .sidebar-bottom .watermark {
      color: rgba(255,255,255,0.5);
      font-size: 9px;
      text-align: center;
    }

    body.sidebar-layout .sidebar-bottom .watermark a {
      color: rgba(255,255,255,0.65);
    }

    body.sidebar-layout .sidebar-photo {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 14px;
    }

    body.sidebar-layout .sidebar-photo .profile-photo {
      width: 160px !important;
      height: 160px !important;
      max-width: 160px !important;
      max-height: 160px !important;
      min-width: 160px !important;
      min-height: 160px !important;
      margin: 0 auto;
      display: block;
      border: 3px solid transparent;
      background: linear-gradient(${palette.primary}, ${palette.primary}) padding-box,
                  linear-gradient(135deg, ${palette.accent}, color-mix(in srgb, ${palette.primary} 60%, ${palette.accent}), ${palette.accent}) border-box;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body.sidebar-layout .sidebar-name {
      margin-bottom: 14px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    body.sidebar-layout .sidebar-name h1 {
      font-size: 26px;
      color: #fff;
      line-height: 1.15;
      margin: 0;
      letter-spacing: -0.5px;
    }

    body.sidebar-layout .sidebar-name .title {
      font-size: 14px;
      color: ${palette.light};
      margin: 0;
      line-height: 1.2;
      font-weight: 400;
    }

    body.sidebar-layout .sidebar-contacts {
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.15);
    }

    body.sidebar-layout .sidebar-contacts .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      font-size: 11.5px;
      color: rgba(255,255,255,0.85);
      margin-bottom: 6px;
      line-height: 1.3;
    }

    body.sidebar-layout .sidebar-contacts .contact-item:last-child {
      margin-bottom: 0;
    }

    body.sidebar-layout .sidebar-contacts .contact-item i {
      color: ${palette.accent};
      width: 13px;
      font-size: 11px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    body.sidebar-layout .sidebar-contacts .contact-item a {
      color: rgba(255,255,255,0.85);
      word-break: break-all;
    }

    body.sidebar-layout .sidebar-bio {
      margin-bottom: 0;
    }

    body.sidebar-layout .sidebar-bio .bio {
      font-size: 13px;
      line-height: 1.5;
      color: rgba(255,255,255,0.75);
      font-style: italic;
      & p,
      & ul,
      & ol {
        font: inherit;
        color: inherit;
        line-height: inherit;
        margin: 0 0 6px 0;
      }

      & ul,
      & ol {
        padding-left: 16px;
      }

      & li {
        font: inherit;
        color: inherit;
        line-height: inherit;
        margin: 0 0 4px 0;
      }
    }

    /* Main content area */
    body.sidebar-layout .main-content {
      width: 70%;
      padding: 18px 22px 16px 20px;
      font-variant-emoji: normal;
      background: #fff;
    }

    body.sidebar-layout .main-content section {
      margin-bottom: 16.5px;
    }

    body.sidebar-layout .main-content h2 {
      font-size: 15px;
      padding: 4.5px 12px;
      margin-bottom: 7.5px;
      letter-spacing: 0.8px;
      background: none;
      color: ${palette.primary};
    }

    body.sidebar-layout .main-content h2::before {
      width: 3px;
    }

    body.sidebar-layout .main-content .experience-item,
    body.sidebar-layout .main-content .education-item,
    body.sidebar-layout .main-content .project-item {
      margin-bottom: 9.5px;
      padding-left: 10px;
    }

    body.sidebar-layout .main-content .experience-header,
    body.sidebar-layout .main-content .education-header {
      margin-bottom: 2.5px;
    }

    body.sidebar-layout .main-content .position,
    body.sidebar-layout .main-content .degree,
    body.sidebar-layout .main-content .project-name {
      font-size: 11.75px;
    }

    body.sidebar-layout .main-content .company {
      font-size: 10.75px;
    }

    body.sidebar-layout .main-content .institution {
      font-size: 11.75px;
    }

    body.sidebar-layout .main-content .education-level {
      font-size: 10.75px;
    }

    body.sidebar-layout .main-content .date-location {
      font-size: 10.75px;
      padding: 0 7px;
      border-radius: 3px;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body.sidebar-layout .main-content ul {
      margin-left: 14px;
      margin-top: 3px;
    }

    body.sidebar-layout .main-content li {
      font-size: 10.75px;
      margin-bottom: 2px;
    }

    body.sidebar-layout .main-content .skills-grid {
      gap: 8px;
    }

    body.sidebar-layout .main-content .skill-category {
      padding: 8px;
    }

    body.sidebar-layout .main-content .skill-category h3 {
      font-size: 11.75px;
      margin-bottom: 5px;
    }

    body.sidebar-layout .main-content .skill-tags {
      gap: 4px;
    }

    body.sidebar-layout .main-content .skill-tag {
      padding: 2px 7px;
      font-size: 9.75px;
    }

    body.sidebar-layout .main-content .projects-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      column-gap: 20px;
    }

    body.sidebar-layout .main-content .project-description {
      font-size: 10.75px;
    }

    body.sidebar-layout .main-content .technologies {
      font-size: 9.75px;
    }

    body.sidebar-layout .main-content .project-link-line {
      font-size: 9.75px;
    }

    body.sidebar-layout .main-content .projects-intro {
      font-size: 10.75px;
    }

    /* Mobile responsive styles */
    @media (max-width: 700px) {
      body {
        padding: 20px;
      }

      header {
        padding-left: 10px;
        padding-right: 10px;
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
        padding-left: 8px;
        padding-right: 8px;
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

      header {
        background: #f8f9fa;
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
        background: ${palette.light};
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .date-location {
        background: ${palette.light};
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

module.exports = { name: 'modern', getStyles, monochromatic: false };
