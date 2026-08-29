(function () {
  var B = window.NotesBlog;
  var grid = document.getElementById('grid');
  var emptyState = document.getElementById('emptyState');
  var state = { platform: 'all', type: 'all', posts: [] };

  /* theme */
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('m1x_blog_theme');
    if (saved) root.classList.toggle('dark', saved === 'dark');
    else root.classList.toggle('dark', !window.matchMedia('(prefers-color-scheme: light)').matches);
  } catch (e) { }
  document.getElementById('themeToggle').addEventListener('click', function () {
    root.classList.toggle('dark');
    try { localStorage.setItem('m1x_blog_theme', root.classList.contains('dark') ? 'dark' : 'light'); } catch (e) { }
  });

  function activeBtnClasses(btn, on) {
    btn.classList.toggle('bg-brand-600', on);
    btn.classList.toggle('text-white', on);
    btn.classList.toggle('text-slate-600', !on);
    btn.classList.toggle('dark:text-slate-300', !on);
  }

  function wireFilter(containerId, key) {
    var btns = document.querySelectorAll('#' + containerId + ' .filter-btn');
    btns.forEach(function (btn) {
      var val = btn.dataset.platform || btn.dataset.type;
      activeBtnClasses(btn, val === state[key]);
      btn.addEventListener('click', function () {
        state[key] = val;
        btns.forEach(function (b) { activeBtnClasses(b, (b.dataset.platform || b.dataset.type) === val); });
        render();
      });
    });
  }

  function platformChip(p) {
    return '<span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">' +
      B.PLATFORM_LABELS[p] + '</span>';
  }

  function cardHTML(post) {
    var thumb = B.cardThumb(post);
    var isHowto = post.type === 'howto';
    var media = thumb
      ? '<div class="relative aspect-video bg-slate-200 dark:bg-white/5 overflow-hidden">' +
      '<img src="' + B.escapeHtml(thumb) + '" alt="" loading="lazy" class="w-full h-full object-cover">' +
      (isHowto ? '<span class="absolute inset-0 flex items-center justify-center">' +
        '<span class="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></span></span>' : '') +
      '</div>'
      : '<div class="aspect-video bg-gradient-to-br from-brand-600/25 to-brand-400/10"></div>';

    var chips = post.platforms.map(platformChip).join(' ');
    var badge = '<span class="text-[11px] font-semibold uppercase tracking-wide ' +
      (isHowto ? 'text-brand-500' : 'text-emerald-500') + '">' + (isHowto ? 'How-To' : 'Article') + '</span>';

    return '' +
      '<article class="filtered-card glass card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col" ' +
      'data-id="' + B.escapeHtml(post.id) + '" data-type="' + post.type + '">' +
      media +
      '<div class="p-5 flex flex-col gap-2 flex-1">' +
      '<div class="flex items-center gap-2">' + badge + '<span class="text-slate-400 dark:text-slate-500 text-xs">' + B.formatDate(post.date) + '</span></div>' +
      '<h3 class="font-semibold text-lg leading-snug">' + B.escapeHtml(post.title) + '</h3>' +
      (post.excerpt ? '<p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">' + B.escapeHtml(post.excerpt) + '</p>' : '') +
      (chips ? '<div class="flex flex-wrap gap-1.5 mt-auto pt-2">' + chips + '</div>' : '') +
      '</div>' +
      '</article>';
  }

  function render() {
    var list = state.posts.filter(function (p) {
      if (!p.published) return false;
      if (state.type !== 'all' && p.type !== state.type) return false;
      if (state.platform !== 'all' && p.platforms.indexOf(state.platform) === -1) return false;
      return true;
    });
    grid.innerHTML = list.map(cardHTML).join('');
    emptyState.classList.toggle('hidden', list.length > 0);

    grid.querySelectorAll('.filtered-card').forEach(function (el) {
      el.addEventListener('click', function () {
        var post = state.posts.filter(function (p) { return p.id === el.dataset.id; })[0];
        if (!post) return;
        if (post.type === 'howto' && B.parseYouTubeId(post.youtubeUrl)) openLightbox(post);
        else window.location.href = 'post.html?slug=' + encodeURIComponent(post.slug);
      });
    });
  }

  /* lightbox */
  var lightbox = document.getElementById('lightbox');
  var frame = document.getElementById('lightboxFrame');
  function openLightbox(post) {
    document.getElementById('lightboxTitle').textContent = post.title;
    frame.src = B.youTubeEmbed(post.youtubeUrl);
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.add('hidden');
    frame.src = '';
    document.body.style.overflow = '';
  }
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) closeLightbox(); });

  wireFilter('platformFilter', 'platform');
  wireFilter('typeFilter', 'type');

  B.loadPosts().then(function (posts) {
    state.posts = posts.sort(function (a, b) { return (a.date < b.date ? 1 : -1); });
    render();
  }).catch(function (err) {
    grid.innerHTML = '<p class="text-slate-500 dark:text-slate-400 col-span-full">Could not load posts. ' + B.escapeHtml(err.message) + '</p>';
  });
})();
