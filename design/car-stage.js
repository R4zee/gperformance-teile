(function () {
  if (customElements.get('gp-car-stage')) return;
  const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
  let P; const load = () => P || (P = import(URL3));
  const ACC = '#00e0c6', BASE_TH = Math.atan2(5.6, 6.4);
  const VIEWS = {
    overview: { pos: [5.6, 2.1, 6.4], tgt: [0, 0.55, 0] },
    felgen: { pos: [3.0, 0.6, 3.7], tgt: [1.4, 0.38, 0.85] },
    bremsen: { pos: [-0.55, 0.5, 3.2], tgt: [-1.41, 0.36, 0.9] },
    fahrwerk: { pos: [0.4, 0.55, 7.4], tgt: [0.1, 0.5, 0] },
    abgas: { pos: [-4.6, 0.75, 2.0], tgt: [-2.3, 0.4, 0] },
    front: { pos: [5.0, 0.95, 2.7], tgt: [2.0, 0.45, 0] },
    heck: { pos: [-5.0, 2.4, 3.0], tgt: [-1.9, 0.85, 0] },
    motor: { pos: [4.4, 3.3, 2.3], tgt: [1.2, 0.8, 0] }
  };
  const SPOTS = [
    { zone: 'felgen', label: 'Felgen', p: [1.4, 0.34, 0.97], n: [0, 0, 1] },
    { zone: 'bremsen', label: 'Bremsen', p: [-1.41, 0.34, 0.97], n: [0, 0, 1] },
    { zone: 'fahrwerk', label: 'Fahrwerk', p: [1.4, 0.82, 0.92], n: [0, 0.3, 1] },
    { zone: 'abgas', label: 'Abgasanlage', p: [-2.45, 0.33, 0.4], n: [-1, 0, 0.2] },
    { zone: 'front', label: 'Frontlippe', p: [2.38, 0.26, 0.35], n: [1, 0, 0.2] },
    { zone: 'heck', label: 'Heckspoiler', p: [-2.25, 1.02, 0.35], n: [-1, 0.6, 0.2] },
    { zone: 'motor', label: 'Ansaugung', p: [1.5, 0.9, 0], n: [0.3, 1, 0] }
  ];
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  class GPCarStage extends HTMLElement {
    static get observedAttributes() { return ['config', 'zone', 'hotspots', 'autorotate', 'accent']; }
    constructor() {
      super();
      this._cfg = {}; this._zone = 'overview'; this._pops = [];
      const r = this.attachShadow({ mode: 'open' });
      r.innerHTML = `<style>
:host{display:block;position:relative;width:100%;height:100%;overflow:hidden;touch-action:none;cursor:grab;user-select:none}
:host(:active){cursor:grabbing}
canvas{display:block;width:100%!important;height:100%!important}
.spots{position:absolute;inset:0;pointer-events:none}
.s{position:absolute;left:0;top:0;display:flex;align-items:center;gap:8px;pointer-events:auto;cursor:pointer;background:none;border:0;padding:6px;margin:0;font:600 11px/1 'Barlow',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#0a0a0b;transition:opacity .25s;will-change:transform}
.s i{width:12px;height:12px;border-radius:50%;background:#fff;border:1.5px solid #0a0a0b;box-sizing:border-box;flex:none;transition:background .2s,border-color .2s;box-shadow:0 0 0 5px rgba(255,255,255,.5)}
.s span{background:rgba(255,255,255,.94);padding:6px 9px;border-radius:999px;white-space:nowrap;opacity:0;transform:translateX(-4px);transition:opacity .18s,transform .18s}
.s:hover span,.s.on span{opacity:1;transform:none}
.s:hover i{background:#0a0a0b}
.s.on i{background:var(--acc,#ff3e9d);border-color:var(--acc,#ff3e9d)}
.s.on span{background:var(--acc,#ff3e9d);color:#0a0a0b}
.s.hide{opacity:0;pointer-events:none}
:host([theme=dark]) .s{color:#fff}
:host([theme=dark]) .s i{background:#0a0a0b;border-color:#fff;box-shadow:0 0 0 5px rgba(255,255,255,.14)}
:host([theme=dark]) .s span{background:rgba(255,255,255,.12);backdrop-filter:blur(8px);color:#fff}
:host([theme=dark]) .s:hover i{background:#fff}
:host([theme=dark]) .s.on i{background:var(--acc,#ff3e9d);border-color:var(--acc,#ff3e9d)}
:host([theme=dark]) .s.on span{background:var(--acc,#ff3e9d);color:#0a0a0b}
.load{position:absolute;inset:0;display:grid;place-items:center;font:600 11px 'Barlow',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8b8b90}
</style><div class="load">3D-Modell lädt …</div><div class="spots"></div>`;
      this._spotsEl = r.querySelector('.spots');
      this._spotEls = SPOTS.map(s => {
        const b = document.createElement('button');
        b.className = 's hide'; b.innerHTML = `<i></i><span>${s.label}</span>`;
        b.addEventListener('pointerdown', e => e.stopPropagation());
        b.addEventListener('click', e => {
          e.stopPropagation();
          this.dispatchEvent(new CustomEvent('gp-zone', { detail: { zone: s.zone }, bubbles: true, composed: true }));
        });
        this._spotsEl.appendChild(b); return b;
      });
    }
    attributeChangedCallback(n, o, v) {
      if (n === 'accent') this.style.setProperty('--acc', v || '#00e0c6');
      if (n === 'config') { try { this._cfg = JSON.parse(v || '{}'); } catch (e) { this._cfg = {}; } if (this.T) this._apply(); }
      if (n === 'zone') { this._zone = v || 'overview'; if (this.T) this._goZone(); this._markSpots(); }
    }
    connectedCallback() {
      if (this._started) return; this._started = true;
      load().then(T => { if (this.isConnected) this._init(T); });
    }
    disconnectedCallback() {
      cancelAnimationFrame(this._raf); this._ro && this._ro.disconnect();
      if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
      this._started = false; this.T = null;
      const c = this.shadowRoot.querySelector('canvas'); c && c.remove();
    }
    _markSpots() { SPOTS.forEach((s, i) => this._spotEls[i].classList.toggle('on', s.zone === this._zone)); }

    _init(T) {
      this.T = T;
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
      const ld = this.shadowRoot.querySelector('.load'); ld && ld.remove();
      this.shadowRoot.insertBefore(r.domElement, this._spotsEl);
      const scene = this.scene = new T.Scene();

      const pm = new T.PMREMGenerator(r), es = new T.Scene();
      const room = new T.Mesh(new T.BoxGeometry(30, 14, 30), new T.MeshBasicMaterial({ color: 0x9a9a98, side: T.BackSide }));
      room.position.y = 6; es.add(room);
      const lm = c => { const m = new T.MeshBasicMaterial({ color: 0xffffff }); m.color.setScalar(c); return m; };
      [[0, 12.5, 0, 18, 0.5, 5, 7], [-13, 5, 0, 0.5, 3, 18, 3], [13, 5, 0, 0.5, 3, 18, 3], [0, 5, -14, 18, 3, 0.5, 2.2], [0, 5, 14, 18, 3, 0.5, 1.6]]
        .forEach(([x, y, z, w, h, d, i]) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), lm(i)); b.position.set(x, y, z); es.add(b); });
      const fl = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshBasicMaterial({ color: 0x2c2c2c }));
      fl.rotation.x = -Math.PI / 2; es.add(fl);
      scene.environment = pm.fromScene(es, 0.03).texture;

      scene.add(new T.HemisphereLight(0xffffff, 0xd8d8d6, 0.5));
      const d = new T.DirectionalLight(0xffffff, 1.5); d.position.set(2.5, 9, 3.5); d.castShadow = true;
      d.shadow.mapSize.set(2048, 2048); Object.assign(d.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
      d.shadow.bias = -0.0004; scene.add(d);
      const g = new T.Mesh(new T.PlaneGeometry(24, 24), new T.ShadowMaterial({ opacity: this.getAttribute('theme') === 'dark' ? 0.5 : 0.14 }));
      g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      const cx = cv.getContext('2d'), gr = cx.createRadialGradient(128, 128, 8, 128, 128, 128);
      gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = gr; cx.fillRect(0, 0, 256, 256);
      const blob = new T.Mesh(new T.PlaneGeometry(5.8, 2.7), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false }));
      blob.rotation.x = -Math.PI / 2; blob.position.y = 0.002; scene.add(blob);

      this.camera = new T.PerspectiveCamera(30, 1, 0.1, 100);
      this._target = new T.Vector3(...VIEWS.overview.tgt);
      this.camera.position.set(...VIEWS.overview.pos);
      this._fromCam();

      this._buildCar();
      this._apply(true);
      this._bindControls();
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this);
      this._resize();
      if (this._zone !== 'overview') this._goZone(true);
      this._markSpots();
      this._last = performance.now();
      const loop = t => { this._raf = requestAnimationFrame(loop); this._tick(t); };
      this._raf = requestAnimationFrame(loop);
    }

    _mats() {
      const T = this.T;
      return {
        paint: new T.MeshPhysicalMaterial({ color: '#1f5fa8', metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.04 }),
        glass: new T.MeshPhysicalMaterial({ color: '#0b0e12', metalness: 0.2, roughness: 0.04, envMapIntensity: 1.6 }),
        black: new T.MeshStandardMaterial({ color: '#141416', roughness: 0.55, metalness: 0.2 }),
        gloss: new T.MeshPhysicalMaterial({ color: '#0c0c0d', roughness: 0.15, metalness: 0.3, clearcoat: 1 }),
        carbon: new T.MeshPhysicalMaterial({ color: '#202124', roughness: 0.35, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.08 }),
        tire: new T.MeshStandardMaterial({ color: '#1a1a1b', roughness: 0.92 }),
        barrel: new T.MeshStandardMaterial({ color: '#3a3b3e', roughness: 0.5, metalness: 0.7, side: T.DoubleSide }),
        disc: new T.MeshStandardMaterial({ color: '#8f9195', roughness: 0.42, metalness: 0.85 }),
        head: new T.MeshPhysicalMaterial({ color: '#e9eef2', emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.1, clearcoat: 1 }),
        tail: new T.MeshPhysicalMaterial({ color: '#5a0a0e', emissive: '#c0141c', emissiveIntensity: 0.45, roughness: 0.15, clearcoat: 1 }),
        liner: new T.MeshStandardMaterial({ color: '#0d0d0e', roughness: 1 })
      };
    }
    _box(w, h, d, m, x, y, z, rz) {
      const T = this.T, o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      o.position.set(x, y, z); if (rz) o.rotation.z = rz; o.castShadow = true; return o;
    }
    _extrude(pts, depth, m, bevel = 0.05, seg = 5) {
      const T = this.T, s = new T.Shape();
      pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
      const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 32 });
      g.translate(0, 0, -depth / 2); const o = new T.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o;
    }

    _buildCar() {
      const T = this.T, M = this.M = this._mats();
      const car = this.car = new T.Group(); this.scene.add(car);
      const ch = this.chassis = new T.Group(); car.add(ch);
      const s = new T.Shape();
      s.moveTo(-2.3, 0.3); s.lineTo(-1.81, 0.22); s.lineTo(-1.81, 0.34);
      s.absarc(-1.41, 0.34, 0.4, Math.PI, 0, true);
      s.lineTo(-1.01, 0.22); s.lineTo(1.0, 0.22); s.lineTo(1.0, 0.34);
      s.absarc(1.4, 0.34, 0.4, Math.PI, 0, true);
      s.lineTo(1.8, 0.24); s.lineTo(2.24, 0.27); s.lineTo(2.35, 0.44); s.lineTo(2.31, 0.62);
      s.lineTo(2.1, 0.73); s.lineTo(0.85, 0.86); s.lineTo(-1.3, 0.93); s.lineTo(-1.95, 0.98);
      s.lineTo(-2.28, 0.95); s.lineTo(-2.36, 0.7); s.lineTo(-2.3, 0.3);
      const bg = new T.ExtrudeGeometry(s, { depth: 1.76, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 6, curveSegments: 40 });
      bg.translate(0, 0, -0.88);
      const body = new T.Mesh(bg, M.paint); body.castShadow = true; body.receiveShadow = true; ch.add(body);
      ch.add(this._extrude([[0.85, 0.84], [0.05, 1.33], [-0.75, 1.36], [-1.25, 1.22], [-1.95, 0.97], [-1.95, 0.9], [0.85, 0.82]], 1.36, M.glass, 0.04));
      ch.add(this._extrude([[0.12, 1.28], [0.04, 1.345], [-0.75, 1.378], [-1.28, 1.235], [-1.22, 1.2], [-0.75, 1.33]], 1.34, M.paint, 0.03));
      [-1.41, 1.4].forEach(x => ch.add(this._box(0.78, 0.5, 1.3, M.liner, x, 0.5, 0)));
      [1, -1].forEach(sd => {
        ch.add(this._box(0.12, 0.07, 0.42, M.head, 2.24, 0.66, sd * 0.6, -0.35));
        ch.add(this._box(0.06, 0.08, 0.46, M.tail, -2.33, 0.86, sd * 0.6, 0.2));
        ch.add(this._box(0.04, 0.15, 0.24, M.gloss, 2.34, 0.54, sd * 0.17));
        ch.add(this._box(0.2, 0.09, 0.13, M.paint, 0.6, 1.0, sd * 0.86));
        ch.add(this._box(2.0, 0.05, 0.03, M.black, 0.0, 0.25, sd * 0.925));
      });
      ch.add(this._box(0.05, 0.12, 1.0, M.black, 2.31, 0.36, 0));
      ch.add(this._box(0.26, 0.08, 1.1, M.black, -2.25, 0.26, 0));
      this.wheelsG = new T.Group(); car.add(this.wheelsG);
      this.tipsG = new T.Group(); ch.add(this.tipsG);
      this.lipG = new T.Group(); ch.add(this.lipG);
      this.spoilerG = new T.Group(); ch.add(this.spoilerG);
      this.motorG = new T.Group(); ch.add(this.motorG);
      this._drop = 0; this._dropT = 0;
    }

    _bar(x1, y1, x2, y2, w, d, m, z) {
      const T = this.T, len = Math.hypot(x2 - x1, y2 - y1);
      const o = new T.Mesh(new T.BoxGeometry(len, w, d), m);
      o.position.set((x1 + x2) / 2, (y1 + y2) / 2, z); o.rotation.z = Math.atan2(y2 - y1, x2 - x1); o.castShadow = true; return o;
    }
    _wheel(rim, caliper) {
      const T = this.T, M = this.M, g = new T.Group(), R = rim.r || 0.245;
      const tp = [[R, -0.12], [0.315, -0.126], [0.338, -0.105], [0.345, 0], [0.338, 0.105], [0.315, 0.126], [R, 0.12]].map(p => new T.Vector2(p[0], p[1]));
      const tire = new T.Mesh(new T.LatheGeometry(tp, 56), M.tire); tire.rotation.x = Math.PI / 2; tire.castShadow = true; g.add(tire);
      const bar = new T.Mesh(new T.CylinderGeometry(R - 0.008, R - 0.008, 0.23, 48, 1, true), M.barrel); bar.rotation.x = Math.PI / 2; g.add(bar);
      const disc = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 0.03, 48), M.disc); disc.rotation.x = Math.PI / 2; disc.position.z = -0.02; g.add(disc);
      const hat = new T.Mesh(new T.CylinderGeometry(0.095, 0.095, 0.05, 32), M.barrel); hat.rotation.x = Math.PI / 2; g.add(hat);
      const cm = new T.MeshPhysicalMaterial({ color: caliper || '#1f4fa3', roughness: 0.3, metalness: 0.1, clearcoat: 1 });
      const ca = 2.35, cal = new T.Mesh(new T.BoxGeometry(0.1, 0.22, 0.08), cm);
      cal.position.set(Math.cos(ca) * 0.165, Math.sin(ca) * 0.165, 0.045); cal.rotation.z = ca; g.add(cal);
      const rm = new T.MeshPhysicalMaterial({ color: rim.color || '#c9cacc', metalness: rim.metal ?? 0.85, roughness: rim.rough ?? 0.3, clearcoat: 0.6 });
      const z = 0.1, inner = 0.055, outer = R - 0.012;
      const st = rim.style || 'double';
      if (st === 'double') {
        for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; [-0.11, 0.11].forEach(o => g.add(this._bar(Math.cos(a) * inner, Math.sin(a) * inner, Math.cos(a + o) * outer, Math.sin(a + o) * outer, 0.03, 0.035, rm, z))); }
      } else if (st === 'mesh' || st === 'thin12') {
        const n = st === 'mesh' ? 10 : 12, w = st === 'mesh' ? 0.026 : 0.018;
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.add(this._bar(Math.cos(a) * inner, Math.sin(a) * inner, Math.cos(a) * outer, Math.sin(a) * outer, w, 0.04, rm, z)); }
      } else if (st === 'y') {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2, mr = R * 0.55, mx = Math.cos(a) * mr, my = Math.sin(a) * mr;
          g.add(this._bar(Math.cos(a) * inner, Math.sin(a) * inner, mx, my, 0.05, 0.04, rm, z));
          [-0.24, 0.24].forEach(o => g.add(this._bar(mx, my, Math.cos(a + o) * outer, Math.sin(a + o) * outer, 0.03, 0.035, rm, z)));
        }
      }
      const lip = new T.Mesh(new T.TorusGeometry(R - 0.004, 0.013, 8, 64), rm); lip.position.z = z + 0.012; g.add(lip);
      const hub = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.045, 32), rm); hub.rotation.x = Math.PI / 2; hub.position.z = z; g.add(hub);
      return g;
    }
    _tips(kind) {
      const T = this.T, g = new T.Group();
      const mat = kind === 'carbon' ? this.M.carbon
        : kind === 'titan' ? new T.MeshPhysicalMaterial({ color: '#6d6ba8', metalness: 1, roughness: 0.25, iridescence: 1, iridescenceIOR: 1.6, side: T.DoubleSide })
        : new T.MeshStandardMaterial({ color: '#d9dadc', metalness: 1, roughness: 0.15, side: T.DoubleSide });
      const r = kind === 'carbon' ? 0.05 : 0.045;
      [-0.47, -0.33, 0.33, 0.47].forEach(zz => {
        const t = new T.Mesh(new T.CylinderGeometry(r, r, 0.13, 32, 1, true), mat); t.rotation.z = Math.PI / 2; t.position.set(-2.37, 0.31, zz); g.add(t);
        const c = new T.Mesh(new T.CircleGeometry(r * 0.92, 24), this.M.liner); c.rotation.y = -Math.PI / 2; c.position.set(-2.35, 0.31, zz); g.add(c);
      });
      return g;
    }
    _clear(g) { while (g.children.length) g.remove(g.children[0]); }
    _pop(g) { this._pops.push({ g, t: performance.now() }); }

    _apply(first) {
      if (!this.M) return;
      const c = this._cfg || {}, k = JSON.stringify;
      if (c.paint) this.M.paint.color.set(c.paint);
      const wk = k([c.rim, c.caliper]);
      if (wk !== this._wk) {
        this._wk = wk; this._clear(this.wheelsG);
        [[1.4, 1], [1.4, -1], [-1.41, 1], [-1.41, -1]].forEach(([x, sd]) => {
          const w = this._wheel(c.rim || {}, c.caliper); w.position.set(x, 0.345, sd * 0.8); if (sd < 0) w.rotation.y = Math.PI; this.wheelsG.add(w); if (!first) this._pop(w);
        });
      }
      this._dropT = c.drop || 0;
      if (c.tips !== this._tk) { this._tk = c.tips; this._clear(this.tipsG); const t = this._tips(c.tips || 'chrome'); this.tipsG.add(t); if (!first) this._pop(t); }
      if (c.lip !== this._lk) {
        this._lk = c.lip; this._clear(this.lipG);
        if (c.lip) { const m = c.lip === 'carbon' ? this.M.carbon : this.M.gloss, o = new this.T.Group();
          o.add(this._box(0.36, 0.024, 1.72, m, 2.16, 0.232, 0)); [1, -1].forEach(sd => o.add(this._box(0.22, 0.06, 0.02, m, 2.12, 0.26, sd * 0.86)));
          this.lipG.add(o); if (!first) this._pop(o); }
      }
      if (c.spoiler !== this._sk) {
        this._sk = c.spoiler; this._clear(this.spoilerG); const o = new this.T.Group();
        if (c.spoiler === 'lip') o.add(this._box(0.16, 0.035, 1.6, this.M.carbon, -2.22, 1.0, 0, 0.18));
        if (c.spoiler === 'wing') {
          [0.48, -0.48].forEach(zz => o.add(this._box(0.12, 0.2, 0.025, this.M.carbon, -2.12, 1.07, zz, 0.15)));
          o.add(this._box(0.34, 0.025, 1.78, this.M.carbon, -2.16, 1.18, 0, -0.08));
          [0.9, -0.9].forEach(zz => o.add(this._box(0.36, 0.1, 0.012, this.M.carbon, -2.16, 1.17, zz)));
        }
        this.spoilerG.add(o); if (!first && c.spoiler) this._pop(o);
      }
      if (c.intake !== this._ik) {
        this._ik = c.intake; this._clear(this.motorG);
        if (c.intake) { const o = new this.T.Group();
          o.add(this._box(0.5, 0.012, 0.5, c.intake === 'carbon' ? this.M.carbon : this.M.gloss, 1.55, 0.835, 0, -0.1));
          this.motorG.add(o); if (!first) this._pop(o); }
      }
    }

    _fromCam() {
      const o = this.camera.position.clone().sub(this._target);
      this._sph = { r: o.length(), th: Math.atan2(o.x, o.z), ph: Math.acos(Math.min(1, Math.max(-1, o.y / o.length()))) };
    }
    _toCam() {
      const { r, th, ph } = this._sph;
      this.camera.position.set(this._target.x + r * Math.sin(ph) * Math.sin(th), this._target.y + r * Math.cos(ph), this._target.z + r * Math.sin(ph) * Math.cos(th));
      this.camera.lookAt(this._target);
    }
    _fit() { const a = this._aspect || 1.6; return Math.pow(Math.max(1, 1.45 / a), 0.55); }
    _goZone(instant) {
      const T = this.T, v = VIEWS[this._zone] || VIEWS.overview;
      const tgt = new T.Vector3(...v.tgt), pos = new T.Vector3(...v.pos).sub(tgt).multiplyScalar(this._fit()).add(tgt);
      if (instant) { this._target.copy(tgt); this.camera.position.copy(pos); this.camera.lookAt(tgt); this._fromCam(); return; }
      this._tw = { t0: performance.now(), dur: 1100, p0: this.camera.position.clone(), t0v: this._target.clone(), p1: pos, t1v: tgt };
    }
    _bindControls() {
      const pts = new Map(); let pinch = 0;
      this.addEventListener('pointerdown', e => { this.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); this._tw = null; this._interact = performance.now(); });
      this.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        const [px, py] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
        if (pts.size === 2) {
          const [a, b] = [...pts.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (pinch) this._sph.r = Math.min(13, Math.max(2, this._sph.r * pinch / dd)); pinch = dd;
        } else {
          this._sph.th -= (e.clientX - px) * 0.006; this._sph.ph = Math.min(1.52, Math.max(0.2, this._sph.ph - (e.clientY - py) * 0.005));
        }
        this._toCam(); this._interact = performance.now();
      });
      const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
      this.addEventListener('pointerup', up); this.addEventListener('pointercancel', up);
      this.addEventListener('wheel', e => { e.preventDefault(); this._tw = null; this._sph.r = Math.min(13, Math.max(2, this._sph.r * (1 + e.deltaY * 0.001))); this._toCam(); this._interact = performance.now(); }, { passive: false });
    }
    _resize() {
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      this._aspect = w / h; this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      if (!this._tw && !this._interact) this._goZone(true);
    }
    _tick(now) {
      const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now;
      if (this._tw) {
        const p = Math.min(1, (now - this._tw.t0) / this._tw.dur), e = ease(p);
        this.camera.position.lerpVectors(this._tw.p0, this._tw.p1, e); this._target.lerpVectors(this._tw.t0v, this._tw.t1v, e);
        this.camera.lookAt(this._target);
        if (p >= 1) { this._tw = null; this._fromCam(); }
      } else if (this.hasAttribute('spin') && !(this._interact && now - this._interact < 3000)) {
        const tt = BASE_TH + (parseFloat(this.getAttribute('spin')) || 0);
        this._sph.th += (tt - this._sph.th) * Math.min(1, dt * 5); this._toCam();
      } else if (this.getAttribute('autorotate') === 'on' && !(this._interact && now - this._interact < 3000)) {
        this._sph.th += dt * 0.12; this._toCam();
      }
      this._drop += (this._dropT - this._drop) * Math.min(1, dt * 6);
      this.chassis.position.y = -this._drop;
      this._pops = this._pops.filter(({ g, t }) => {
        const p = Math.min(1, (now - t) / 520), s = 1 + Math.sin(p * Math.PI) * 0.06 * (1 - p) - (1 - ease(p)) * 0.12;
        g.scale.setScalar(s); return p < 1;
      });
      this.renderer.render(this.scene, this.camera);
      const off = this.getAttribute('hotspots') === 'off', w = this.clientWidth, h = this.clientHeight, T = this.T, v = new T.Vector3(), cp = this.camera.position;
      SPOTS.forEach((s, i) => {
        const el = this._spotEls[i];
        v.set(s.p[0], s.p[1] - (s.zone === 'felgen' || s.zone === 'bremsen' ? 0 : this._drop), s.p[2]);
        const facing = (cp.x - v.x) * s.n[0] + (cp.y - v.y) * s.n[1] + (cp.z - v.z) * s.n[2] > 0;
        v.project(this.camera);
        const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
        const vis = !off && facing && v.z < 1 && x > 8 && x < w - 40 && y > 8 && y < h - 8;
        el.classList.toggle('hide', !vis);
        el.style.transform = `translate(${x - 11}px,${y - 11}px)`;
      });
    }
  }
  customElements.define('gp-car-stage', GPCarStage);
})();
