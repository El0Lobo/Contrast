(() => {
  const assets = window.CONTRAST_ASSETS || [];
  const grid = document.querySelector('#asset-grid');
  const template = document.querySelector('#asset-card-template');
  const search = document.querySelector('#asset-search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const count = document.querySelector('#visible-count');
  const status = document.querySelector('#asset-status');
  const empty = document.querySelector('#asset-empty');
  const dialog = document.querySelector('#asset-dialog');
  let activeFilter = 'all';

  const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif']);

  function matchesFilter(asset) {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'image') return asset.kind === 'image' && !asset.isIcon;
    if (activeFilter === 'icon') return asset.isIcon;
    return asset.kind === activeFilter;
  }

  function copyPath(path, button) {
    navigator.clipboard.writeText(path).then(() => {
      const oldText = button.textContent;
      button.textContent = 'Copied';
      window.setTimeout(() => { button.textContent = oldText; }, 1200);
    });
  }

  function openPreview(asset) {
    const preview = dialog.querySelector('.dialog-preview');
    preview.replaceChildren();
    if (imageExtensions.has(asset.extension)) {
      const image = new Image();
      image.src = asset.path;
      image.alt = asset.name;
      preview.append(image);
    } else {
      const icon = document.createElement('span');
      icon.className = 'asset-file-icon';
      icon.dataset.extension = asset.extension.toUpperCase();
      preview.append(icon);
    }
    dialog.querySelector('.dialog-type').textContent = `${asset.extension} · ${asset.sizeLabel}`;
    dialog.querySelector('.dialog-name').textContent = asset.name;
    dialog.querySelector('.dialog-path').textContent = asset.path;
    dialog.querySelector('.dialog-open').href = asset.path;
    const dialogDownload = dialog.querySelector('.dialog-download');
    dialogDownload.href = asset.path;
    dialogDownload.download = asset.name;
    dialog.querySelector('.dialog-copy').onclick = event => copyPath(asset.path, event.currentTarget);
    dialog.showModal();
  }

  function createCard(asset) {
    const card = template.content.firstElementChild.cloneNode(true);
    const preview = card.querySelector('.asset-preview');
    const previewIcon = card.querySelector('.asset-file-icon');
    card.querySelector('.asset-name').textContent = asset.name;
    card.querySelector('.asset-path').textContent = asset.path.replace(/^assets\//, '');
    preview.setAttribute('aria-label', `Preview ${asset.name}`);

    if (imageExtensions.has(asset.extension)) {
      const image = new Image();
      image.src = asset.path;
      image.alt = '';
      image.loading = 'lazy';
      preview.prepend(image);
      previewIcon.remove();
    } else {
      previewIcon.dataset.extension = asset.extension.toUpperCase();
    }

    preview.addEventListener('click', () => openPreview(asset));
    card.querySelector('.asset-copy').addEventListener('click', event => copyPath(asset.path, event.currentTarget));
    const download = card.querySelector('.asset-download');
    download.href = asset.path;
    download.download = asset.name;
    return card;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = assets.filter(asset => {
      const searchText = `${asset.name} ${asset.path} ${asset.extension} ${asset.kind}`.toLocaleLowerCase();
      return matchesFilter(asset) && (!query || searchText.includes(query));
    });

    grid.replaceChildren(...visible.map(createCard));
    count.textContent = visible.length;
    status.textContent = query || activeFilter !== 'all'
      ? `Showing ${visible.length} of ${assets.length}`
      : `${assets.length} reusable files`;
    empty.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;
  }

  search.addEventListener('input', render);
  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => filter.classList.toggle('is-active', filter === button));
    render();
  }));
  empty.querySelector('button').addEventListener('click', () => {
    search.value = '';
    activeFilter = 'all';
    filters.forEach(filter => filter.classList.toggle('is-active', filter.dataset.filter === 'all'));
    search.focus();
    render();
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && document.activeElement !== search) {
      event.preventDefault();
      search.focus();
    }
  });

  render();
})();
