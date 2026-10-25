(() => {
  const pages = {
    queue: {
      title: 'Hàng đợi duyệt',
      path: '../File/hangdoiduyet/hangdoiduyet.html'
    },
    sources: {
      title: 'Quản lý nguồn',
      path: '../File/quanlynguon/quanlynguon.html'
    },
    monitor: {
      title: 'Theo dõi độ mới',
      path: '../File/theodoichedomoi/theodoichedomoi.html'
    }
  };

  const frame = document.querySelector('#pageFrame');
  const loading = document.querySelector('#pageLoading');
  const title = document.querySelector('#pageTitle');
  const links = [...document.querySelectorAll('.nav-link[data-page]')];
  let currentPage;

  function showPage(pageName) {
    const pageKey = pages[pageName] ? pageName : 'sources';
    const page = pages[pageKey];
    title.textContent = page.title;

    links.forEach((link) => {
      const active = link.dataset.page === pageKey;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (currentPage !== pageKey) {
      currentPage = pageKey;
      loading.hidden = false;
      frame.title = page.title;
      frame.setAttribute('aria-busy', 'true');
      frame.hidden = true;
      frame.src = '';
      frame.removeAttribute('srcdoc');
      frame.src = page.path;
    }
  }

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const hash = `#${link.dataset.page}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      } else {
        showPage(link.dataset.page);
      }
    });
  });

  frame.addEventListener('load', () => {
    loading.hidden = true;
    frame.removeAttribute('aria-busy');
    frame.hidden = false;
  });

  frame.addEventListener('error', () => {
    currentPage = undefined;
    loading.hidden = false;
    frame.removeAttribute('aria-busy');
    loading.textContent = 'Không tải được trang. Hãy kiểm tra Live Server và thử tải lại.';
  });

  window.addEventListener('hashchange', () => {
    showPage(window.location.hash.slice(1));
  });

  showPage(window.location.hash.slice(1) || 'sources');
})();