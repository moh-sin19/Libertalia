// Sidebar toggle
(function () {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;

  const stored = localStorage.getItem('sidebarExpanded');
  if (stored === 'true') {
    sidebar.classList.remove('collapsed');
    sidebar.classList.add('expanded');
  }

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('expanded');
    localStorage.setItem('sidebarExpanded', sidebar.classList.contains('expanded'));
  });
})();

// Profile picture auto-submit
(function () {
  const input = document.getElementById('profilePictureInput');
  if (!input) return;
  input.addEventListener('change', () => {
    if (input.files.length) document.getElementById('profileUploadForm').submit();
  });
})();

// Post modal
(function () {
  const modal = document.getElementById('postModal');
  const openBtn = document.getElementById('openPostModal');
  const closeBtn = document.getElementById('closePostModal');
  if (!modal || !openBtn) return;

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
})();

// Location autocomplete via OpenStreetMap Nominatim
(function () {
  const input = document.getElementById('location');
  const list = document.getElementById('locationSuggestions');
  if (!input || !list) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length < 3) {
      list.innerHTML = '';
      list.classList.remove('visible');
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const results = await res.json();
        list.innerHTML = '';
        results.forEach((place) => {
          const li = document.createElement('li');
          li.textContent = place.display_name;
          li.addEventListener('click', () => {
            input.value = place.display_name;
            list.innerHTML = '';
            list.classList.remove('visible');
          });
          list.appendChild(li);
        });
        list.classList.toggle('visible', results.length > 0);
      } catch {
        list.classList.remove('visible');
      }
    }, 400);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.location-group')) {
      list.classList.remove('visible');
    }
  });
})();
