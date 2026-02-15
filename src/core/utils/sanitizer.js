const escapeHtml = require('escape-html');

let sanitizeHtmlLib = null;
try {
  // Prefer the sanitize-html package for robust sanitization
  sanitizeHtmlLib = require('sanitize-html');
} catch (error) {
  sanitizeHtmlLib = null;
}

const DEFAULT_ALLOWED_TAGS = [
  'a',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'br',
  'p',
  'span',
  'div',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'sup',
  'sub',
  // Safe SVG elements
  'svg',
  'path',
  'polyline',
  'polygon',
  'line',
  'circle',
  'ellipse',
  'rect',
  'g'
];

const SVG_PRESENTATION_ATTRS = [
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity', 'stroke-opacity'
];

const DEFAULT_ALLOWED_ATTRIBUTES = {
  '*': ['style', 'class', 'data-label', 'data-icon'],
  a: ['href', 'target', 'rel', 'title'],
  code: ['class'],
  span: ['data-label', 'data-icon'],
  div: ['data-label', 'data-icon'],
  // SVG element attributes
  svg: ['xmlns', 'viewbox', 'width', 'height', ...SVG_PRESENTATION_ATTRS],
  path: ['d', ...SVG_PRESENTATION_ATTRS],
  polyline: ['points', ...SVG_PRESENTATION_ATTRS],
  polygon: ['points', ...SVG_PRESENTATION_ATTRS],
  line: ['x1', 'y1', 'x2', 'y2', ...SVG_PRESENTATION_ATTRS],
  circle: ['cx', 'cy', 'r', ...SVG_PRESENTATION_ATTRS],
  ellipse: ['cx', 'cy', 'rx', 'ry', ...SVG_PRESENTATION_ATTRS],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry', ...SVG_PRESENTATION_ATTRS],
  g: [...SVG_PRESENTATION_ATTRS]
};

const BLOCKED_TAGS = ['script', 'style', 'iframe', 'object', 'embed'];

