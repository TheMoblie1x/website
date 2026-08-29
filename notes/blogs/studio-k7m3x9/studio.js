  (function () {
    var B = window.NotesBlog;
    var REPO = { owner: 'TheMoblie1x', repo: 'website', branch: 'main', path: 'notes/blogs/data/posts.json' };
    var CONTENTS = 'https://api.github.com/repos/' + REPO.owner + '/' + REPO.repo + '/contents/';
    var API = CONTENTS + REPO.path;
    var TOKEN_KEY = 'm1x_blog_token';
    var PREVIEW_KEY = 'm1x_blog_preview';

    var $ = function (id) { return document.getElementById(id); };
    var state = { token: '', sha: null, posts: [], editingId: null };

    $('repoLine').textContent = REPO.owner + '/' + REPO.repo + ' · ' + REPO.path;

    /* ---------- base64 / GitHub ---------- */
    function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
    function b64decode(b64) { return decodeURIComponent(escape(atob(b64.replace(/\s/g, '')))); }
    function ghHeaders() {
      return { 'Authorization': 'Bearer ' + state.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    }

    function setStatus(el, msg, kind) {
      el.textContent = msg;
      el.className = 'mt-3 text-sm rounded-lg px-3 py-2 ' +
        (kind === 'error' ? 'bg-rose-500/15 text-rose-300' :
         kind === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-300');
      el.classList.remove('hidden');
    }

    function fetchFile() {
      setStatus($('status'), 'Loading posts…');
      return fetch(API + '?ref=' + REPO.branch + '&t=' + Date.now(), { headers: ghHeaders(), cache: 'no-store' })
        .then(function (r) {
          if (r.status === 401) throw new Error('Token rejected (401). Check the token scope and expiry.');
          if (r.status === 404) { state.sha = null; return { posts: [] }; }
          if (!r.ok) throw new Error('GitHub ' + r.status);
          return r.json().then(function (j) {
            state.sha = j.sha;
            try { return JSON.parse(b64decode(j.content)); }
            catch (e) { throw new Error('posts.json is not valid JSON.'); }
          });
        })
        .then(function (data) {
          state.posts = ((data && data.posts) || []).map(B.normalisePost);
          renderList();
          setStatus($('status'), state.posts.length + ' post(s) loaded.', 'ok');
        });
    }

    function cleanForSave(p) {
      return { id: p.id, type: p.type, title: p.title, slug: p.slug, platforms: p.platforms,
        excerpt: p.excerpt, thumbnail: p.thumbnail, youtubeUrl: p.youtubeUrl, body: p.body,
        date: p.date, published: p.published };
    }

    function commit(message, statusEl) {
      var body = JSON.stringify({ posts: state.posts.map(cleanForSave) }, null, 2) + '\n';
      var payload = { message: message, content: b64encode(body), branch: REPO.branch };
      if (state.sha) payload.sha = state.sha;
      setStatus(statusEl, 'Committing…');
      return fetch(API, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(payload) })
        .then(function (r) {
          if (r.status === 409) throw new Error('Conflict — posts.json changed elsewhere. Reload the page.');
          if (!r.ok) return r.json().then(function (j) { throw new Error(j.message || ('GitHub ' + r.status)); });
          return r.json();
        })
        .then(function (j) {
          state.sha = j.content && j.content.sha;
          setStatus(statusEl, 'Saved. Netlify redeploys in ~30s.', 'ok');
        });
    }

    /* Upload a binary file to notes/blogs/assets/uploads/, return the path relative to notes/blogs/ */
    function uploadAsset(file, statusEl) {
      if (file.size > 40 * 1024 * 1024) return Promise.reject(new Error('File is over 40 MB — too big for this uploader.'));
      if (file.size > 20 * 1024 * 1024) setStatus(statusEl, 'Large file (' + Math.round(file.size / 1048576) + ' MB), this may take a while…');
      var name = Date.now() + '-' + file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, '-').replace(/^-+|-+$/g, '');
      var repoPath = 'notes/blogs/assets/uploads/' + name;
      return new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onerror = function () { rej(new Error('Could not read the file.')); };
        fr.onload = function () {
          var b64 = String(fr.result).split(',')[1];
          setStatus(statusEl, 'Uploading ' + file.name + '…');
          fetch(CONTENTS + repoPath, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify({
            message: 'Upload blog asset: ' + name, content: b64, branch: REPO.branch
          }) }).then(function (r) {
            if (!r.ok) return r.json().then(function (j) { throw new Error(j.message || ('GitHub ' + r.status)); });
            return r.json();
          }).then(function () { res('assets/uploads/' + name); }).catch(rej);
        };
        fr.readAsDataURL(file);
      });
    }

    /* ---------- list view ---------- */
    function byId(id) { return state.posts.filter(function (p) { return p.id === id; })[0]; }

    function renderList() {
      $('count').textContent = '(' + state.posts.length + ')';
      var sorted = state.posts.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      $('list').innerHTML = sorted.map(function (p) {
        return '<li class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10" data-id="' + B.escapeHtml(p.id) + '">' +
          '<span class="text-[11px] font-semibold uppercase px-2 py-0.5 rounded ' + (p.type === 'howto' ? 'bg-brand-500/20 text-brand-400' : 'bg-emerald-500/20 text-emerald-400') + '">' + (p.type === 'howto' ? 'How-To' : 'Article') + '</span>' +
          '<div class="flex-1 min-w-0"><div class="font-medium truncate">' + B.escapeHtml(p.title) + '</div>' +
          '<div class="text-xs text-slate-500 mono truncate">' + B.escapeHtml(p.slug) + ' · ' + p.date + ' · ' + (p.platforms.join(', ') || 'no platforms') + '</div></div>' +
          '<button class="js-pub text-xs px-2 py-1 rounded border ' + (p.published ? 'border-emerald-500/40 text-emerald-400' : 'border-white/15 text-slate-400') + '">' + (p.published ? 'Published' : 'Draft') + '</button>' +
          '<button class="js-edit text-xs px-2 py-1 rounded border border-white/15 hover:border-white/40">Edit</button>' +
          '<button class="js-del text-xs px-2 py-1 rounded border border-rose-500/30 text-rose-400 hover:border-rose-500/60">Delete</button></li>';
      }).join('') || '<li class="text-slate-500 text-sm p-3">No posts yet. Click &ldquo;New post&rdquo;.</li>';

      $('list').querySelectorAll('li[data-id]').forEach(function (li) {
        var id = li.dataset.id;
        li.querySelector('.js-edit').addEventListener('click', function () { openEditor(id); });
        li.querySelector('.js-pub').addEventListener('click', function () {
          var p = byId(id); p.published = !p.published;
          commit((p.published ? 'Publish' : 'Unpublish') + ' post: ' + p.title, $('status')).then(renderList).catch(function (e) { setStatus($('status'), e.message, 'error'); });
        });
        li.querySelector('.js-del').addEventListener('click', function () {
          var p = byId(id);
          if (!confirm('Delete "' + p.title + '"? This commits immediately.')) return;
          state.posts = state.posts.filter(function (x) { return x.id !== id; });
          commit('Delete post: ' + p.title, $('status')).then(renderList).catch(function (e) { setStatus($('status'), e.message, 'error'); });
        });
      });
    }

    /* ---------- editor view ---------- */
    function showEditor(on) {
      $('editorView').classList.toggle('hidden', !on);
      $('listView').classList.toggle('hidden', on);
      document.body.style.overflow = on ? 'hidden' : '';
      if (on) $('editorView').scrollTop = 0;
    }

    function openEditor(id) {
      state.editingId = id || null;
      var p = id ? byId(id) : B.normalisePost({ type: 'howto', platforms: ['android', 'ios', 'web'] });
      $('editorTitle').textContent = id ? 'Edit post' : 'New post';
      $('f_type').value = p.type;
      $('f_date').value = p.date;
      $('f_title').value = (p.title === 'Untitled' && !id) ? '' : p.title;
      $('f_slug').value = id ? p.slug : '';
      $('f_slug').dataset.auto = id ? 'off' : '';
      $('f_excerpt').value = p.excerpt;
      $('f_youtube').value = p.youtubeUrl;
      $('f_thumb').value = p.thumbnail;
      $('f_body').value = p.body;
      $('f_published').checked = p.published;
      document.querySelectorAll('.f_plat').forEach(function (cb) { cb.checked = p.platforms.indexOf(cb.value) !== -1; });
      $('editorStatus').classList.add('hidden');
      syncType();
      updatePreview();
      showEditor(true);
      history.pushState({ v: 'edit' }, '');
    }

    function currentDraft() {
      return {
        id: state.editingId || String(Date.now()),
        type: $('f_type').value,
        title: $('f_title').value.trim() || 'Untitled',
        slug: B.slugify($('f_slug').value || $('f_title').value || 'untitled'),
        platforms: Array.prototype.map.call(document.querySelectorAll('.f_plat:checked'), function (cb) { return cb.value; }),
        excerpt: $('f_excerpt').value.trim(),
        thumbnail: $('f_thumb').value.trim(),
        youtubeUrl: $('f_youtube').value.trim(),
        body: $('f_body').value,
        date: $('f_date').value || new Date().toISOString().slice(0, 10),
        published: $('f_published').checked
      };
    }

    function syncType() { $('wrap_youtube').style.display = $('f_type').value === 'howto' ? '' : 'none'; }

    /* preview pane: rewrite repo-relative asset paths so they resolve from this sub-folder */
    function fixAssetPaths(html) {
      return html.replace(/((?:src|href)=")assets\//g, '$1../assets/');
    }
    function updatePreview() {
      var d = currentDraft();
      $('pv_meta').textContent = (d.type === 'howto' ? 'How-To' : 'Article') + ' · ' + B.formatDate(d.date);
      $('pv_title').textContent = d.title;
      $('pv_chips').innerHTML = d.platforms.map(function (p) {
        return '<span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-slate-300">' + B.PLATFORM_LABELS[p] + '</span>';
      }).join(' ');
      var vid = B.parseYouTubeId(d.youtubeUrl);
      $('pv_video').innerHTML = vid
        ? '<div class="relative w-full rounded-xl overflow-hidden bg-black" style="padding-top:56.25%"><iframe class="absolute inset-0 w-full h-full" src="https://www.youtube-nocookie.com/embed/' + vid + '?rel=0" allowfullscreen></iframe></div>'
        : '';
      $('pv_body').innerHTML = fixAssetPaths(B.renderMarkdown(d.body));
    }

    /* ---------- markdown toolbar ---------- */
    function surround(pre, post) {
      var t = $('f_body'), s = t.selectionStart, e = t.selectionEnd, v = t.value;
      var sel = v.slice(s, e) || 'text';
      t.value = v.slice(0, s) + pre + sel + post + v.slice(e);
      t.focus(); t.selectionStart = s + pre.length; t.selectionEnd = s + pre.length + sel.length;
      updatePreview();
    }
    function linePrefix(fn) {
      var t = $('f_body'), s = t.selectionStart, e = t.selectionEnd, v = t.value;
      var ls = v.lastIndexOf('\n', s - 1) + 1;
      var le = v.indexOf('\n', e); if (le === -1) le = v.length;
      var lines = v.slice(ls, le).split('\n');
      var i = 0;
      var out = lines.map(function (ln) { return fn(ln, i++); }).join('\n');
      t.value = v.slice(0, ls) + out + v.slice(le);
      t.focus(); t.selectionStart = ls; t.selectionEnd = ls + out.length;
      updatePreview();
    }
    function insertText(text) {
      var t = $('f_body'), s = t.selectionStart, v = t.value;
      t.value = v.slice(0, s) + text + v.slice(t.selectionEnd);
      t.focus(); t.selectionStart = t.selectionEnd = s + text.length;
      updatePreview();
    }

    var TOOLBAR = {
      bold: function () { surround('**', '**'); },
      italic: function () { surround('*', '*'); },
      code: function () { surround('`', '`'); },
      h2: function () { linePrefix(function (l) { return '## ' + l.replace(/^#+\s*/, ''); }); },
      h3: function () { linePrefix(function (l) { return '### ' + l.replace(/^#+\s*/, ''); }); },
      quote: function () { linePrefix(function (l) { return '> ' + l.replace(/^>\s*/, ''); }); },
      ul: function () { linePrefix(function (l) { return '- ' + l.replace(/^[-*]\s+/, ''); }); },
      ol: function () { linePrefix(function (l, i) { return (i + 1) + '. ' + l.replace(/^\d+\.\s+/, ''); }); },
      link: function () {
        var u = prompt('Link URL', 'https://'); if (!u) return;
        surround('[', '](' + u + ')');
      },
      image: function () { openMedia('image'); },
      video: function () { openMedia('video'); }
    };
    $('toolbar').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cmd]'); if (!btn) return;
      (TOOLBAR[btn.dataset.cmd] || function () {})();
    });

    /* ---------- media dialog ---------- */
    var mediaMode = 'image', mediaTarget = 'body';
    function openMedia(mode, target) {
      mediaMode = mode; mediaTarget = target || 'body';
      $('mediaTitle').textContent = mode === 'image' ? 'Insert image' : 'Insert video';
      $('m_altWrap').style.display = mode === 'image' ? '' : 'none';
      $('m_file').value = ''; $('m_url').value = ''; $('m_alt').value = '';
      $('m_status').classList.add('hidden');
      $('m_file').setAttribute('accept', mode === 'image' ? 'image/*' : 'video/*');
      $('mediaDlg').classList.remove('hidden');
    }
    function closeMedia() { $('mediaDlg').classList.remove; $('mediaDlg').classList.add('hidden'); }
    $('mediaClose').addEventListener('click', closeMedia);
    $('m_cancel').addEventListener('click', closeMedia);

    $('m_insert').addEventListener('click', function () {
      var file = $('m_file').files[0];
      var url = $('m_url').value.trim();
      var done = function (finalUrl) {
        if (mediaTarget === 'thumb') { $('f_thumb').value = finalUrl; updatePreview(); closeMedia(); return; }
        if (mediaMode === 'image') {
          insertText('\n![' + ($('m_alt').value.trim() || 'image') + '](' + finalUrl + ')\n');
        } else {
          var yt = B.parseYouTubeId(finalUrl);
          if (yt) insertText('\n<iframe width="100%" style="aspect-ratio:16/9;border:0;border-radius:.6rem" src="https://www.youtube-nocookie.com/embed/' + yt + '?rel=0" allowfullscreen></iframe>\n');
          else insertText('\n<video controls playsinline preload="metadata" src="' + finalUrl + '" style="width:100%;border-radius:.6rem"></video>\n');
        }
        closeMedia();
      };
      if (file) {
        $('m_insert').disabled = true;
        setStatus($('m_status') && ($('m_status').classList.remove('hidden'), $('m_status')), 'Uploading…');
        uploadAsset(file, $('m_status'))
          .then(done)
          .catch(function (e) { $('m_status').classList.remove('hidden'); $('m_status').textContent = e.message; })
          .then(function () { $('m_insert').disabled = false; });
      } else if (url) {
        done(url);
      } else {
        $('m_status').classList.remove('hidden'); $('m_status').textContent = 'Choose a file or paste a URL.';
      }
    });

    $('thumbUploadBtn').addEventListener('click', function () { openMedia('image', 'thumb'); });

    /* ---------- editor wiring ---------- */
    $('f_type').addEventListener('change', function () { syncType(); updatePreview(); });
    ['f_title', 'f_date', 'f_excerpt', 'f_youtube', 'f_thumb', 'f_body'].forEach(function (id) {
      $(id).addEventListener('input', updatePreview);
    });
    document.querySelectorAll('.f_plat').forEach(function (cb) { cb.addEventListener('change', updatePreview); });
    $('f_title').addEventListener('input', function () {
      if (!state.editingId && $('f_slug').dataset.auto !== 'off') $('f_slug').value = B.slugify($('f_title').value);
    });
    $('f_slug').addEventListener('input', function () { $('f_slug').dataset.auto = 'off'; });

    $('backBtn').addEventListener('click', function () { history.back(); });
    window.addEventListener('popstate', function () {
      if (!$('editorView').classList.contains('hidden')) showEditor(false);
    });

    $('previewBtn').addEventListener('click', function () {
      try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(currentDraft())); }
      catch (e) { alert('Could not open preview: ' + e.message); return; }
      window.open('../post.html?preview=1', '_blank', 'noopener');
    });

    $('saveBtn').addEventListener('click', function () {
      var title = $('f_title').value.trim();
      if (!title) { setStatus($('editorStatus'), 'Title is required.', 'error'); return; }
      var d = currentDraft();
      var dupe = state.posts.filter(function (p) { return p.slug === d.slug && p.id !== state.editingId; })[0];
      if (dupe) { setStatus($('editorStatus'), 'Another post already uses the slug "' + d.slug + '".', 'error'); return; }
      if (d.type === 'howto' && !B.parseYouTubeId(d.youtubeUrl) &&
          !confirm('This How-To has no valid YouTube URL — its card will open the article page instead. Save anyway?')) return;

      if (state.editingId) state.posts = state.posts.map(function (p) { return p.id === d.id ? d : p; });
      else state.posts.push(d);

      $('saveBtn').disabled = true;
      commit((state.editingId ? 'Update' : 'Add') + ' post: ' + title, $('editorStatus'))
        .then(function () { renderList(); showEditor(false); })
        .catch(function (e) { setStatus($('editorStatus'), e.message, 'error'); })
        .then(function () { $('saveBtn').disabled = false; });
    });

    $('newBtn').addEventListener('click', function () { openEditor(null); });

    /* ---------- token / connect ---------- */
    function connect(token) {
      state.token = token;
      $('gateErr').classList.add('hidden');
      fetchFile()
        .then(function () {
          try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
          $('gate').classList.add('hidden');
          $('app').classList.remove('hidden');
          $('forgetBtn').classList.remove('hidden');
        })
        .catch(function (e) {
          state.token = '';
          $('gateErr').textContent = e.message;
          $('gateErr').classList.remove('hidden');
        });
    }
    $('connectBtn').addEventListener('click', function () {
      var t = $('tokenInput').value.trim(); if (t) connect(t);
    });
    $('tokenInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('connectBtn').click(); });
    $('forgetBtn').addEventListener('click', function () {
      try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
      location.reload();
    });

    var stored = '';
    try { stored = localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
    if (stored) connect(stored);
    else $('gate').classList.remove('hidden');
  })();
