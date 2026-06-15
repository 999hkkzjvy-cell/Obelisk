// ============================================================
// 译林方尖碑 · 共享工具函数
// ============================================================

/** 从 URL 获取查询参数 */
function getUrlParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

/** 根据 ID 获取书籍 */
function getBookById(id) {
  return books.find(b => b.id === id);
}

/** 根据系列获取书籍列表 */
function getBooksBySeries(series) {
  return books.filter(b => b.series === series);
}

/** 获取系列信息 */
function getSeriesInfo(series) {
  return seriesInfo[series] || { name: series, icon: '', desc: '' };
}

/** 渲染豆瓣评分星星 */
function renderStars(rating) {
  if (rating === '—' || !rating) {
    return '<span style="color:var(--ink-lighter);font-size:.85rem">暂无评分</span>';
  }
  const num = parseFloat(rating);
  const fullStars = Math.floor(num);
  const halfStar = num - fullStars >= 0.5;
  let html = '<span class="stars">';
  for (let i = 0; i < fullStars; i++) html += '★';
  if (halfStar) html += '☆';
  html += '</span>';
  html += ` <strong>${rating}</strong>`;
  return html;
}

/** 生成豆瓣链接 */
function getDoubanUrl(book) {
  return `https://book.douban.com/subject/${book.douban}/`;
}

/** 生成京东搜索链接 */
function getJDUrl(book) {
  return `https://search.jd.com/Search?keyword=${encodeURIComponent(book.jd)}`;
}

