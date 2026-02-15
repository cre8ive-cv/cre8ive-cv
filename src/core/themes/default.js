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
      line-height: 1.47;
      color: #333;
      background: #fff;
      padding: 16px 34px 34px;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    body:not(.sidebar-layout) {
      background: #e8f1fb;
    }

    .content-wrapper {
      flex: 1;
    }

    .content-wrapper > *:last-child {
      margin-bottom: 0 !important;
    }

    header {
      border-bottom: 1px solid ${palette.primary}4D;
      padding-bottom: 12px;
      margin-bottom: 24px;
      position: relative;
      display: grid;
      grid-template-columns: 1fr;
      --header-photo-size: 180px;
      --header-photo-gap: 20px;
    }

    body:not(.sidebar-layout) header {
      border-bottom: 0;
      padding: 8px 12px 10px;
      border: 1px solid #c5d9ec;
      border-radius: 12px;
      background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);
      box-shadow: 0 7px 24px rgba(20, 56, 95, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.85);
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }

    header.has-photo {
      grid-template-columns: 1fr var(--header-photo-size);
      column-gap: var(--header-photo-gap);
      min-height: calc(var(--header-photo-size) + 10px);
    }

    .header-name {
      grid-column: 1;
      grid-row: 1;
      margin-bottom: 4px;
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

    header.no-bio .header-contacts {
      margin-bottom: 8px;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      width: 100%;
      gap: 6px 10px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
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
      font-size: 31px;
      color: #1a1a1a;
      margin-bottom: 0;
      line-height: 1;
    }

    .title {
      font-size: 16px;
      color: #7f8c8d;
      margin-bottom: 5px;
      line-height: 1.1;
      margin-top: 4px;
    }

    .bio {
      font-size: 12px;
      line-height: 1.65;
      color: #555;
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
      border-bottom: 2px solid #ecf0f1;
      padding-top: 0;
      padding-bottom: 7px;
      margin-top: 0;
      margin-bottom: 12px;
      letter-spacing: 1px;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    .experience-item, .education-item, .project-item {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    body:not(.sidebar-layout) .experience-item,
    body:not(.sidebar-layout) .education-item,
    body:not(.sidebar-layout) .project-item {
      padding: 9px 11px 10px;
      border-radius: 11px;
      border: 1px solid #c5d9ec;
      background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);
      box-shadow: 0 7px 24px rgba(20, 56, 95, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.85);
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }

    body:not(.sidebar-layout) .education-item {
      padding-bottom: 9px;
    }

    body:not(.sidebar-layout):not(.compact-layout) .experience-item,
    body:not(.sidebar-layout):not(.compact-layout) .education-item,
    body:not(.sidebar-layout):not(.compact-layout) .project-item {
      margin-bottom: 12px;
      padding: 5px 8px 6px;
    }

    body:not(.sidebar-layout):not(.compact-layout) section {
      margin-bottom: 17px;
    }

    body:not(.sidebar-layout):not(.compact-layout) .education-item {
      padding-bottom: 5px;
    }

    .experience-header, .education-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 5px;
    }

    .position, .degree, .project-name {
      font-size: 16px;
      font-weight: 600;
      color: ${palette.primary};
    }

    .company {
      font-size: 13px;
      color: ${palette.accent};
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
      color: ${palette.accent};
      margin-bottom: 3px;
    }

    .education-level {
      font-size: 14px;
      font-weight: 400;
      color: #7f8c8d;
    }

    .date-location {
      font-size: 15px;
      color: ${palette.primary};
      font-style: italic;
      font-weight: 500;
    }

    ul {
      margin-left: 18px;
      margin-top: 6px;
    }

    li {
      margin-bottom: 4px;
      font-size: 14px;
      color: #555;
    }

    .skills-grid {
      display: flex;
      flex-wrap: nowrap;
      gap: 12px;
    }

    .skill-category {
      position: relative;
      background: linear-gradient(180deg, #fdfefe 0%, #f4f8fc 100%);
      padding: 12px;
      border-radius: 9px;
      border: 1px solid #d8e5f1;
      min-width: 0;
      box-sizing: border-box;
      overflow: hidden;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
    }

    .skill-category::before {
      content: '';
      position: absolute;
      top: 7px;
      bottom: 7px;
      left: 0;
      width: 2px;
      border-radius: 0;
      background: ${palette.accent};
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .skill-category::after {
      content: '';
      position: absolute;
      left: 10px;
      right: 10px;
      top: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.8);
    }

    .skill-category h3 {
      font-size: 15px;
      color: ${palette.primary};
      margin-bottom: 7px;
      text-transform: capitalize;
      letter-spacing: 0.15px;
      padding-left: 2px;
    }

    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill-tag {
      background: #fff;
      padding: 4px 10px;
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
      gap: 17px;
      column-gap: 26px;
    }

    body:not(.sidebar-layout):not(.compact-layout) .projects-grid {
      row-gap: 6px;
      column-gap: 24px;
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

    @media (min-width: 701px) {
      /* Tight layout overrides */
      body.compact-layout {
        line-height: 1.4;
        padding: 12px 28px 28px;
      }

      body.compact-layout header {
        margin-bottom: 18px;
        padding: 7px 10px 8px;
      }

      body.compact-layout header.has-photo .header-bio::before {
        height: calc(var(--header-photo-size) + 44px);
      }

      body.compact-layout h1 {
        font-size: 28px;
      }

      body.compact-layout h2 {
        font-size: 18px;
        padding-bottom: 5px;
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

      body.compact-layout .experience-item,
      body.compact-layout .education-item,
      body.compact-layout .project-item {
        padding: 7px 9px 8px;
      }

      body.compact-layout .education-item {
        padding-bottom: 7px;
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

      body.compact-layout .skill-category::before {
        width: 2px;
        top: 7px;
        bottom: 7px;
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
      /* Prefer A4 width (794px at 96 DPI) so HTML preview matches PDF proportions.
         Use max-width so the layout adapts when the viewport is narrower. */
      width: 100%;
      max-width: 794px;
      min-height: 100vh;
      line-height: 1.35;
    }

    /* Sidebar background that repeats on every printed/PDF page */
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
      border-color: rgba(255,255,255,0.7);
      border-width: 3px;
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
    }

    body.sidebar-layout .sidebar-name .title {
      font-size: 14px;
      color: ${palette.light};
      margin: 0;
      line-height: 1.2;
    }

    body.sidebar-layout .sidebar-contacts {
      margin-bottom: 10px;
      padding: 8px 9px;
      border: 0.35px solid rgba(255,255,255,0.09);
      border-radius: 10px;
      background: linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%);
      box-shadow: 0 1px 3px rgba(3, 15, 30, 0.07), inset 0 1px 0 rgba(255,255,255,0.08);
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
      padding: 8px 9px;
      border: 0.35px solid rgba(255,255,255,0.09);
      border-radius: 10px;
      background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.018) 100%);
      box-shadow: 0 1px 3px rgba(3, 15, 30, 0.07), inset 0 1px 0 rgba(255,255,255,0.07);
    }

    body.sidebar-layout .sidebar-bio .bio {
      font-size: 13px;
      line-height: 1.5;
      color: rgba(255,255,255,0.75);
      font-style: italic;
      /* Ensure user blocks inside bio inherit the intended styles */
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
      padding: 12px 14px 11px 12px;
      font-variant-emoji: normal;
      background: #fff;
    }

    body.sidebar-layout .main-content section {
      margin-bottom: 10px;
    }

    body.sidebar-layout .main-content h2 {
      font-size: 14.75px;
      padding-bottom: 3px;
      margin-bottom: 6px;
      letter-spacing: 0.8px;
    }

      body.sidebar-layout .main-content .experience-item,
      body.sidebar-layout .main-content .education-item,
      body.sidebar-layout .main-content .project-item {
        margin-bottom: 6px;
        padding: 4.5px 6px 5px;
        border-radius: 9px;
        border: 1px solid #c5d9ec;
        background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);
        box-shadow: 0 5px 16px rgba(20, 56, 95, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85);
      }

    body.sidebar-layout .main-content .education-item {
      padding-bottom: 4.5px;
    }

    body.sidebar-layout .main-content .experience-header,
    body.sidebar-layout .main-content .education-header {
      margin-bottom: 2px;
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
    }

    body.sidebar-layout .main-content ul {
      margin-left: 12px;
      margin-top: 2px;
    }

    body.sidebar-layout .main-content li {
      font-size: 10.75px;
      margin-bottom: 1px;
      color: #555;
    }

    body.sidebar-layout .main-content .skills-grid {
      gap: 5px;
    }

    body.sidebar-layout .main-content .skill-category {
      padding: 5px;
      border-radius: 7px;
    }

    body.sidebar-layout .main-content .skill-category::before {
      width: 2px;
      top: 6px;
      bottom: 6px;
    }

    body.sidebar-layout .main-content .skill-category h3 {
      font-size: 11.75px;
      margin-bottom: 4px;
    }

    body.sidebar-layout .main-content .skill-tags {
      gap: 3px;
    }

    body.sidebar-layout .main-content .skill-tag {
      padding: 2px 6px;
      font-size: 9.75px;
    }

    body.sidebar-layout .main-content .projects-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 7px;
      column-gap: 12px;
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

      body:not(.sidebar-layout) {
        background: #fff;
      }

      .content-wrapper {
        flex: 1;
      }

      body:not(.sidebar-layout) section {
        box-shadow: none;
      }

      body:not(.sidebar-layout) header {
        box-shadow: none;
      }

      body:not(.sidebar-layout) section:has(.experience-item),
      body:not(.sidebar-layout) section:has(.education-item),
      body:not(.sidebar-layout) section:has(.project-item) {
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
      }

      body:not(.sidebar-layout) .experience-item,
      body:not(.sidebar-layout) .education-item,
      body:not(.sidebar-layout) .project-item {
        margin-bottom: 9px;
        padding: 6px 9px 8px;
        border-radius: 10px;
        border: 1px solid #c5d9ec;
        background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);
        box-shadow: none;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }

      body:not(.sidebar-layout) .education-item {
        padding-bottom: 6px;
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
