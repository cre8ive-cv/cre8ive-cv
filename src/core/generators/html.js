const { sanitizeUserHtml } = require('../utils/sanitizer');

/**
 * Sanitizes user-provided content for safe HTML insertion.
 * Returns empty string for null/undefined values.
 */
function isolateUserContent(content) {
  if (content === undefined || content === null) return '';
  return sanitizeUserHtml(content);
}

/**
 * Strips HTML tags from content to get clean text.
 * Used for metadata like document title and PDF properties.
 */
function stripHtmlTags(html) {
  if (html === undefined || html === null) return '';
  // Remove HTML tags and decode HTML entities
  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function formatDate(dateStr, labels = {}) {
  if (!dateStr) return labels.present || 'Present';
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}.${year}`;
}

function generateExperienceSection(experience, sectionName = 'Professional Experience', labels = {}) {
  if (!experience || experience.length === 0) return '';
  return `
  <section>
    <h2>${isolateUserContent(sectionName)}</h2>
    ${experience.map(exp => `
      <div class="experience-item">
        <div class="experience-header">
          <div>
            <div class="position">${isolateUserContent(exp.position)}</div>
            <div class="company">${isolateUserContent(exp.company)}</div>
          </div>
          <div class="date-location">
            ${formatDate(exp.startDate, labels)} - ${formatDate(exp.endDate, labels)}
          </div>
        </div>
        ${exp.responsibilities && exp.responsibilities.length > 0 ? `
          <ul>
            ${exp.responsibilities.map(resp => `<li>${isolateUserContent(resp)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}
  </section>`;
}

function generateEducationSection(education, sectionName = 'Education', labels = {}) {
  if (!education || education.length === 0) return '';
  return `
  <section>
    <h2>${isolateUserContent(sectionName)}</h2>
    ${education.map(edu => {
      // Format date range: show "startDate - graduationDate" if startDate exists, otherwise just graduationDate
      const dateDisplay = edu.startDate
        ? `${formatDate(edu.startDate, labels)} - ${formatDate(edu.graduationDate, labels)}`
        : formatDate(edu.graduationDate, labels);

      return `
      <div class="education-item">
        <div class="education-header">
          <div>
            <div class="degree">${isolateUserContent(edu.degree)}${edu.level ? ` <span class="education-level">(${isolateUserContent(edu.level)})</span>` : ''}</div>
            <div class="institution">${isolateUserContent(edu.institution)}</div>
          </div>
          <div class="date-location">${dateDisplay}</div>
        </div>
      </div>
      `;
    }).join('')}
  </section>`;
}

function generateSkillsSection(skills, sectionName = 'Skills & Languages') {
  if (!skills || !Array.isArray(skills) || skills.length === 0) return '';

  // Limit to maximum 4 categories
  const limitedSkills = skills.slice(0, 4);

  return `
  <section>
    <h2>${isolateUserContent(sectionName)}</h2>
    <div class="skills-grid">
      ${limitedSkills.map(category => {
        const fraction = category.fraction || 1;
        return `
        <div class="skill-category" style="flex: ${fraction} 1 0;">
          <h3>${isolateUserContent(category.name)}</h3>
          <div class="skill-tags">
            ${category.items.map(item => `<span class="skill-tag">${isolateUserContent(item)}</span>`).join('')}
          </div>
        </div>
        `;
      }).join('')}
    </div>
  </section>`;
}

function generateProjectsSection(projects, projectsIntro, sectionName = 'Side Projects', labels = {}) {
  if (!projects || projects.length === 0) return '';
  const introLink = projectsIntro?.link ? normalizeUrl(projectsIntro.link) : '';
  const introLinkText = projectsIntro?.link ? stripProtocol(projectsIntro.linkText || projectsIntro.link) : '';
  return `
  <section>
    <h2>${isolateUserContent(sectionName)}</h2>
    ${projectsIntro ? `<p class="projects-intro">${isolateUserContent(projectsIntro.text)} <a href="${introLink}" target="_blank">${isolateUserContent(introLinkText)}</a></p>` : ''}
    <div class="projects-grid">
      ${projects.map(project => `
        <div class="project-item">
          <div class="project-name">${isolateUserContent(project.name)}</div>
          <p class="project-description">${isolateUserContent(project.description)}</p>
          ${project.technologies && project.technologies.length > 0 ? `
            <div class="technologies">${labels.technologies || 'Technologies'}: ${isolateUserContent(project.technologies.join(', '))}</div>
          ` : ''}
          ${project.link ? `
            <div class="project-link-line">${labels.link || 'Link'}: <a href="${normalizeUrl(project.link)}" target="_blank" rel="noopener noreferrer" class="project-link" title="View project">${isolateUserContent(stripProtocol(project.link || ''))} <i class="fas fa-external-link-alt"></i></a></div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </section>`;
}

function normalizeUrl(url) {
  if (!url) return '';
  // If protocol already present, return as is
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
    return url;
  }
  return `https://${url}`;
}

function stripProtocol(url) {
  if (!url) return '';
  return url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
}

function generateHTML(resumeData, photoBase64 = null, theme, colorPalette, customSectionNames = {}, showWatermark = true, labels = {}, tightLayout = false) {
  if (!theme) {
    throw new Error('Theme is required to generate HTML.');
  }
  const { personalInfo } = resumeData;

  // Load theme styles
  const paletteToUse = theme.monochromatic ? undefined : colorPalette;
  const themeStyles = theme.getStyles(paletteToUse);

  // Normalize external links to avoid double protocols
  const contactLinks = {
    email: personalInfo.email,
    phone: personalInfo.phone,
    linkedin: personalInfo.linkedin ? normalizeUrl(personalInfo.linkedin) : '',
    github: personalInfo.github ? normalizeUrl(personalInfo.github) : '',
    website: personalInfo.website ? normalizeUrl(personalInfo.website) : ''
  };

  // Helper to extract slug from social media URLs
  const extractSlug = (url, platform) => {
    if (!url) return '';
    const cleanUrl = stripProtocol(url);
    if (platform === 'linkedin') {
      // Extract /in/username or /company/name
      const match = cleanUrl.match(/linkedin\.com\/(in|company)\/([^\/\?]+)/);
      return match ? `/${match[1]}/${match[2]}` : cleanUrl;
    } else if (platform === 'github') {
      // Extract /username
      const match = cleanUrl.match(/github\.com\/([^\/\?]+)/);
      return match ? `/${match[1]}` : cleanUrl;
    }
    return cleanUrl;
  };

  const contactDisplay = {
    linkedin: extractSlug(contactLinks.linkedin, 'linkedin'),
    github: extractSlug(contactLinks.github, 'github'),
    website: stripProtocol(contactLinks.website)
  };

  // Helper to get section display name
  const getSectionName = (sectionKey) => {
    if (customSectionNames && customSectionNames[sectionKey]) {
      // SECURITY: Sanitize custom section names to prevent XSS
      return isolateUserContent(customSectionNames[sectionKey]);
    }
    const defaultNames = {
      experience: 'Professional Experience',
      education: 'Education',
      skills: 'Skills & Languages',
      projects: 'Side Projects'
    };
    return defaultNames[sectionKey] || sectionKey;
  };

  // Map section names to their generator functions
  const sectionGenerators = {
    experience: generateExperienceSection,
    education: generateEducationSection,
    skills: generateSkillsSection,
    projects: generateProjectsSection
  };

  const personalBio = resumeData.personalInfo ? resumeData.personalInfo.bio : undefined;
  const bio = personalBio || '';

  // Generate sections dynamically based on JSON order
  const sections = Object.keys(resumeData)
    .filter(key => key !== 'personalInfo' && key !== 'projectsIntro' && sectionGenerators[key])
    .map(key => {
      const sectionName = getSectionName(key);
      if (key === 'projects') {
        return sectionGenerators[key](resumeData[key], resumeData.projectsIntro, sectionName, labels);
      }
      return sectionGenerators[key](resumeData[key], sectionName, labels);
    })
    .join('\n');

  // Determine which header sections have content
  const hasContacts = !!(contactLinks.email || contactLinks.phone || contactLinks.linkedin ||
                         contactLinks.github || contactLinks.website || personalInfo.location);
  const hasPhoto = !!photoBase64;
  const headerClassList = [
    bio ? 'has-bio' : 'no-bio',
    hasPhoto ? 'has-photo' : 'no-photo',
    hasContacts ? 'has-contacts' : 'no-contacts'
  ].join(' ');

  // Extract clean name for document title and metadata
  const cleanName = stripHtmlTags(personalInfo.name) || 'Resume';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="${cleanName}">
  <title>${cleanName} – resume</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji">
  <style>${themeStyles}</style>
</head>
<body${tightLayout ? ' class="tight-layout"' : ''}>
  <div class="content-wrapper">
    <header class="${headerClassList}">
      <div class="header-name">
        <h1>${isolateUserContent(personalInfo.name)}</h1>
        ${personalInfo.title ? `<div class="title">${isolateUserContent(personalInfo.title)}</div>` : ''}
      </div>
      ${hasPhoto ? `<div class="header-photo"><img src="${photoBase64}" alt="photo-image" class="profile-photo"></div>` : ''}
      ${hasContacts ? `<div class="header-contacts">
        <div class="contact-grid">
          ${contactLinks.email ? `<span class="contact-item"><i class="fas fa-envelope"></i><a href="mailto:${contactLinks.email}">${isolateUserContent(contactLinks.email)}</a></span>` : ''}
          ${contactLinks.phone ? `<span class="contact-item"><i class="fas fa-phone"></i><a href="tel:${contactLinks.phone}">${isolateUserContent(contactLinks.phone)}</a></span>` : ''}
          ${contactLinks.linkedin ? `<span class="contact-item"><i class="fab fa-linkedin"></i><a href="${contactLinks.linkedin}" target="_blank">${isolateUserContent(contactDisplay.linkedin)}</a></span>` : ''}
          ${contactLinks.github ? `<span class="contact-item"><i class="fab fa-github"></i><a href="${contactLinks.github}" target="_blank">${isolateUserContent(contactDisplay.github)}</a></span>` : ''}
          ${contactLinks.website ? `<span class="contact-item"><i class="fas fa-globe"></i><a href="${contactLinks.website}" target="_blank">${isolateUserContent(contactDisplay.website)}</a></span>` : ''}
          ${personalInfo.location ? `<span class="contact-item"><i class="fas fa-map-marker-alt"></i>${isolateUserContent(personalInfo.location)}</span>` : ''}
        </div>
      </div>` : ''}
      ${bio ? `<div class="header-bio">
        <p class="bio">${isolateUserContent(bio)}</p>
      </div>` : ''}
    </header>

${sections}
  </div>

${resumeData.gdprClause || showWatermark ? `<div class="gdpr-watermark-wrapper">
${resumeData.gdprClause ? `<div class="gdpr-clause">${isolateUserContent(resumeData.gdprClause)}</div>` : ''}
${showWatermark ? '<div class="watermark" style="text-transform: none !important;">Designed with <a href="https://cre8ive.cv" target="_blank" rel="noopener noreferrer">cre8ive.cv</a></div>' : ''}
</div>` : ''}
</body>
</html>`;
}

module.exports = { generateHTML };
