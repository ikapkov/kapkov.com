import * as THREE from 'three';

const STYLE_ID = 'exact-logo-loader-style';

const DEFAULT_STROKES_URL = new URL(
  './assets/logo-strokes.png',
  import.meta.url
).href;

const DEFAULT_REVEAL_MAP_URL = new URL(
  './assets/logo-reveal-map.png',
  import.meta.url
).href;

const DEFAULT_DOT_URL = new URL(
  './assets/logo-dot.png',
  import.meta.url
).href;

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .exact-logo-loader {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition:
        opacity var(--exact-loader-fade, 480ms) ease,
        visibility var(--exact-loader-fade, 480ms) ease;
    }

    .exact-logo-loader.is-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .exact-logo-loader__canvas {
      display: block;
      width: min(72vw, 410px);
      height: auto;
      aspect-ratio: 1;
    }
  `;
  document.head.append(style);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutBack(value) {
  const t = clamp01(value);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export class ExactLogoLoader {
  constructor({
    strokesUrl = DEFAULT_STROKES_URL,
    revealMapUrl = DEFAULT_REVEAL_MAP_URL,
    dotUrl = DEFAULT_DOT_URL,
    background = '#ffffff',
    size = 512,
    planeSize = 1.72,
    fadeDuration = 480,
    dotDuration = 260,
    holdAfterDot = 720,
    autoStart = true
  } = {}) {
    installStyles();

    this.size = size;
    this.planeSize = planeSize;
    this.dotDuration = dotDuration / 1000;
    this.holdAfterDot = holdAfterDot;

    this.targetProgress = 0;
    this.visibleProgress = 0;
    this.dotProgress = 0;
    this.running = false;
    this.lastTime = performance.now();
    this.rafId = 0;
    this.hideTimer = 0;

    this.overlay = document.createElement('div');
    this.overlay.className = 'exact-logo-loader';
    this.overlay.style.background = background;
    this.overlay.style.setProperty('--exact-loader-fade', `${fadeDuration}ms`);
    document.body.append(this.overlay);

    this._initThree();
    this.overlay.append(this.renderer.domElement);

    this.ready = this._loadTextures(strokesUrl, revealMapUrl, dotUrl);

    this._onVisibilityChange = () => {
      if (document.hidden) {
        this.stop();
      } else if (!this.overlay.classList.contains('is-hidden')) {
        this.start();
      }
    };

    document.addEventListener('visibilitychange', this._onVisibilityChange);

    if (autoStart) this.start();
  }

  _initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 2;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.size, this.size, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'exact-logo-loader__canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
  }

  async _loadTextures(strokesUrl, revealMapUrl, dotUrl) {
    const loader = new THREE.TextureLoader();

    const load = (url) =>
      new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });

    const [strokesTexture, revealTexture, dotTexture] = await Promise.all([
      load(strokesUrl),
      load(revealMapUrl),
      load(dotUrl)
    ]);

    strokesTexture.colorSpace = THREE.SRGBColorSpace;
    dotTexture.colorSpace = THREE.SRGBColorSpace;

    for (const texture of [strokesTexture, revealTexture, dotTexture]) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
    }

    this.uniforms = {
      uLogo: { value: strokesTexture },
      uRevealMap: { value: revealTexture },
      uProgress: { value: 0 }
    };

    this.strokeMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform sampler2D uLogo;
        uniform sampler2D uRevealMap;
        uniform float uProgress;

        varying vec2 vUv;

        void main() {
          vec4 logo = texture2D(uLogo, vUv);
          vec4 revealData = texture2D(uRevealMap, vUv);

          float pathPosition = revealData.r;
          float strokeMask = revealData.g;

          // Заредената част е плътна. Само активният край има лек fade.
          float fadeLength = 0.055;
          float movingFront = 1.0 - smoothstep(
            uProgress - fadeLength,
            uProgress,
            pathPosition
          );

          // При достигане на 100% премахваме fade-а и целият
          // оригинален елемент става напълно плътен.
          float completion = smoothstep(0.985, 1.0, uProgress);
          float visiblePart = mix(movingFront, 1.0, completion);

          float progressGate = step(0.0005, uProgress);
          float finalAlpha =
            logo.a * strokeMask * visiblePart * progressGate;

          if (finalAlpha < 0.002) discard;
          gl_FragColor = vec4(logo.rgb, finalAlpha);
          #include <colorspace_fragment>
        }
      `
    });

    this.strokeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.planeSize, this.planeSize),
      this.strokeMaterial
    );
    this.scene.add(this.strokeMesh);

    this.dotMaterial = new THREE.MeshBasicMaterial({
      map: dotTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    const dotWorldWidth = this.planeSize * (112 / 512);
    const dotWorldHeight = this.planeSize * (113 / 512);

    this.dotMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(dotWorldWidth, dotWorldHeight),
      this.dotMaterial
    );

    this.dotMesh.position.x =
      ((256.0 / 512) - 0.5) * this.planeSize;
    this.dotMesh.position.y =
      (0.5 - (339.5 / 512)) * this.planeSize;
    this.dotMesh.position.z = 0.01;
    this.dotMesh.scale.setScalar(0.001);

    this.scene.add(this.dotMesh);
  }

  connect(manager) {
    const previous = {
      onStart: manager.onStart,
      onProgress: manager.onProgress,
      onLoad: manager.onLoad,
      onError: manager.onError
    };

    manager.onStart = (...args) => {
      previous.onStart?.call(manager, ...args);
      this.show(true);
    };

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      previous.onProgress?.call(manager, url, itemsLoaded, itemsTotal);
      this.setProgress(itemsTotal > 0 ? itemsLoaded / itemsTotal : 0);
    };

    manager.onLoad = (...args) => {
      previous.onLoad?.call(manager, ...args);
      this.complete();
    };

    manager.onError = (...args) => {
      previous.onError?.call(manager, ...args);
      this.overlay.dataset.error = 'true';
    };

    return manager;
  }

  setProgress(value) {
    this.targetProgress = clamp01(Number(value) || 0);
    return this;
  }

  show(reset = false) {
    window.clearTimeout(this.hideTimer);

    if (reset) {
      this.targetProgress = 0;
      this.visibleProgress = 0;
      this.dotProgress = 0;

      if (this.uniforms) this.uniforms.uProgress.value = 0;
      if (this.dotMesh) {
        this.dotMesh.scale.setScalar(0.001);
        this.dotMaterial.opacity = 0;
      }
    }

    this.overlay.classList.remove('is-hidden');
    this.start();
    return this;
  }

  complete() {
    this.setProgress(1);

    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(
      () => this.hide(),
      1400 + this.holdAfterDot
    );

    return this;
  }

  hide() {
    this.overlay.classList.add('is-hidden');

    window.setTimeout(() => {
      if (this.overlay.classList.contains('is-hidden')) this.stop();
    }, 560);

    return this;
  }

  start() {
    if (this.running) return this;

    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((time) => this._animate(time));
    return this;
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    return this;
  }

  _animate(now) {
    if (!this.running) return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    const response = 1 - Math.exp(-8.2 * dt);
    this.visibleProgress +=
      (this.targetProgress - this.visibleProgress) * response;

    if (Math.abs(this.visibleProgress - this.targetProgress) < 0.0005) {
      this.visibleProgress = this.targetProgress;
    }

    if (this.uniforms) {
      this.uniforms.uProgress.value = this.visibleProgress;
    }

    if (this.visibleProgress >= 0.997 && this.targetProgress >= 1) {
      this.dotProgress = Math.min(
        1,
        this.dotProgress + dt / this.dotDuration
      );
    } else {
      this.dotProgress = 0;
    }

    if (this.dotMesh) {
      const dotEase = easeOutBack(this.dotProgress);
      this.dotMesh.scale.setScalar(Math.max(0.001, dotEase));
      this.dotMaterial.opacity = clamp01(this.dotProgress * 1.6);
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame((nextTime) => this._animate(nextTime));
  }

  destroy() {
    this.stop();
    window.clearTimeout(this.hideTimer);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);

    this.scene.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry?.dispose();

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      for (const material of materials) {
        material.map?.dispose();
        material.dispose();
      }
    });

    this.uniforms?.uLogo.value.dispose();
    this.uniforms?.uRevealMap.value.dispose();
    this.renderer.dispose();
    this.overlay.remove();
  }
}

export default ExactLogoLoader;
