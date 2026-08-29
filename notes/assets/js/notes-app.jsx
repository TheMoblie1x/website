    const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;
    const { motion, useScroll, useTransform, useSpring, AnimatePresence } = window.Motion;

    // --- Theme Context Architecture (SRP / OCP) ---
    const ThemeContext = createContext({
      theme: 'dark',
      toggleTheme: () => {}
    });

    const useTheme = () => useContext(ThemeContext);

    // --- Production Store Links ---
    const STORE_LINKS = {
      appStore: "https://apps.apple.com/us/app/notes-archive-reflect/id6798175378",
      playStore: "https://play.google.com/store/apps/details?id=com.rp.notes"
    };

    // --- Dynamic Interactive Archive Nodes ---
    const ARCHIVE_NODES = [
      {
        id: "node-1",
        category: "COMPOSE ARCHITECTURE",
        title: "State Hoisting & Snapshot State",
        body: "Decouple state mutations from composable draw stages to preserve 120 FPS frame budgets.",
        accentDark: "from-blue-500/20 via-indigo-500/10 to-transparent",
        accentLight: "from-blue-100/80 via-indigo-50/50 to-white/90",
        date: "3 Aug 2026",
        icon: "cpu"
      },
      {
        id: "node-2",
        category: "HARDWARE ENCLAVE",
        title: "Biometric AES-GCM-256 Vault",
        body: "Local-only encryption keys locked into the secure hardware enclave. Zero remote telemetry.",
        accentDark: "from-emerald-500/20 via-teal-500/10 to-transparent",
        accentLight: "from-emerald-100/80 via-teal-50/50 to-white/90",
        date: "2 Aug 2026",
        icon: "shield-check"
      },
      {
        id: "node-3",
        category: "THE FEYNMAN MODEL",
        title: "Elemental First Principles",
        body: "Synthesize compound system designs into concise, plain-language operational mental models.",
        accentDark: "from-amber-500/20 via-orange-500/10 to-transparent",
        accentLight: "from-amber-100/80 via-orange-50/50 to-white/90",
        date: "1 Aug 2026",
        icon: "sparkles"
      },
      {
        id: "node-4",
        category: "SPATIAL ENGINE",
        title: "Multi-Axis Gyro Damping",
        body: "Card surfaces respond in real time with angular spring physics and variable depth parallax.",
        accentDark: "from-purple-500/20 via-pink-500/10 to-transparent",
        accentLight: "from-purple-100/80 via-pink-50/50 to-white/90",
        date: "28 Jul 2026",
        icon: "orbit"
      },
      {
        id: "node-5",
        category: "LOCAL SQL ENGINE",
        title: "Zero-Latency Local Ledger",
        body: "Native SQLite vector storage for instantaneous text retrieval and bulk JSON graph export.",
        accentDark: "from-sky-500/20 via-blue-500/10 to-transparent",
        accentLight: "from-sky-100/80 via-blue-50/50 to-white/90",
        date: "25 Jul 2026",
        icon: "database"
      }
    ];

    // --- Global Scroll-Driven 3D Canvas (Three.js WebGL with Theme Adaptability) ---
    const GlobalThreeStage = () => {
      const canvasRef = useRef(null);
      const { theme } = useTheme();
      const sceneRef = useRef(null);
      const materialsRef = useRef({});

      useEffect(() => {
        if (!canvasRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 12;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        canvasRef.current.appendChild(renderer.domElement);

        // Lighting Rig
        const ambientLight = new THREE.AmbientLight(0xffffff, theme === 'dark' ? 0.9 : 1.2);
        scene.add(ambientLight);

        const primaryLight = new THREE.PointLight(theme === 'dark' ? 0x6366f1 : 0x4f46e5, 5, 40);
        primaryLight.position.set(6, 6, 6);
        scene.add(primaryLight);

        const accentLight = new THREE.PointLight(theme === 'dark' ? 0x38bdf8 : 0x0284c7, 4, 35);
        accentLight.position.set(-7, -5, 4);
        scene.add(accentLight);

        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        // 3D Archive Monolith Book
        const bookGeo = new THREE.BoxGeometry(2.8, 4.0, 0.55);
        const bookMats = [
          new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.35, roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.4 }),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ color: 0x1e40af, metalness: 0.4, roughness: 0.2 }),
          new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2 })
        ];
        const bookMesh = new THREE.Mesh(bookGeo, bookMats);
        bookMesh.position.set(3.4, 0.4, 0);
        rootGroup.add(bookMesh);

        // Orbiting Gyro Rings
        const ring1 = new THREE.Mesh(
          new THREE.TorusGeometry(2.4, 0.035, 16, 120),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.15 })
        );
        ring1.position.set(3.4, 0.4, 0);
        ring1.rotation.x = Math.PI / 3;
        rootGroup.add(ring1);

        const ring2 = new THREE.Mesh(
          new THREE.TorusGeometry(2.8, 0.025, 16, 120),
          new THREE.MeshStandardMaterial({ color: 0x818cf8, metalness: 0.9, roughness: 0.1 })
        );
        ring2.position.set(3.4, 0.4, 0);
        ring2.rotation.y = Math.PI / 4;
        rootGroup.add(ring2);

        // Geometric Archive Artifact
        const polyGeo = new THREE.IcosahedronGeometry(1.8, 1);
        const polyMat = new THREE.MeshStandardMaterial({ 
          color: theme === 'dark' ? 0x475569 : 0x94a3b8, 
          wireframe: true, 
          roughness: 0.3 
        });
        materialsRef.current.polyMat = polyMat;
        const polyMesh = new THREE.Mesh(polyGeo, polyMat);
        polyMesh.position.set(-5, -2, -2.5);
        rootGroup.add(polyMesh);

        // Particle Galaxy
        const particleCount = 220;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * 30;
          positions[i + 1] = (Math.random() - 0.5) * 30;
          positions[i + 2] = (Math.random() - 0.5) * 18;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
          color: theme === 'dark' ? 0x93c5fd : 0x6366f1,
          size: 0.08,
          transparent: true,
          opacity: theme === 'dark' ? 0.7 : 0.4
        });
        materialsRef.current.particleMat = particleMat;
        const particleSystem = new THREE.Points(particleGeo, particleMat);
        scene.add(particleSystem);

        let scrollRatio = 0;
        const onScroll = () => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          scrollRatio = max > 0 ? window.scrollY / max : 0;
        };
        window.addEventListener('scroll', onScroll);

        let mouseX = 0;
        let mouseY = 0;
        const onMouseMove = (e) => {
          mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', onMouseMove);

        let animId;
        const animate = (time) => {
          const t = time * 0.001;

          rootGroup.position.y = scrollRatio * 14 * 0.5;
          rootGroup.rotation.y = scrollRatio * Math.PI * 1.8 + mouseX * 0.25;
          rootGroup.rotation.x = Math.sin(t * 0.5) * 0.1 - mouseY * 0.15;

          bookMesh.rotation.y = Math.sin(t * 0.7) * 0.2 + 0.35;
          bookMesh.position.y = 0.4 + Math.sin(t * 1.1) * 0.15;

          ring1.rotation.z = t * 0.5;
          ring1.rotation.x = Math.PI / 3 + Math.sin(t * 0.4) * 0.2;
          ring2.rotation.y = t * 0.35;

          polyMesh.rotation.x = t * 0.25;
          polyMesh.rotation.y = t * 0.35;

          particleSystem.rotation.y = t * 0.04 + scrollRatio * 2;

          renderer.render(scene, camera);
          animId = requestAnimationFrame(animate);
        };
        animate(0);

        const onResize = () => {
          if (!canvasRef.current) return;
          const w = window.innerWidth;
          const h = window.innerHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        return () => {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('resize', onResize);
          cancelAnimationFrame(animId);
          if (canvasRef.current) canvasRef.current.innerHTML = '';
        };
      }, []);

      // Dynamic Color Material Updates on Theme Toggle
      useEffect(() => {
        if (materialsRef.current.polyMat) {
          materialsRef.current.polyMat.color.setHex(theme === 'dark' ? 0x475569 : 0x94a3b8);
        }
        if (materialsRef.current.particleMat) {
          materialsRef.current.particleMat.color.setHex(theme === 'dark' ? 0x93c5fd : 0x6366f1);
          materialsRef.current.particleMat.opacity = theme === 'dark' ? 0.7 : 0.4;
        }
      }, [theme]);

      return <div ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden" />;
    };

    // --- Interactive 3D Device Component ---
    const HeroSpatialDevice = () => {
      const [tilt, setTilt] = useState({ x: 0, y: 0 });
      const [activeTab, setActiveTab] = useState('home');
      const { theme } = useTheme();

      const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: y * -20, y: x * 20 });
      };

      const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
      };

      return (
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          animate={{ rotateX: tilt.x, rotateY: tilt.y }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative mx-auto w-full max-w-[340px] md:max-w-[370px] h-[630px] bg-[#F8FAFC] dark:bg-[#0C1222] rounded-[46px] shadow-[0_30px_100px_rgba(30,58,138,0.2)] dark:shadow-[0_30px_100px_rgba(30,58,138,0.55)] border-[7px] border-slate-300/80 dark:border-slate-800/80 overflow-hidden flex flex-col justify-between transition-colors duration-300"
        >
          {/* Status Bar */}
          <div className="pt-3.5 px-6 flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>2:00</span>
            <div className="w-20 h-4 bg-slate-200 dark:bg-slate-950 rounded-full border border-slate-300/60 dark:border-slate-800/80"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono-custom">5G</span>
              <i data-lucide="battery" className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400"></i>
            </div>
          </div>

          {/* Header */}
          <div className="px-6 pt-4 pb-2 text-left" style={{ transform: 'translateZ(25px)' }}>
            <span className="text-[10px] font-mono-custom font-semibold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1">
              COLLECTION <i data-lucide="sparkles" className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400"></i>
            </span>
            <h3 className="text-xl font-serif-custom font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              The Summer Archivists.
            </h3>
            <p className="text-[10px] text-slate-400 font-mono-custom">102 entries in archive</p>
          </div>

          {/* Viewport Content */}
          <div className="flex-1 px-5 overflow-y-auto space-y-3 text-left no-scrollbar py-1">
            {activeTab === 'home' && (
              <>
                <div style={{ transform: 'translateZ(30px)' }} className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-100/90 to-indigo-100/70 dark:from-blue-900/60 dark:to-indigo-950/80 border border-blue-200 dark:border-blue-500/30 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono-custom font-bold text-slate-600 dark:text-blue-300 uppercase">TIP OF THE DAY</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-indigo-200/80 dark:bg-blue-500/30 text-indigo-900 dark:text-blue-200 rounded">NOTES</span>
                  </div>
                  <p className="text-[11px] font-serif-custom italic text-slate-800 dark:text-slate-200 leading-snug">
                    "The Feynman Technique recommends writing an explanation in simple language as the ultimate test of genuine understanding."
                  </p>
                </div>

                <div style={{ transform: 'translateZ(20px)' }} className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono-custom mb-1">
                    <span>3 Aug 2026</span>
                    <i data-lucide="bookmark" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400"></i>
                  </div>
                  <h4 className="font-serif-custom font-bold text-slate-900 dark:text-white text-base">Jetpack Compose tips #1</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    Declarative layout paradigms, state hoisting strategies, and snapshot performance debugging.
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">Technology</span>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">Sample</span>
                  </div>
                </div>

                <div style={{ transform: 'translateZ(15px)' }} className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono-custom mb-1">
                    <span>1 Aug 2026</span>
                    <i data-lucide="bookmark" className="w-3.5 h-3.5 text-slate-400"></i>
                  </div>
                  <h4 className="font-serif-custom font-bold text-slate-900 dark:text-white text-base">Kyoto Ceremonial Uji Matcha</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    Single origin cultivars with highest L-theanine and sweet umami balance.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'search' && (
              <div className="space-y-2 pt-1">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                  <i data-lucide="search" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"></i>
                  <span>Filter by tag, reminder or media...</span>
                </div>
                {['Find notes with images', 'Show bookmarked notes', 'Biometric protected vault', 'Browse by tag'].map((item, i) => (
                  <div key={i} className="p-3 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex justify-between items-center">
                    <span>{item}</span>
                    <i data-lucide="chevron-right" className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600"></i>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floating Action Button */}
          <div style={{ transform: 'translateZ(35px)' }} className="absolute right-5 bottom-16 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/40 flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
            <i data-lucide="plus" className="w-5 h-5"></i>
          </div>

          {/* App Navigation Dock */}
          <div className="px-6 py-3 bg-white/95 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
            {[
              { id: 'home', icon: 'home', label: 'HOME' },
              { id: 'search', icon: 'search', label: 'SEARCH' },
              { id: 'archive', icon: 'archive', label: 'ARCHIVE' },
              { id: 'settings', icon: 'settings', label: 'SETTINGS' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <i data-lucide={tab.icon} className="w-4 h-4"></i>
                <span className="text-[8px] tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      );
    };

    // --- Direct Store Badges Component ---
    const StoreDownloadBadges = () => {
      return (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href={STORE_LINKS.appStore}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center gap-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 px-6 py-3.5 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 border border-slate-700/50 dark:border-white/40"
          >
            <i data-lucide="apple" className="w-6 h-6 fill-current"></i>
            <div className="text-left">
              <span className="block text-[9px] font-mono-custom tracking-wider uppercase font-semibold text-slate-300 dark:text-slate-600 leading-none">Download on</span>
              <span className="block text-sm font-bold tracking-tight mt-0.5">Apple App Store</span>
            </div>
          </a>

          <a
            href={STORE_LINKS.playStore}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center gap-3.5 bg-white text-slate-900 dark:bg-slate-900/90 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 px-6 py-3.5 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-700/80"
          >
            <i data-lucide="play" className="w-6 h-6 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400"></i>
            <div className="text-left">
              <span className="block text-[9px] font-mono-custom tracking-wider uppercase font-semibold text-slate-500 dark:text-slate-400 leading-none">Get it on</span>
              <span className="block text-sm font-bold tracking-tight mt-0.5">Google Play Store</span>
            </div>
          </a>
        </div>
      );
    };

    // --- Horizontal Spatial Kinetic Deck ---
    const KineticDeck = () => {
      const { theme } = useTheme();

      return (
        <div className="py-10 overflow-x-auto no-scrollbar flex gap-6 px-6 md:px-12 max-w-7xl mx-auto">
          {ARCHIVE_NODES.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -14, rotateZ: (i % 2 === 0 ? 1.5 : -1.5), scale: 1.03 }}
              className={`min-w-[290px] md:min-w-[340px] p-8 rounded-[36px] bg-gradient-to-b ${theme === 'dark' ? card.accentDark + ' glass-card-dark' : card.accentLight + ' glass-card-light'} flex flex-col justify-between cursor-pointer transition-all shadow-lg hover:shadow-2xl`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono-custom tracking-wider font-bold text-indigo-600 dark:text-indigo-400 uppercase">{card.category}</span>
                  <span className="text-[10px] font-mono-custom text-slate-400 dark:text-slate-500">{card.date}</span>
                </div>
                <h3 className="text-2xl font-serif-custom font-bold text-slate-900 dark:text-white leading-snug">{card.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{card.body}</p>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/10 mt-6">
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Read Manuscript</span>
                <div className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white">
                  <i data-lucide="arrow-up-right" className="w-4 h-4"></i>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      );
    };

    // --- Live Instant Search Playground ---
    const InteractiveSearchSection = () => {
      const [searchTerm, setSearchTerm] = useState("");
      
      const filtered = useMemo(() => {
        if (!searchTerm.trim()) return ARCHIVE_NODES;
        const q = searchTerm.toLowerCase();
        return ARCHIVE_NODES.filter(n => 
          n.title.toLowerCase().includes(q) || 
          n.category.toLowerCase().includes(q)
        );
      }, [searchTerm]);

      return (
        <section id="interactive-search" className="py-24 px-6 relative max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-mono-custom tracking-widest text-indigo-600 dark:text-indigo-400 font-bold uppercase">LIVE ARCHIVAL INDEX</span>
            <h2 className="text-4xl md:text-5xl font-serif-custom font-bold text-slate-900 dark:text-white">Instant Knowledge Search</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-lg mx-auto">Sub-millisecond keyword and category indexing directly on device.</p>
          </div>

          <div className="relative mb-8 max-w-xl mx-auto">
            <i data-lucide="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
            <input
              type="text"
              placeholder="Filter topics (e.g., 'Compose', 'Enclave', 'Feynman')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center hover:border-indigo-500/50 shadow-sm transition-colors"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono-custom text-indigo-600 dark:text-indigo-400 uppercase font-bold">{item.category}</span>
                    <h4 className="text-base font-serif-custom font-bold text-slate-900 dark:text-white">{item.title}</h4>
                    <span className="text-[10px] font-mono-custom text-slate-400 dark:text-slate-500">{item.date}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <i data-lucide={item.icon || "file-text"} className="w-4 h-4"></i>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      );
    };

    // --- Header Navigation & Theme Toggle ---
    const NavigationBar = () => {
      const { theme, toggleTheme } = useTheme();

      return (
        <header className={`fixed top-0 inset-x-0 z-50 ${theme === 'dark' ? 'glass-nav-dark' : 'glass-nav-light'} transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <i data-lucide="book-open" className="w-5 h-5"></i>
              </div>
              <span className="font-serif-custom text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notes: Archive & Reflect</span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-xs font-mono-custom uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <a href="#kinetic-deck" className="hover:text-slate-900 dark:hover:text-white transition-colors">Manuscripts</a>
              <a href="#interactive-search" className="hover:text-slate-900 dark:hover:text-white transition-colors">Instant Query</a>
              <a href="#architecture" className="hover:text-slate-900 dark:hover:text-white transition-colors">Local Enclave</a>
              <a href="blogs/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Blog</a>
            </nav>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Dark and Light Mode"
                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                {theme === 'dark' ? (
                  <i data-lucide="sun" className="w-4 h-4 text-amber-400"></i>
                ) : (
                  <i data-lucide="moon" className="w-4 h-4 text-indigo-600"></i>
                )}
              </button>

              <a
                href={STORE_LINKS.appStore}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95"
              >
                <i data-lucide="download" className="w-4 h-4"></i>
                <span>GET APP</span>
              </a>
            </div>
          </div>
        </header>
      );
    };

    // --- Main Single Page Application ---
    function MasterLandingPage() {
      const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('app-theme');
        return saved ? saved : 'dark';
      });

      const toggleTheme = () => {
        setTheme(prev => {
          const next = prev === 'dark' ? 'light' : 'dark';
          localStorage.setItem('app-theme', next);
          return next;
        });
      };

      useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }, [theme]);

      useEffect(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      });

      return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <div className="relative min-h-screen">
            <GlobalThreeStage />
            <NavigationBar />

            {/* Hero Section */}
            <section className="relative pt-36 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
              <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="lg:col-span-7 text-left space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-mono-custom font-semibold">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                    V2.4 TACTILE ARCHIVAL ENGINE
                  </div>

                  <h1 className="text-5xl md:text-7xl font-serif-custom font-bold text-slate-900 dark:text-white tracking-tight leading-[1.06]">
                    Preserve your thoughts in <span className="italic text-indigo-600 dark:text-indigo-400 font-normal">three dimensions.</span>
                  </h1>

                  <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 max-w-xl font-light leading-relaxed">
                    A high-craft notes workspace merging physical typography, fluid gesture springs, and hardware-level biometric encryption.
                  </p>

                  {/* Direct App Store & Play Store Links */}
                  <div className="pt-2">
                    <StoreDownloadBadges />
                  </div>

                  {/* Live Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800/80">
                    {[
                      { v: "100%", l: "Local Storage" },
                      { v: "120 FPS", l: "Spring Physics" },
                      { v: "0ms", l: "Cloud Latency" },
                      { v: "102+", l: "Manuscripts" }
                    ].map((m, idx) => (
                      <div key={idx}>
                        <p className="text-2xl font-serif-custom font-bold text-slate-900 dark:text-white">{m.v}</p>
                        <p className="text-[10px] font-mono-custom text-slate-400 dark:text-slate-500 uppercase mt-0.5">{m.l}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* 3D Phone Gyro Device */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="lg:col-span-5 relative"
                >
                  <HeroSpatialDevice />
                </motion.div>
              </div>
            </section>

            {/* Kinetic Manuscripts Section */}
            <section id="kinetic-deck" className="py-24 relative border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/40 transition-colors duration-300">
              <div className="max-w-7xl mx-auto px-6 mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <span className="text-xs font-mono-custom tracking-widest text-indigo-600 dark:text-indigo-400 font-bold uppercase">GESTURE CANVAS</span>
                  <h2 className="text-4xl md:text-5xl font-serif-custom font-bold text-slate-900 dark:text-white mt-1">Spatial Manuscript Deck</h2>
                </div>
                <p className="text-xs font-mono-custom text-slate-400 dark:text-slate-500">SCROLL HORIZONTALLY TO EXPLORE →</p>
              </div>
              
              <KineticDeck />
            </section>

            {/* Interactive Search Section */}
            <InteractiveSearchSection />

            {/* Technical Architecture */}
            <section id="architecture" className="py-24 px-6 relative border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/30 dark:bg-slate-950/20 transition-colors duration-300">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-xs font-mono-custom tracking-widest text-indigo-600 dark:text-indigo-400 font-bold uppercase">LOCAL HARDWARE INTEGRATION</span>
                  <h2 className="text-4xl md:text-5xl font-serif-custom font-bold text-slate-900 dark:text-white leading-tight">
                    Zero telemetry. Bare metal performance.
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-light">
                    Built natively on top of mobile hardware primitives. Every note, bookmark, and media transcript is sealed with platform keychains before disk commits.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                      <i data-lucide="shield" className="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Secure Enclave</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Face ID & Touch ID hardware unlocks.</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                      <i data-lucide="hard-drive" className="w-5 h-5 text-sky-600 dark:text-sky-400"></i>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">5GB Local Ink</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Unlimited offline markdown archives.</p>
                    </div>
                  </div>
                </div>

                {/* Code Snippet Window */}
                <div className="lg:col-span-6 bg-[#090D18] rounded-[36px] p-6 text-slate-300 font-mono-custom text-xs shadow-2xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-slate-500 ml-2">archivist_enclave_pipeline.kt</span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] text-indigo-300 leading-relaxed">
{`val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
val cipher = Cipher.getInstance("AES/GCM/NoPadding")

fun sealManuscript(content: ByteArray): EncryptedRecord {
    val secretKey = keyStore.getKey(ENCLAVE_ALIAS, null) as SecretKey
    cipher.init(Cipher.ENCRYPT_MODE, secretKey)
    return EncryptedRecord(
        cipherText = cipher.doFinal(content),
        iv = cipher.iv
    )
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Download CTA Banner */}
            <section id="download" className="py-20 px-6">
              <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-950 via-[#0D1629] to-blue-950 rounded-[48px] p-10 md:p-20 text-center text-white relative overflow-hidden border border-indigo-500/20 shadow-2xl">
                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                  <span className="text-xs font-mono-custom tracking-widest text-indigo-400 font-bold uppercase">COMMENCE PRESERVATION</span>
                  <h2 className="text-4xl md:text-6xl font-serif-custom font-bold leading-tight">
                    Step into the future of tactile thought.
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base font-light">
                    Available directly on iOS and Android. Pay once, own your archival history forever.
                  </p>
                  <div className="pt-4 flex justify-center">
                    <StoreDownloadBadges />
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800 text-center transition-colors duration-300">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500 font-mono-custom">
                <div className="flex items-center gap-2">
                  <i data-lucide="book-open" className="w-4 h-4 text-indigo-600 dark:text-indigo-400"></i>
                  <span className="font-serif-custom text-base font-bold text-slate-800 dark:text-slate-300">Notes: Archive & Reflect</span>
                </div>
                <p>© 2026 Notes: Archive & Reflect. Crafted with local-first precision.</p>
                <div className="flex gap-6">
                  <a href={STORE_LINKS.appStore} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">App Store</a>
                  <a href={STORE_LINKS.playStore} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">Play Store</a>
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy Policy</a>
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white">GitHub</a>
                </div>
              </div>
            </footer>
          </div>
        </ThemeContext.Provider>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<MasterLandingPage />);
