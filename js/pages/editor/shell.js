(() => {
  const pages = {
    queue: {
      title: 'Hàng đợi duyệt',
      path: '/pages/editor/editor-review-queue.html'
    },
    sources: {
      title: 'Quản lý nguồn',
      path: '/pages/editor/editor-source-management.html'
    },
    monitor: {
      title: 'Theo dõi độ mới',
      path: '/pages/editor/editor-freshness-monitor.html'
    }
  };

  const frame = document.querySelector('#pageFrame');
  const loading = document.querySelector('#pageLoading');
  const title = document.querySelector('#pageTitle');
  const links = [...document.querySelectorAll('.nav-link[data-page]')];
  let currentPage;

  function showPage(pageName) {
    const page = pages[pageName] ? pageName : 'sources';
    title.textContent = pages[page].title;

    links.forEach((link) => {
      const active = link.dataset.page === page;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (currentPage !== page) {
      currentPage = page;
      loading.hidden = false;
      frame.title = pages[page].title;
      frame.setAttribute('aria-busy', 'true');
      frame.hidden = true;
      frame.src = pages[page].path;
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

  showPage(window.location.hash.slice(1) || 'queue');
})();