/** 生成书籍卡片 HTML（用于 catalog 页的网格） */
function renderBookCard(book) {
  const coverSrc = book.coverImage
    ? `images/${book.coverImage}`
    : 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect fill="#e8e0d0" width="200" height="280"/><text x="100" y="140" text-anchor="middle" font-family="serif" font-size="14" fill="#5c5240">${book.title.substring(0,12)}</text></svg>`);

  const badgeHtml = book.series === '方小碑'
    ? '<div class="book-badge">方小碑</div>'
    : book.series === '在故宫'
      ? '<div class="book-badge" style="background:#b5343a">在故宫</div>'
      : '';

  const translatorHtml = book.translator && book.translator !== '—'
    ? `<div><span class="label">译者：</span>${book.translator}</div>`
    : '';

  const numberHtml = book.id.replace(/[^0-9]/g, '');

  return `
    <div class="book-card" data-series="${book.series}" data-year="${book.year}">
      ${badgeHtml}
      <div class="card-top">
        <a href="detail.html?id=${encodeURIComponent(book.id)}" class="book-cover-link">
          <img class="book-cover-img" src="${coverSrc}" alt="${book.title}" loading="lazy" onerror="this.parentElement.classList.add('no-image')">
        </a>
        <div class="book-info">
          <div class="book-number">${numberHtml}</div>
          <h3><a href="detail.html?id=${encodeURIComponent(book.id)}">${book.title}</a></h3>
          <div class="book-meta">
            <div><span class="label">作者：</span>${book.author} ${book.nationality}</div>
            ${translatorHtml}
            <div><span class="label">出版：</span>${book.pubDate}</div>
            <div class="book-rating">⭐ ${book.rating}</div>
          </div>
        </div>
      </div>
      <div class="book-desc">${book.desc}</div>
      <div class="book-links">
        <a href="${getDoubanUrl(book)}" target="_blank" rel="noopener" class="book-link douban">📖 豆瓣</a>
        <a href="${getJDUrl(book)}" target="_blank" rel="noopener" class="book-link jd">🛒 京东</a>
      </div>
    </div>
  `;
}

/** 获取推荐书籍（同作者或同系列的其他高分书籍） */
function getRelatedBooks(book, limit = 4) {
  const sameSeries = books.filter(b => b.series === book.series && b.id !== book.id);
  const sameAuthor = books.filter(b => b.author === book.author && b.id !== book.id);
  // 合并去重，优先评分高的
  const combined = [...new Map([...sameAuthor, ...sameSeries].map(b => [b.id, b])).values()];
  combined.sort((a, b) => {
    const ra = a.rating === '—' ? 0 : parseFloat(a.rating);
    const rb = b.rating === '—' ? 0 : parseFloat(b.rating);
    return rb - ra;
  });
  return combined.slice(0, limit);
}

/** 获取所有系列列表 */
function getAllSeries() {
  return [...new Set(books.map(b => b.series))];
}

/** 生成出版计划卡片 */
function renderPlanCard(item, index, seriesKey) {
  const gradients = [
    'cover-grad-1', 'cover-grad-2', 'cover-grad-3', 'cover-grad-4',
    'cover-grad-5', 'cover-grad-6', 'cover-grad-7', 'cover-grad-8'
  ];
  const grad = gradients[index % gradients.length];

  const seriesNames = {
    '世界史': '方尖碑·世界史',
    '方小碑': '方小碑·文化史',
    '典藏版': '方尖碑·典藏版',
    '在故宫': '在故宫',
    '山海': '山海系列'
  };
  const badgeLabel = seriesNames[seriesKey] || seriesKey;

  return `
    <div class="book-card plan-card">
      <div class="card-top">
        <div class="book-cover-link">
          <div class="book-cover-img plan-cover ${grad}">
            <span>敬请期待</span>
          </div>
        </div>
        <div class="book-info">
          <h3>《${item.title}》</h3>
          <div class="book-meta">
            <div><span class="label">作者：</span>${item.author} ${item.nationality || ''}</div>
          </div>
        </div>
      </div>
      <div class="book-desc">${item.desc}</div>
      <div class="plan-badge-row"><span class="plan-badge-tag">${badgeLabel}</span></div>
    </div>
  `;
}

/** 全站搜索：在 books + plans 中搜索 */
function searchAll(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const results = [];

  // Search published books
  books.forEach(b => {
    if (b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.translator.toLowerCase().includes(q)) {
      results.push({
        type: 'book',
        id: b.id,
        title: b.title,
        author: b.author,
        cover: b.coverImage ? 'images/' + b.coverImage : null,
        url: 'detail.html?id=' + encodeURIComponent(b.id),
        label: getSeriesInfo(b.series).name
      });
    }
  });

  // Search plans
  Object.keys(plans).forEach(key => {
    plans[key].items.forEach(item => {
      if (item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q)) {
        results.push({
          type: 'plan',
          title: item.title,
          author: item.author,
          cover: null,
          url: 'plans.html#' + key,
          label: plans[key].name
        });
      }
    });
  });

  return results.slice(0, 8);
}

/** 初始化导航栏搜索 */
function initNavSearch() {
  const nav = document.querySelector('.site-nav .nav-inner');
  if (!nav || document.querySelector('.nav-search')) return;

  const searchHtml = `
    <div class="nav-search">
      <span class="search-icon">🔍</span>
      <input type="text" id="navSearchInput" placeholder="搜索书名、作者…" autocomplete="off">
      <div class="search-results" id="navSearchResults"></div>
    </div>
  `;

  // Insert search before the toggle button
  const toggle = nav.querySelector('.nav-toggle');
  if (toggle) {
    toggle.insertAdjacentHTML('beforebegin', searchHtml);
  } else {
    nav.insertAdjacentHTML('beforeend', searchHtml);
  }

  const input = document.getElementById('navSearchInput');
  const results = document.getElementById('navSearchResults');
  let activeIndex = -1;

  input.addEventListener('input', function() {
    const hits = searchAll(this.value.trim());
    if (hits.length === 0) {
      results.classList.remove('visible');
      results.innerHTML = '';
      activeIndex = -1;
      return;
    }

    activeIndex = -1;
    results.innerHTML = hits.map((h, i) => {
      const coverHtml = h.cover
        ? `<img class="search-mini-cover" src="${h.cover}" alt="">`
        : `<div class="search-mini-cover" style="background:linear-gradient(135deg,#3a2818,#5c3d2e)"></div>`;
      return `
        <a href="${h.url}" class="search-result-item" data-index="${i}">
          ${coverHtml}
          <div class="search-result-info">
            <div class="srt-title">${h.title}</div>
            <div class="srt-meta">${h.author}</div>
          </div>
          <span class="search-result-badge">${h.label}</span>
        </a>
      `;
    }).join('');
    results.classList.add('visible');
  });

  // Keyboard navigation
  input.addEventListener('keydown', function(e) {
    const items = results.querySelectorAll('.search-result-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); updateActive(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateActive(items); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); items[activeIndex].click(); }
    else if (e.key === 'Escape') { results.classList.remove('visible'); input.blur(); }
  });

  function updateActive(items) {
    items.forEach(i => i.classList.remove('active'));
    if (activeIndex >= 0 && activeIndex < items.length) {
      items[activeIndex].classList.add('active');
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // Click outside to close
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-search')) {
      results.classList.remove('visible');
    }
  });
}

/** 初始化暗色模式切换 */
function initThemeToggle() {
  const nav = document.querySelector('.site-nav .nav-inner');
  if (!nav || document.querySelector('.theme-toggle')) return;

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.title = '切换暗色模式';
  btn.textContent = '🌙';

  const links = nav.querySelector('.nav-links');
  if (links) links.appendChild(btn);

  // Load saved preference
  const saved = localStorage.getItem('obelisk-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    btn.textContent = '☀️';
  }

  btn.addEventListener('click', function() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      btn.textContent = '🌙';
      localStorage.setItem('obelisk-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      btn.textContent = '☀️';
      localStorage.setItem('obelisk-theme', 'dark');
    }
  });
}

/** 获取各系列书籍数量 */
function getSeriesCounts() {
  const counts = {};
  books.forEach(b => {
    counts[b.series] = (counts[b.series] || 0) + 1;
  });
  return counts;
}
