(() => {
  const buildPlaceholderPage = (title, description) => `<!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #eef4ff, #f7f9fc);
            font-family: Arial, sans-serif;
            color: #17324d;
          }
          .card {
            max-width: 560px;
            background: rgba(255,255,255,0.9);
            border-radius: 18px;
            padding: 32px 28px;
            box-shadow: 0 18px 40px rgba(21, 42, 73, 0.08);
            text-align: center;
          }
          .pill {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            background: #e9f2ff;
            color: #2363d3;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          h1 {
            margin: 0 0 12px;
            font-size: 28px;
          }
          p {
            margin: 0;
            line-height: 1.6;
            color: #49627d;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="pill">LegalPath</span>
          <h1>${title}</h1>
          <p>${description}</p>
        </div>
      </body>
    </html>`;

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
    },
    notifications: {
      title: 'Thông báo',
      content: buildPlaceholderPage('Thông báo', 'Trang thông báo đang được chuẩn bị. Vui lòng quay lại sau hoặc dùng các mục hiện có trong hệ thống.')
    },
    settings: {
      title: 'Cài đặt',
      content: buildPlaceholderPage('Cài đặt', 'Phần cài đặt sẽ sớm có các tùy chọn quản lý tài khoản, ngôn ngữ và cảnh báo.')
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

      if (page.content) {
        frame.srcdoc = page.content;
      } else {
        frame.src = page.path;
      }
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