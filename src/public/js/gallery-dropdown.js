// Gallery Dropdown — lazy-loads templates on first hover
(function () {
  let initialized = false;
  let templatesCache = null;

  function buildSkeletons(grid, count) {
    grid.innerHTML = Array(count)
      .fill('<div class="gallery-dropdown-skeleton" aria-hidden="true"></div>')
      .join('');
  }

  function buildStarterCard(grid) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gallery-dropdown-item gallery-dropdown-item--starter';
    btn.setAttribute('role', 'menuitem');
    btn.setAttribute('title', 'Starter Demo');

    btn.innerHTML = `
      <div class="gallery-dropdown-starter-body" aria-hidden="true">
        <span class="gallery-dropdown-starter-icon">🚀</span>
      </div>
      <div class="gallery-dropdown-item-label">Starter Demo</div>
    `;

    btn.addEventListener('click', () => {
      if (state.templateLoaded) {
        const confirmed = confirm('Are you sure you want to load a new template? Your current data will be lost. This action cannot be undone.');
        if (!confirmed) return;
      }
      loadExampleData();
    });

    grid.appendChild(btn);
  }

  function buildItems(grid, templates) {
    grid.innerHTML = '';

    buildStarterCard(grid);

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

      btn.addEventListener('click', () => {
        loadTemplateFromGallery(template);
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

    // Lazy-load on first mouseenter
    wrapper.addEventListener('mouseenter', () => {
      if (initialized) return;
      initialized = true;
      fetchAndRender(grid);
    }, { once: false });

    // Also handle focus (keyboard nav) — load on first focusin inside wrapper
    wrapper.addEventListener('focusin', () => {
      if (initialized) return;
      initialized = true;
      fetchAndRender(grid);
    }, { once: false });

    // Close on Escape
    wrapper.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const link = wrapper.querySelector('.gallery-link');
        if (link) link.blur();
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
