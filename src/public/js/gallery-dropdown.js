// Gallery Dropdown — lazy-loads templates on first hover/touch
(function () {
  let initialized = false;
  let templatesCache = null;

  function forceCloseDropdown(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove('is-open');
    wrapper.classList.add('is-locked-closed');
    const onLeave = () => wrapper.classList.remove('is-locked-closed');
    wrapper.addEventListener('mouseleave', onLeave, { once: true });
    // Touch devices don't emit mouseleave reliably; ensure the lock clears
    wrapper.addEventListener('touchend', onLeave, { once: true });
    setTimeout(onLeave, 400);
  }

  // Touch device with enough width to show the dropdown (tablet)
  function isTabletTouch() {
    return window.matchMedia('(pointer: coarse) and (min-width: 701px)').matches;
  }

  function isMobile() {
    return window.matchMedia('(max-width: 700px)').matches;
  }

  function shouldToggleViaClick() {
    return isMobile() || isTabletTouch();
  }

  function buildSkeletons(grid, count) {
    grid.innerHTML = Array(count)
      .fill('<div class="gallery-dropdown-skeleton" aria-hidden="true"></div>')
      .join('');
  }

  function buildItems(grid, templates) {
    grid.innerHTML = '';

    if (!templates || templates.length === 0) {
      grid.innerHTML += '<p class="gallery-dropdown-error">No templates found.</p>';
      return;
    }

    templates.forEach(template => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-dropdown-item';
      btn.setAttribute('role', 'menuitem');
      btn.setAttribute('title', template.label);

      const img = document.createElement('img');
      img.src = '/gallery/' + template.folder + '/' + template.image;
      img.alt = template.label;
      img.loading = 'lazy';
      img.decoding = 'async';

      const label = document.createElement('div');
      label.className = 'gallery-dropdown-item-label';
      label.textContent = template.label;

      btn.appendChild(img);
      btn.appendChild(label);

      btn.addEventListener('click', async () => {
        const loaded = await loadTemplateFromGallery(template);
        if (loaded) {
          const wrapper = document.getElementById('galleryDropdownWrapper');
          forceCloseDropdown(wrapper);
          const link = wrapper.querySelector('.gallery-link');
          if (link) {
            link.blur();
          }
        }
      });

      grid.appendChild(btn);
    });
  }

  async function fetchAndRender(grid) {
    buildSkeletons(grid, 6);

    try {
      if (!templatesCache) {
        const res = await fetch('/api/gallery/templates');
        if (!res.ok) throw new Error('Network error');
        templatesCache = await res.json();
      }
      buildItems(grid, templatesCache);
    } catch (err) {
      console.error('Gallery dropdown: failed to load templates', err);
      grid.innerHTML = '<p class="gallery-dropdown-error">Could not load templates.</p>';
      initialized = false; // allow retry on next hover
    }
  }

  function init() {
    const wrapper = document.getElementById('galleryDropdownWrapper');
    const grid = document.getElementById('galleryDropdownGrid');
    if (!wrapper || !grid) return;

    // Lazy-load on first mouseenter (desktop only — tablet uses touch, mobile has no dropdown)
    wrapper.addEventListener('mouseenter', () => {
      if (isMobile() || isTabletTouch()) return;
      if (initialized) return;
      initialized = true;
      fetchAndRender(grid);
    }, { once: false });

    // Also handle focus (keyboard nav) — load on first focusin inside wrapper (desktop only)
    wrapper.addEventListener('focusin', () => {
      if (isMobile() || isTabletTouch()) return;
      if (initialized) return;
      initialized = true;
      fetchAndRender(grid);
    }, { once: false });

    // Tablet: tap the gallery-link to toggle dropdown (no hover, no navigation)
    const link = wrapper.querySelector('.gallery-link');
    if (link) {
      link.addEventListener('click', e => {
        if (!shouldToggleViaClick()) return;
        e.preventDefault();
        const isOpen = wrapper.classList.contains('is-open');
        if (!isOpen) {
          wrapper.classList.add('is-open');
          if (!initialized) {
            initialized = true;
            fetchAndRender(grid);
          }
        } else {
          wrapper.classList.remove('is-open');
        }
      });
    }

    // Tablet/Mobile: close dropdown when tapping outside the wrapper
    document.addEventListener('click', e => {
      if (!shouldToggleViaClick()) return;
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('is-open');
      }
    });

    // Close on Escape
    wrapper.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        wrapper.classList.remove('is-open');
        const l = wrapper.querySelector('.gallery-link');
        if (l) l.blur();
      }
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