function sanitizeWithLibrary(input) {
  if (!sanitizeHtmlLib) {
    return null;
  }

  const options = {
    allowedTags: DEFAULT_ALLOWED_TAGS,
    allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
    textFilter: text => text,
    allowedSvgTags: ['svg', 'path', 'polyline', 'polygon', 'line', 'circle', 'ellipse', 'rect', 'g'],
    allowedSvgAttributes: ['viewBox', 'width', 'height', 'xmlns', 'fill', 'stroke', 'stroke-width',
      'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
      'opacity', 'fill-opacity', 'stroke-opacity',
      'd', 'points', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y']
  };

  return sanitizeHtmlLib(input, options);
}

function sanitizeWithFallback(value) {
  const blockedTagPattern = new RegExp(
    `<\\s*(${BLOCKED_TAGS.join('|')})[^>]*>[\\s\\S]*?<\\/\\s*\\1\\s*>`,
    'gi'
  );

  const SELF_CLOSING_TAGS = new Set(['br']);
  const allowedTags = new Set(DEFAULT_ALLOWED_TAGS);
  const globalAllowedAttributes = new Set(DEFAULT_ALLOWED_ATTRIBUTES['*'] || []);

  function sanitizeStyle(styleValue) {
    const forbiddenPatterns = [/expression\s*\(/gi, /url\s*\(/gi, /javascript\s*:/gi, /@import/gi];
    let sanitized = styleValue;
    forbiddenPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    return sanitized.trim();
  }

  function sanitizeUrl(urlValue) {
    const trimmed = urlValue.trim();
    if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
      return escapeHtml(trimmed);
    }
    return null;
  }

  function sanitizeAttributeValue(attrName, rawValue) {
    const value = rawValue.trim();
    if (!value) {
      return null;
    }
    if (attrName === 'style') {
      const sanitizedStyle = sanitizeStyle(value);
      return sanitizedStyle ? escapeHtml(sanitizedStyle) : null;
    }
    if (attrName === 'class' || attrName.startsWith('data-')) {
      return escapeHtml(value.replace(/[^a-zA-Z0-9_\- ]+/g, ''));
    }
    if (attrName === 'href') {
      return sanitizeUrl(value);
    }
    return escapeHtml(value);
  }

  function sanitizeAttributes(tagName, rawAttributes) {
    if (!rawAttributes) {
      return [];
    }

    const attrs = [];
    const attrRegex = /([a-zA-Z0-9:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let match;

    while ((match = attrRegex.exec(rawAttributes)) !== null) {
      const attrName = match[1].toLowerCase();
      const isAllowed =
        globalAllowedAttributes.has(attrName) ||
        (DEFAULT_ALLOWED_ATTRIBUTES[tagName] && DEFAULT_ALLOWED_ATTRIBUTES[tagName].includes(attrName)) ||
        attrName.startsWith('data-');

      if (!isAllowed) {
        continue;
      }

      const rawValue = match[2] ?? match[3] ?? match[4] ?? '';
      const sanitizedValue = sanitizeAttributeValue(attrName, rawValue);
      if (sanitizedValue === null) {
        continue;
      }

      attrs.push(`${attrName}="${sanitizedValue}"`);
    }

    return attrs;
  }

  function sanitizeTag(rawTag, rawTagName, rawAttributes = '') {
    const tagName = rawTagName.toLowerCase();
    if (!allowedTags.has(tagName)) {
      return '';
    }

    const isClosingTag = rawTag.startsWith('</');
    const isSelfClosing = SELF_CLOSING_TAGS.has(tagName);

    if (isClosingTag) {
      return isSelfClosing ? '' : `</${tagName}>`;
    }

    const allowedAttributes = sanitizeAttributes(tagName, rawAttributes);
    const attributesString = allowedAttributes.length ? ` ${allowedAttributes.join(' ')}` : '';
    return `<${tagName}${attributesString}>`;
  }

  const withoutBlockedTags = value.replace(blockedTagPattern, '');
  const tagRegex = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;
  let lastIndex = 0;
  let match;
  let result = '';

  while ((match = tagRegex.exec(withoutBlockedTags)) !== null) {
    const [fullMatch, rawTagName, rawAttributes = ''] = match;
    const textChunk = withoutBlockedTags.slice(lastIndex, match.index);
    result += escapeHtml(textChunk);

    const sanitizedTag = sanitizeTag(fullMatch, rawTagName, rawAttributes);
    if (sanitizedTag) {
      result += sanitizedTag;
    }

    lastIndex = tagRegex.lastIndex;
  }

  result += escapeHtml(withoutBlockedTags.slice(lastIndex));
  return result;
}

function sanitizeUserHtml(content) {
  if (content === undefined || content === null) {
    return '';
  }

  const input = String(content);
  const libraryResult = sanitizeWithLibrary(input);
  if (libraryResult !== null) {
    return libraryResult;
  }

  return sanitizeWithFallback(input);
}

/**
 * Validates that photoBase64 is a legitimate image data URI
 * Prevents injection attacks via malicious data URIs
 * @param {string} photoBase64 - The base64 photo string to validate
 * @returns {string|null} - Returns the photoBase64 if valid, null if empty/null
 * @throws {Error} - Throws if photoBase64 is invalid or malicious
 */
function validatePhotoBase64(photoBase64) {
  // Allow null/undefined/empty string
  if (!photoBase64) {
    return null;
  }

  // Convert to string and trim
  const photo = String(photoBase64).trim();

  if (!photo) {
    return null;
  }

  // Must start with data:image/ prefix
  if (!photo.startsWith('data:image/')) {
    throw new Error('Invalid photo format: must be a data:image URI');
  }

  // Extract and validate the data URI structure
  // Format: data:image/<type>;base64,<data>
  const dataUriPattern = /^data:image\/(png|jpeg|jpg|gif|webp|bmp|svg\+xml);base64,([A-Za-z0-9+/]+=*)$/;
  const match = photo.match(dataUriPattern);

  if (!match) {
    throw new Error('Invalid photo format: must be data:image/<type>;base64,<base64-data>');
  }

  const imageType = match[1];
  const base64Data = match[2];

  // Validate base64 data length (not empty)
  if (base64Data.length < 10) {
    throw new Error('Invalid photo: base64 data too short');
  }

  // Validate base64 padding is correct
  const paddingCount = (base64Data.match(/=/g) || []).length;
  if (paddingCount > 2) {
    throw new Error('Invalid photo: malformed base64 padding');
  }

  // For SVG, perform additional security checks
  if (imageType === 'svg+xml') {
    try {
      // Decode base64 to check SVG content
      const svgContent = Buffer.from(base64Data, 'base64').toString('utf-8');

      // Block any SVG containing script tags or event handlers
      const dangerousPatterns = [
        /<script[\s>]/i,
        /javascript:/i,
        /on\w+\s*=/i, // onload, onerror, onclick, etc.
        /<iframe[\s>]/i,
        /<embed[\s>]/i,
        /<object[\s>]/i,
        /data:text\/html/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(svgContent)) {
          throw new Error('Invalid photo: SVG contains potentially harmful content');
        }
      }
    } catch (err) {
      if (err.message.includes('SVG contains')) {
        throw err;
      }
      // If base64 decode fails, it's invalid
      throw new Error('Invalid photo: corrupted base64 data');
    }
  }

  // Optional: Validate base64 decodes without errors for non-SVG images
  if (imageType !== 'svg+xml') {
    try {
      const decoded = Buffer.from(base64Data, 'base64');

      // Check minimum size (valid images are at least a few dozen bytes)
      // Very tiny images (< 50 bytes) are likely malformed or malicious
      if (decoded.length < 50) {
        throw new Error('Invalid photo: decoded image too small');
      }

      // Verify magic bytes for common image formats
      const magicBytes = {
        png: [0x89, 0x50, 0x4E, 0x47],
        jpeg: [0xFF, 0xD8, 0xFF],
        gif: [0x47, 0x49, 0x46],
        webp: [0x52, 0x49, 0x46, 0x46], // RIFF
        bmp: [0x42, 0x4D]
      };

      let validMagic = false;

      if (imageType === 'png' && decoded.length >= 4) {
        validMagic = magicBytes.png.every((byte, i) => decoded[i] === byte);
      } else if (imageType === 'jpeg' || imageType === 'jpg') {
        validMagic = decoded.length >= 3 && magicBytes.jpeg.every((byte, i) => decoded[i] === byte);
      } else if (imageType === 'gif' && decoded.length >= 3) {
        validMagic = magicBytes.gif.every((byte, i) => decoded[i] === byte);
      } else if (imageType === 'webp' && decoded.length >= 4) {
        validMagic = magicBytes.webp.every((byte, i) => decoded[i] === byte);
      } else if (imageType === 'bmp' && decoded.length >= 2) {
        validMagic = magicBytes.bmp.every((byte, i) => decoded[i] === byte);
      }

      if (!validMagic) {
        throw new Error(`Invalid photo: file content does not match declared type ${imageType}`);
      }
    } catch (err) {
      if (err.message.includes('Invalid photo:')) {
        throw err;
      }
      throw new Error('Invalid photo: corrupted or invalid base64 data');
    }
  }

  // All checks passed
  return photo;
}

module.exports = { sanitizeUserHtml, validatePhotoBase64 };
