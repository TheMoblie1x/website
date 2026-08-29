(function () {
  var B = window.NotesBlog;
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('m1x_blog_theme');
    if (saved) root.classList.toggle('dark', saved === 'dark');
    else root.classList.toggle('dark', !window.matchMedia('(prefers-color-scheme: light)').matches);
  } catch (e) { }

  var params = new URLSearchParams(location.search);
  var slug = params.get('slug');
  var isPreview = params.get('preview') === '1';
  var elArticle = document.getElementById('article');
  var CANON = 'https://www.mobile1x.com/notes/blogs/';

  function notFound(msg) {
    elArticle.innerHTML = '<h1 class="font-serif-custom text-3xl">Post not found</h1>' +
      '<p class="mt-3 text-slate-600 dark:text-slate-400">' + B.escapeHtml(msg || 'That post does not exist or was unpublished.') + '</p>';
  }

  function previewBanner() {
    var bar = document.createElement('div');
    bar.className = 'fixed top-0 inset-x-0 z-50 bg-amber-500 text-black text-center text-sm font-semibold py-1.5';
    bar.textContent = 'PREVIEW — draft, not published. Close this tab when done.';
    document.body.appendChild(bar);
    document.body.style.paddingTop = '2rem';
  }

  function renderPost(post) {

    document.title = post.title + ' — Notes by Mobile1X';
    setMeta('description', post.excerpt || ('A guide from the Notes by Mobile1X blog: ' + post.title));
    setProp('og:title', post.title);
    setProp('og:description', post.excerpt || post.title);
    var url = CANON + 'post.html?slug=' + encodeURIComponent(post.slug);
    setProp('og:url', url);
    document.getElementById('canonical').href = url;

    var vid = B.parseYouTubeId(post.youtubeUrl);
    var videoHTML = vid
      ? '<div class="relative w-full rounded-xl overflow-hidden bg-black mb-8" style="padding-top:56.25%">' +
      '<iframe class="absolute inset-0 w-full h-full" src="https://www.youtube-nocookie.com/embed/' + vid + '?rel=0&modestbranding=1" title="' + B.escapeHtml(post.title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'
      : '';

    var chips = post.platforms.map(function (p) {
      return '<span class="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">' + B.PLATFORM_LABELS[p] + '</span>';
    }).join(' ');

    elArticle.innerHTML =
      '<div class="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">' +
      '<span class="font-semibold uppercase tracking-wide ' + (post.type === 'howto' ? 'text-brand-500' : 'text-emerald-500') + '">' +
      (post.type === 'howto' ? 'How-To' : 'Article') + '</span><span>&middot;</span><span>' + B.formatDate(post.date) + '</span></div>' +
      '<h1 class="font-serif-custom text-4xl sm:text-5xl mt-3 leading-tight">' + B.escapeHtml(post.title) + '</h1>' +
      (chips ? '<div class="flex flex-wrap gap-1.5 mt-4">' + chips + '</div>' : '') +
      '<div class="mt-8">' + videoHTML +
      '<div class="prose-notes">' + B.renderMarkdown(post.body) + '</div>' +
      '</div>';

    injectLd({
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: post.title, datePublished: post.date, dateModified: post.date,
      description: post.excerpt || post.title, url: url,
      author: { '@type': 'Organization', name: 'Mobile1X', url: 'https://www.mobile1x.com/' },
      publisher: { '@type': 'Organization', name: 'Mobile1X', url: 'https://www.mobile1x.com/' },
      mainEntityOfPage: url
    });
  }

  if (isPreview) {
    previewBanner();
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem('m1x_blog_preview') || 'null'); } catch (e) { }
    if (!draft) { notFound('No draft to preview. Open the preview from the editor.'); return; }
    renderPost(B.normalisePost(draft));
    return;
  }

  if (!slug) { notFound('No post was specified.'); return; }

  B.loadPosts().then(function (posts) {
    var post = posts.filter(function (p) { return p.slug === slug && p.published; })[0];
    if (!post) { notFound(); return; }
    renderPost(post);
  }).catch(function (err) { notFound(err.message); });

  function setMeta(name, val) {
    var m = document.querySelector('meta[name="' + name + '"]');
    if (m) m.setAttribute('content', val);
  }
  function setProp(prop, val) {
    var m = document.querySelector('meta[property="' + prop + '"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('property', prop); document.head.appendChild(m); }
    m.setAttribute('content', val);
  }
  function injectLd(obj) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }
})();
