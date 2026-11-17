    const { useState, useEffect } = React;

    // --- Store links ---
    const STORE_LINKS = {
      appStore: "https://apps.apple.com/us/app/notes-voice-record-ai/id6798175378",
      playStore: "https://play.google.com/store/apps/details?id=com.rp.notes"
    };

    // Real screenshots from the app (already framed). Same files the Mobile1X home page uses.
    const SHOTS = {
      home: { src: "/assets/apps/notes/shot1.webp", alt: "The Notes home screen with a collection of voice memos and a search bar" },
      edit: { src: "/assets/apps/notes/shot2.webp", alt: "Editing a note in Notes, with the toolbar for photos, drawing, voice and scanning" },
      capture: { src: "/assets/apps/notes/shot3.webp", alt: "The Notes capture screen with the prompt 'Speak or type your thought'" }
    };

    const FEATURES = [
      {
        title: "Talk instead of typing",
        body: "Dictate in Hindi, in English, or both in the same sentence. Notes writes it down as you speak and keeps up when you switch languages halfway through.",
        shot: SHOTS.capture
      },
      {
        title: "Photograph handwriting",
        body: "Point the camera at a page or a whiteboard. The text is picked out of the photo, so you can search it and edit it like anything else you typed.",
        shot: SHOTS.edit
      },
      {
        title: "Sorted without folders",
        body: "Magic Sort files your notes as you write them. You don't have to build folders or remember which tag you used last month.",
        shot: SHOTS.home
      }
    ];

    const EXTRAS = [
      ["Reminders", "Attach a reminder to any note."],
      ["Locked notes", "Lock a note behind your biometrics."],
      ["Archive", "Put finished notes away without deleting them."],
      ["Search", "Find a note by what's in it."]
    ];

    // --- Store badges (official artwork, self-hosted in assets/img) ---
    // The Play PNG has built-in padding, so it is sized up and pulled back to match the 50px App Store badge.
    const StoreBadges = ({ className = "" }) => (
      <div className={"flex flex-wrap items-center gap-4 " + className}>
        <a
          href={STORE_LINKS.appStore}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download Notes on the App Store"
          className="inline-flex transition-transform hover:scale-105 active:scale-95"
        >
          <img src="assets/img/app-store-badge.svg" alt="Download on the App Store" width="150" height="50" className="h-[50px] w-auto" />
        </a>
        <a
          href={STORE_LINKS.playStore}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get Notes on Google Play"
          className="inline-flex items-center transition-transform hover:scale-105 active:scale-95"
        >
          <img src="assets/img/google-play-badge.png" alt="Get it on Google Play" width="646" height="250" className="-my-[11px] h-[72px] w-auto" />
        </a>
      </div>
    );

    const Eyebrow = ({ children }) => (
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{children}</p>
    );

    function Page() {
      const [theme, setTheme] = useState(() => {
        try {
          const saved = localStorage.getItem('app-theme');
          if (saved) return saved;
        } catch (e) {}
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      });

      useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try { localStorage.setItem('app-theme', theme); } catch (e) {}
      }, [theme]);

      const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

      return (
        <div className="min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#F8FAFC]/90 backdrop-blur dark:border-slate-800 dark:bg-[#050811]/90">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <a href="#top" className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight">Notes</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">by Mobile1X</span>
              </a>
              <nav aria-label="Main" className="flex items-center gap-5 text-sm text-slate-600 dark:text-slate-300">
                <a href="#what-it-does" className="hidden hover:text-slate-900 dark:hover:text-white sm:inline">What it does</a>
                <a href="#download" className="hover:text-slate-900 dark:hover:text-white">Get the app</a>
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </nav>
            </div>
          </header>

          <main id="top">
            {/* Hero */}
            <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-2">
              <div className="space-y-6">
                <Eyebrow>For Android and iPhone</Eyebrow>
                <h1 className="font-serif-custom text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                  Write it, say it, or snap it. Find it later.
                </h1>
                <p className="max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                  Notes takes typed text, voice in Hindi and English, and photos of handwriting. It sorts everything for you and keeps your notes on your phone.
                </p>
                <StoreBadges className="pt-2" />
              </div>
              <div className="flex justify-center lg:justify-end">
                <img
                  src={SHOTS.home.src}
                  alt={SHOTS.home.alt}
                  width="640"
                  height="1331"
                  className="h-auto w-64 drop-shadow-2xl sm:w-72"
                  fetchpriority="high"
                />
              </div>
            </section>

            {/* What it does */}
            <section id="what-it-does" className="border-t border-slate-200 py-20 dark:border-slate-800">
              <div className="mx-auto max-w-6xl space-y-20 px-6">
                <div className="max-w-2xl space-y-3">
                  <Eyebrow>What it does</Eyebrow>
                  <h2 className="font-serif-custom text-4xl font-bold tracking-tight md:text-5xl">
                    Get the thought down first. Tidy up never.
                  </h2>
                </div>

                {FEATURES.map((f, i) => (
                  <div key={f.title} className="grid items-center gap-10 md:grid-cols-2">
                    <div className={"space-y-3 " + (i % 2 === 1 ? "md:order-2" : "")}>
                      <h3 className="text-2xl font-bold tracking-tight">{f.title}</h3>
                      <p className="max-w-md leading-relaxed text-slate-600 dark:text-slate-300">{f.body}</p>
                    </div>
                    <div className={"flex justify-center " + (i % 2 === 1 ? "md:order-1" : "")}>
                      <img src={f.shot.src} alt={f.shot.alt} width="640" height="1331" loading="lazy" className="h-auto w-56 drop-shadow-xl sm:w-64" />
                    </div>
                  </div>
                ))}

                <div className="grid gap-x-10 gap-y-6 border-t border-slate-200 pt-12 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
                  {EXTRAS.map(([title, body]) => (
                    <div key={title}>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Privacy */}
            <section className="border-t border-slate-200 py-20 dark:border-slate-800">
              <div className="mx-auto max-w-3xl space-y-4 px-6">
                <Eyebrow>Your notes stay yours</Eyebrow>
                <h2 className="font-serif-custom text-4xl font-bold tracking-tight">Kept on your phone, behind your lock.</h2>
                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                  Notes are stored on your device, and you can lock any of them with your biometrics. Read the{' '}
                  <a href="/privacy/" className="underline underline-offset-4 hover:text-indigo-600 dark:hover:text-indigo-400">privacy policy</a>{' '}
                  for the details.
                </p>
              </div>
            </section>

            {/* Download */}
            <section id="download" className="px-6 pb-20">
              <div className="mx-auto max-w-4xl rounded-3xl bg-slate-900 px-8 py-14 text-center text-white dark:bg-slate-900/80 dark:ring-1 dark:ring-slate-700">
                <h2 className="font-serif-custom text-4xl font-bold tracking-tight md:text-5xl">Get Notes</h2>
                <p className="mx-auto mt-3 max-w-md text-slate-300">Available on Android and iPhone.</p>
                <StoreBadges className="mt-8 justify-center" />
              </div>
            </section>
          </main>

          <footer className="border-t border-slate-200 px-6 py-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
              <p>© 2026 Mobile1X. Notes is an app by <a href="/" className="underline underline-offset-4 hover:text-slate-900 dark:hover:text-white">Mobile1X</a>.</p>
              <div className="flex gap-6">
                <a href={STORE_LINKS.appStore} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">App Store</a>
                <a href={STORE_LINKS.playStore} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">Google Play</a>
                <a href="/privacy/" className="hover:text-slate-900 dark:hover:text-white">Privacy</a>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
