function getStyles() {
  // Classic theme ignores color parameter and always uses black/gray
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
      color: #000;
      font-style: italic;
    }

    .project-link {
      color: #000;
      transition: color 0.2s;
    }

    .project-link:hover {
      color: #555;
      text-decoration: underline;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
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
      margin-bottom: 34px;
      position: relative;
      padding-left: 15px;
      padding-right: 15px;
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
      color: #333;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .contact-item i {
      width: 16px;
      flex-shrink: 0;
      color: #1a1a1a;
    }

    .contact-item a {
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .contact-item a {
      color: #333;
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
      border: 3px solid #1a1a1a;
      box-shadow: none;
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
      color: #4a4a4a;
      margin-bottom: 5px;
      line-height: 1.1;
      margin-top: 4px;
      font-weight: 400;
      font-style: italic;
    }

    .bio {
      font-size: 12px;
      line-height: 1.65;
      color: #333;
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
      color: #1a1a1a;
      border-bottom: 1px solid #1a1a1a;
      padding-bottom: 7px;
      margin-bottom: 12px;
      letter-spacing: 2px;
      font-weight: 700;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    .experience-item, .education-item, .project-item {
      margin-bottom: 16px;
      page-break-inside: avoid;
      padding-left: 15px;
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
      color: #333;
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
      color: #333;
      margin-bottom: 3px;
      font-weight: 600;
    }

    .education-level {
      font-size: 14px;
      font-weight: 400;
      color: #666;
      font-style: italic;
    }

    .date-location {
      font-size: 15px;
      color: #1a1a1a;
      font-style: normal;
      font-weight: 600;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    ul {
      margin-left: 18px;
      margin-top: 6px;
    }

    li {
      margin-bottom: 4px;
      font-size: 14px;
      color: #333;
    }

    .skills-grid {
      display: flex;
      flex-wrap: nowrap;
      gap: 12px;
    }

    .skill-category {
      background: #fafafa;
      padding: 12px;
      border-radius: 0;
      border-left: 3px solid #1a1a1a;
      border-top: 1px solid #e0e0e0;
      border-right: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
      min-width: 0;
      box-sizing: border-box;
    }

    .skill-category h3 {
      font-size: 15px;
      color: #1a1a1a;
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
      border-radius: 0;
      font-size: 13px;
      color: #333;
      border: 1px solid #1a1a1a;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      white-space: nowrap;
    }

    .projects-intro {
      font-size: 14px;
      color: #333;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ecf0f1;
      font-style: italic;
    }

    .projects-intro a {
      color: #1a1a1a;
      font-weight: 600;
      text-decoration: underline;
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
      color: #333;
      margin-bottom: 5px;
    }

    .technologies {
      font-size: 13px;
      color: #1a1a1a;
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
      padding-top: 4px;
      border-top: 1px solid #ccc;
      font-size: 10px;
      color: #4a4a4a;
      line-height: 1.4;
      text-align: justify;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
        grid-template-columns: repeat(3, 1fr);
        gap: 5px 8px;
      }

      body.compact-layout .contact-grid:has(> :nth-child(4):last-child) {
        grid-template-columns: repeat(2, 1fr);
      }

      body.compact-layout .contact-item {
        font-size: 12px;
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
      background: #555555;
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
      color: #e8e8e8;
      min-height: 100vh;
      font-variant-emoji: text;
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
      border-top-color: rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.45);
      font-size: 7px;
      line-height: 1.3;
      text-align: left;
    }

    body.sidebar-layout .sidebar-bottom .watermark {
      color: rgba(255,255,255,0.4);
      font-size: 9px;
      text-align: center;
    }

    body.sidebar-layout .sidebar-bottom .watermark a {
      color: rgba(255,255,255,0.55);
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
      border-color: rgba(255,255,255,0.6);
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
      letter-spacing: -0.5px;
    }

    body.sidebar-layout .sidebar-name .title {
      font-size: 14px;
      color: rgba(255,255,255,0.65);
      margin: 0;
      line-height: 1.2;
      font-weight: 400;
      font-style: italic;
    }

    body.sidebar-layout .sidebar-contacts {
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }

    body.sidebar-layout .sidebar-contacts .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      font-size: 11.5px;
      color: rgba(255,255,255,0.8);
      margin-bottom: 6px;
      line-height: 1.3;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    body.sidebar-layout .sidebar-contacts .contact-item:last-child {
      margin-bottom: 0;
    }

    body.sidebar-layout .sidebar-contacts .contact-item i {
      color: rgba(255,255,255,0.7);
      width: 13px;
      font-size: 11px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    body.sidebar-layout .sidebar-contacts .contact-item a {
      color: rgba(255,255,255,0.8);
      word-break: break-all;
    }

    body.sidebar-layout .sidebar-bio {
      margin-bottom: 0;
    }

    body.sidebar-layout .sidebar-bio .bio {
      font-size: 13px;
      line-height: 1.5;
      color: rgba(255,255,255,0.65);
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
      font-variant-emoji: text;
    }

    body.sidebar-layout .main-content section {
      margin-bottom: 17px;
    }

    body.sidebar-layout .main-content h2 {
      font-size: 14.75px;
      border-bottom: 1px solid #1a1a1a;
      padding-bottom: 4px;
      margin-bottom: 8px;
      letter-spacing: 1.5px;
      color: #1a1a1a;
    }

    body.sidebar-layout .main-content .experience-item,
    body.sidebar-layout .main-content .education-item,
    body.sidebar-layout .main-content .project-item {
      margin-bottom: 10px;
      padding-left: 10px;
    }

    body.sidebar-layout .main-content .experience-header,
    body.sidebar-layout .main-content .education-header {
      margin-bottom: 3px;
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
        page-break-after: avoid;
      }

      .experience-item, .education-item, .project-item {
        page-break-inside: avoid;
        page-break-before: auto;
      }

      .skill-category {
        page-break-inside: avoid;
        background: #fafafa;
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

module.exports = { name: 'classic', getStyles, monochromatic: true };
