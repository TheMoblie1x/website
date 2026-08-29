/* Shared helpers for the Notes blog (public gallery, post page, editor). */
(function (root) {
  'use strict';

  var PLATFORMS = ['android', 'ios', 'web'];
  var PLATFORM_LABELS = { android: 'Android', ios: 'iOS', web: 'Web' };

  function parseYouTubeId(url) {
    if (!url) return '';
    var m = String(url).match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
    return '';
  }

  function youTubeThumb(url) {
    var id = parseYouTubeId(url);
    return id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : '';
  }

  function youTubeEmbed(url) {
    var id = parseYouTubeId(url);
    return id
      ? 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1'
      : '';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function normalisePost(p) {
    p = p || {};
    return {
      id: String(p.id || Date.now()),
      type: p.type === 'howto' ? 'howto' : 'blog',
      title: p.title || 'Untitled',
      slug: p.slug || slugify(p.title || 'untitled'),
      platforms: (Array.isArray(p.platforms) ? p.platforms : []).filter(function (x) {
        return PLATFORMS.indexOf(x) !== -1;
      }),
      excerpt: p.excerpt || '',
      thumbnail: p.thumbnail || '',
      youtubeUrl: p.youtubeUrl || '',
      body: p.body || '',
      date: p.date || new Date().toISOString().slice(0, 10),
      published: p.published !== false
    };
  }

  function slugify(s) {
    return String(s)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function cardThumb(post) {
    return post.thumbnail || youTubeThumb(post.youtubeUrl) || '';
  }

  function formatDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function renderMarkdown(md) {
    if (root.marked) {
      if (!renderMarkdown._init) {
        root.marked.setOptions({ gfm: true, breaks: true });
        renderMarkdown._init = true;
      }
      return root.marked.parse(md || '');
    }
    return escapeHtml(md || '');
  }

  function loadPosts(url) {
    return fetch(url || 'data/posts.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('posts.json ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var list = (data && data.posts) || [];
        return list.map(normalisePost);
      });
  }

  root.NotesBlog = {
    PLATFORMS: PLATFORMS,
    PLATFORM_LABELS: PLATFORM_LABELS,
    parseYouTubeId: parseYouTubeId,
    youTubeThumb: youTubeThumb,
    youTubeEmbed: youTubeEmbed,
    escapeHtml: escapeHtml,
    normalisePost: normalisePost,
    slugify: slugify,
    cardThumb: cardThumb,
    formatDate: formatDate,
    renderMarkdown: renderMarkdown,
    loadPosts: loadPosts
  };
})(typeof window !== 'undefined' ? window : this);
