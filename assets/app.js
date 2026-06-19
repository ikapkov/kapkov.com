import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import LogoLoader from "./threejs-logo-loader/index.js";

const galleryGrid = document.querySelector("#galleryGrid");
const featuredGrid = document.querySelector("#featuredGrid");
const dialog = document.querySelector("#projectDialog");
const closeDialog = document.querySelector("#closeDialog");
const projectTitle = document.querySelector("#projectTitle");
const projectDescription = document.querySelector("#projectDescription");
const projectCover = document.querySelector("#projectCover");
const viewerFrame = document.querySelector("#viewerFrame");
const modelCanvas = document.querySelector("#modelCanvas");
const modelState = document.querySelector("#modelState");
const imageStrip = document.querySelector("#imageStrip");
const heroSection = document.querySelector("#news.home-hero");
const heroCanvas = document.querySelector("#heroGallery");
const heroCounter = document.querySelector("#heroCounter");
const heroCurrent = document.querySelector("#heroCurrent");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];
const languageButtons = [...document.querySelectorAll(".language-switcher button")];
const brandLink = document.querySelector(".brand");
const brandText = document.querySelector(".brand span");
const primaryNav = document.querySelector(".site-nav");
const languageSwitcher = document.querySelector(".language-switcher");
const metaDescription = document.querySelector('meta[name="description"]');
const galleryTitle = document.querySelector("#gallery-title");
const bioCopy = document.querySelector(".bio-copy");
const bioMediaImage = document.querySelector(".bio-media img");
const contactTitle = document.querySelector("#contact-title");
const contactCopy = document.querySelector(".contact-copy");
const contactSocials = document.querySelector(".contact-socials");

let activeViewer = null;
let activeProject = null;
let projectsCache = [];
let viewerRequestId = 0;
let resizeHero = () => {};
let heroInitPromise = null;
let currentLanguage = localStorage.getItem("kapkov-language") === "en" ? "en" : "bg";

const DEFAULT_TAB = "news";
const VALID_TABS = ["news", "gallery", "biography", "contacts"];
const LEGACY_TABS = {
  home: "news",
  new: "news",
  aktualno: "news",
  galeria: "gallery",
  biografia: "biography",
  kontakti: "contacts",
};

const PROJECT_TITLE_EN = new Map([
  ["Склад от навесен тип", "Canopy-Type Warehouse"],
  ["Стоково Тържище", "Wholesale Market"],
  ["Хангар за частни и корпоративни самолети", "Hangar for Private and Corporate Aircraft"],
  ["Пешеходен мост*", "Pedestrian Bridge*"],
  ["Авиоремонтна база", "Aircraft Maintenance Base"],
  ["Административна сграда на завод*", "Factory Administration Building*"],
  ["Склад за техника и селскостопанска продукция", "Warehouse for Machinery and Agricultural Products"],
  ["Градски парк", "Urban Park"],
  ["Разширение на производствен цех", "Production Workshop Extension"],
  ["Фамилна къща", "Family House"],
  ["Реновация на административна сграда, здравен център и главен вход на завод*", "Renovation of an Administration Building, Health Center and Main Factory Entrance*"],
  ["Други", "Other"],
]);

const I18N = {
  bg: {
    htmlLang: "bg",
    title: "арх. Иво Капков",
    description: "Архитектурна галерия с проекти, изображения и интерактивни 3D модели.",
    brand: "арх. Иво Капков",
    homeLabel: "Начало",
    primaryNav: "Основна навигация",
    languageChoice: "Избор на език",
    nav: {
      news: "Актуално",
      gallery: "Галерия",
      biography: "Биография",
      contacts: "Контакти",
    },
    labels: {
      hero: "Актуално",
      nextHeroImage: "Следващо изображение",
      close: "Затвори",
      projectImages: "Снимки на проекта",
      modelLoading: "Зареждане на 3D модел",
      modelError: "Моделът не може да бъде зареден",
      model: "3D модел",
      photo: "снимка",
      previousImage: "предишна снимка",
      nextImage: "следваща снимка",
      socialProfiles: "Социални профили",
    },
    bio: {
      title: "Биография",
      paragraphs: [
        "Иво Капков е проектов ръководител, архитект и докторант, със специализация в индустриалните сгради и съоръжения.",
        "Роден е на 1 юни 1996 г. в град Бургас. Израства в семейство на инженер-конструктор. През 2015 г. завършва с отличие средното си образование в Природо-математическа гимназия „Академик Никола Обрешков“, град Бургас. Продължава висшето си образование в Университета по архитектура, строителство и геодезия, град София. През 2021 г. е дипломиран със степен магистър, специализирайки в катедра „Промишлени и аграрни сгради“. Награден е от Камара на архитектите в България - РК София град за отлична разработка на дипломен проект.",
        "След 2021 г. арх. Капков практикува като проектов ръководител и проектант на нови национални и международни индустриални обекти. Развива умения в проектирането на сгради и съоръжения, управление на инвестиционни процеси, координиране на проектни и строителни дейности, приложение и контрол на строително-информационни модели, както и в графично представяне, изготвяне на технически детайли и спецификации.",
        "През 2023 г., след спечелен конкурс, арх. Капков е зачислен като редовен докторант към катедра „Индустриални сгради“ в Университета по архитектура, строителство и геодезия, град София. Област на неговата научно-изследователска дейност е въздействието на сглобяемите фасадни системи върху архитектурния образ на индустриалните сгради.",
      ],
      membershipsTitle: "Членства и участия в организации:",
      memberships: [
        "Камара на Архитектите в България, Регионална колегия – град Бургас",
        "Съюз на Архитектите в България, Дружество София – УАСГ",
      ],
      details: [
        "Езикови умения: английски, немски и български език.",
        "Извънпрофесионални интереси: планинарство, ски, автомобилизъм.",
      ],
      imageAlt: "арх. Иво Капков",
    },
    contacts: {
      title: "Контакти",
      name: "арх. Иво Капков",
    },
  },
  en: {
    htmlLang: "en",
    title: "Ivo Kapkov, Architect",
    description: "Architectural portfolio with projects, images and interactive 3D models.",
    brand: "Ivo Kapkov, Architect",
    homeLabel: "Home",
    primaryNav: "Main navigation",
    languageChoice: "Language selection",
    nav: {
      news: "News",
      gallery: "Gallery",
      biography: "Biography",
      contacts: "Contacts",
    },
    labels: {
      hero: "New",
      nextHeroImage: "Next image",
      close: "Close",
      projectImages: "Project images",
      modelLoading: "Loading 3D model",
      modelError: "The model cannot be loaded",
      model: "3D model",
      photo: "image",
      previousImage: "previous image",
      nextImage: "next image",
      socialProfiles: "Social profiles",
    },
    bio: {
      title: "Biography",
      paragraphs: [
        "Ivo Kapkov is a project manager, architect and PhD candidate with a specialisation in industrial buildings and installations.",
        "Born on June 1, 1996, in Burgas, he grew up in a family of engineers. In 2015, he graduated with honors from the “Academician Nikola Obreshkov” Natural Sciences and Mathematics High School in Burgas. He continued his higher education at the University of Architecture, Civil Engineering, and Geodesy in Sofia. In 2021, he earned a master’s degree, specializing in the Department of Industrial and Agricultural Buildings. His master’s thesis is awarded by the Bulgarian Chamber of Architects for its quality.",
        "Since 2021, Architect Kapkov works as a project manager and designer on national and international industrial projects. His experience includes designing buildings and facilities, managing investment processes, coordinating design and construction activities, developing and managing building information models, as well as graphical presentation, preparation of technical details, and specifications.",
        "In 2023, after winning a scholarship, Architect Kapkov became a full-time PhD candidate at the Department of Industrial Buildings at the University of Architecture, Civil Engineering, and Geodesy in Sofia. His academic research area is the effect of prefabricated facade systems on the architectural image of industrial buildings.",
      ],
      membershipsTitle: "Member of:",
      memberships: [
        "Chamber of Architects in Bulgaria",
        "Union of Architects in Bulgaria",
      ],
      details: [
        "Language skills: English, German and Bulgarian.",
        "Personal interests: hiking, skiing and motorsport.",
      ],
      imageAlt: "arch. Ivo Kapkov",
    },
    contacts: {
      title: "Contacts",
      name: "Ivo Kapkov, Architect",
    },
  },
};

const getActiveTab = () => {
  const rawTab = window.location.hash.replace("#", "");
  const tab = LEGACY_TABS[rawTab] || rawTab;
  return VALID_TABS.includes(tab) ? tab : DEFAULT_TAB;
};

const setActiveTab = (tab = getActiveTab()) => {
  const currentHash = window.location.hash.replace("#", "");
  if (currentHash && currentHash !== tab) {
    window.history.replaceState(null, "", `#${tab}`);
  }

  tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.tabPanel !== tab;
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${tab}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (tab === "news") {
    ensureHeroInitialised();
    resizeHero();
  }
};

const scheduleTabUpdate = () => {
  requestAnimationFrame(() => {
    setActiveTab();
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "auto" }), 0);
  });
};

const text = async (url, fallback = "") => {
  try {
    const response = await fetch(url);
    if (!response.ok) return fallback;
    return await response.text();
  } catch {
    return fallback;
  }
};

const fileExists = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
};

const projectPath = (project, file) => encodeURI(`projects/${project.folder}/${file}`);

const folderTitle = (folder) => folder.replace(/[-_]+/g, " ").trim();

const getTranslation = () => I18N[currentLanguage];

const localizedProjectTitle = (project) => {
  const fallback = project.title || folderTitle(project.folder);
  if (currentLanguage === "en") {
    return project.titleEn || PROJECT_TITLE_EN.get(fallback) || fallback;
  }
  return fallback;
};

const resolveDescription = async (project) => {
  const fallbackFile = project.description || "description.txt";

  if (currentLanguage === "en") {
    const englishFile = project.descriptionEn || "description.en.txt";
    const englishText = await text(projectPath(project, englishFile), "");
    if (englishText.trim()) return englishText;
  }

  return text(projectPath(project, fallbackFile), "");
};

const renderBiography = () => {
  if (!bioCopy) return;
  const { bio } = getTranslation();
  const title = document.createElement("h2");
  const membershipsTitle = document.createElement("h3");
  const memberships = document.createElement("ul");

  title.id = "bio-title";
  title.textContent = bio.title;
  bioCopy.replaceChildren(title);

  bio.paragraphs.forEach((paragraph) => {
    const item = document.createElement("p");
    item.textContent = paragraph;
    bioCopy.append(item);
  });

  membershipsTitle.textContent = bio.membershipsTitle;
  bioCopy.append(membershipsTitle);

  bio.memberships.forEach((membership) => {
    const item = document.createElement("li");
    item.textContent = membership;
    memberships.append(item);
  });
  bioCopy.append(memberships);

  bio.details.forEach((detail) => {
    const item = document.createElement("p");
    item.className = "bio-detail";
    item.textContent = detail;
    bioCopy.append(item);
  });

  if (bioMediaImage) bioMediaImage.alt = bio.imageAlt;
};

const renderContacts = () => {
  const { contacts, labels } = getTranslation();
  if (contactTitle) contactTitle.textContent = contacts.title;
  const contactName = contactCopy?.querySelector("p");
  if (contactName) contactName.textContent = contacts.name;
  if (contactSocials) contactSocials.setAttribute("aria-label", labels.socialProfiles);
};

const updateOpenProjectLanguage = async () => {
  if (!activeProject || !dialog.open) return;
  const title = localizedProjectTitle(activeProject);

  projectTitle.textContent = title;
  projectCover.alt = title;
  projectDescription.textContent = await resolveDescription(activeProject);
};

const applyLanguage = () => {
  const translation = getTranslation();

  document.documentElement.lang = translation.htmlLang;
  document.title = translation.title;
  if (metaDescription) metaDescription.setAttribute("content", translation.description);
  if (brandText) brandText.textContent = translation.brand;
  if (brandLink) brandLink.setAttribute("aria-label", translation.homeLabel);
  if (primaryNav) primaryNav.setAttribute("aria-label", translation.primaryNav);
  if (languageSwitcher) languageSwitcher.setAttribute("aria-label", translation.languageChoice);
  if (heroSection) heroSection.setAttribute("aria-label", translation.labels.hero);
  if (heroCounter) heroCounter.setAttribute("aria-label", translation.labels.nextHeroImage);
  if (closeDialog) closeDialog.setAttribute("aria-label", translation.labels.close);
  if (imageStrip) imageStrip.setAttribute("aria-label", translation.labels.projectImages);
  if (galleryTitle) galleryTitle.textContent = translation.nav.gallery;

  navLinks.forEach((link) => {
    const key = link.dataset.navKey;
    if (key && translation.nav[key]) link.textContent = translation.nav[key];
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === currentLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderBiography();
  renderContacts();

  if (projectsCache.length) {
    renderGalleryCards(projectsCache);
  }
  updateOpenProjectLanguage();
};

const resolveCover = async (project) => {
  if (project.cover) return projectPath(project, project.cover);

  if (Array.isArray(project.images) && project.images.length) {
    const imageUrl = projectPath(project, project.images[0]);
    if (await fileExists(imageUrl)) return imageUrl;
  }

  const candidates = ["cover.jpg", "cover.jpeg", "cover.png", "cover.webp", "cover.svg"];
  for (const candidate of candidates) {
    const url = projectPath(project, candidate);
    if (await fileExists(url)) return url;
  }

  return projectPath(project, "cover.svg");
};

const resolveImages = async (project, coverUrl) => {
  if (Array.isArray(project.images) && project.images.length) {
    return project.images.map((image) => projectPath(project, image));
  }

  return [coverUrl];
};

const destroyViewer = () => {
  if (!activeViewer) return;
  activeViewer.controls.dispose();
  activeViewer.renderer.dispose();
  activeViewer.resizeObserver.disconnect();
  activeViewer.dracoLoader?.dispose();
  activeViewer.loadingScreen?.destroy();
  cancelAnimationFrame(activeViewer.frameId);
  activeViewer = null;
};

const fitCameraToObject = (camera, object, controls) => {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxSize / (2 * Math.tan((camera.fov * Math.PI) / 360));

  camera.position.set(center.x + distance, center.y + distance * 0.65, center.z + distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
};

const createViewer = async (modelUrl) => {
  destroyViewer();

  const loadingScreen = new LogoLoader({
    background: "rgba(248, 249, 250, 0.96)",
    size: 192,
    fadeDuration: 420,
    holdAfterDot: 360,
    autoStart: true,
  });
  loadingScreen.overlay.classList.add("model-loading-screen");
  viewerFrame.append(loadingScreen.overlay);
  loadingScreen.show(true);

  const renderer = new THREE.WebGLRenderer({
    canvas: modelCanvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f9fa);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8b8b80, 1.6);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 7, 5);
  scene.add(hemi, key);

  const grid = new THREE.GridHelper(12, 12, 0x9aa0a6, 0xdadce0);
  grid.material.opacity = 0.3;
  grid.material.transparent = true;
  scene.add(grid);

  const resize = () => {
    const rect = viewerFrame.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewerFrame);
  resize();

  const manager = new THREE.LoadingManager();
  loadingScreen.connect(manager);

  const dracoLoader = new DRACOLoader(manager);
  dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/");

  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);
  activeViewer = { renderer, controls, resizeObserver, dracoLoader, loadingScreen, frameId: 0 };

  const gltf = await loader.loadAsync(modelUrl);
  if (activeViewer?.renderer !== renderer) {
    throw new Error("Viewer loading was cancelled.");
  }

  const model = gltf.scene;
  scene.add(model);
  fitCameraToObject(camera, model, controls);

  const animate = () => {
    if (activeViewer?.renderer !== renderer) return;
    activeViewer.frameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  animate();
};

const showProjectImage = (url, title) => {
  viewerRequestId += 1;
  destroyViewer();
  viewerFrame.classList.remove("model-ready", "model-loading");
  modelState.textContent = "";
  projectCover.src = url;
  projectCover.alt = title;
};

const showProjectModel = async (modelUrl, posterUrl, title) => {
  const requestId = (viewerRequestId += 1);
  const { labels } = getTranslation();

  destroyViewer();
  viewerFrame.classList.remove("model-ready");
  viewerFrame.classList.add("model-loading");
  modelState.textContent = labels.modelLoading;
  projectCover.src = posterUrl;
  projectCover.alt = title;

  try {
    await createViewer(modelUrl);
    if (requestId !== viewerRequestId) {
      destroyViewer();
      return;
    }
    modelState.textContent = "";
    viewerFrame.classList.remove("model-loading");
    viewerFrame.classList.add("model-ready");
  } catch {
    if (requestId === viewerRequestId) {
      destroyViewer();
      viewerFrame.classList.remove("model-loading");
      modelState.textContent = getTranslation().labels.modelError;
    }
  }
};

const setCurrentStripButton = (button) => {
  imageStrip.querySelectorAll("button").forEach((item) => item.removeAttribute("aria-current"));
  button.setAttribute("aria-current", "true");
};

const renderImageStrip = (images, title, modelUrl = "", posterUrl = "") => {
  const { labels } = getTranslation();

  imageStrip.replaceChildren();

  if (!modelUrl && images.length < 2) return;

  if (modelUrl) {
    const modelButton = document.createElement("button");
    const modelLabel = document.createElement("span");

    modelButton.type = "button";
    modelButton.className = "model-thumb";
    modelButton.setAttribute("aria-label", `${title} - ${labels.model}`);
    modelButton.setAttribute("aria-current", "true");
    modelLabel.textContent = "3D";

    modelButton.append(modelLabel);
    modelButton.addEventListener("click", () => {
      setCurrentStripButton(modelButton);
      showProjectModel(modelUrl, posterUrl || images[0], title);
    });

    imageStrip.append(modelButton);
  }

  images.forEach((imageUrl, index) => {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.type = "button";
    button.setAttribute("aria-label", `${title} - ${labels.photo} ${index + 1}`);
    if (!modelUrl && index === 0) button.setAttribute("aria-current", "true");

    image.src = imageUrl;
    image.alt = "";
    image.loading = "lazy";

    button.append(image);
    button.addEventListener("click", () => {
      setCurrentStripButton(button);
      showProjectImage(imageUrl, title);
    });

    imageStrip.append(button);
  });
};

const openProject = async (project) => {
  const title = localizedProjectTitle(project);
  const coverUrl = await resolveCover(project);
  const images = await resolveImages(project, coverUrl);
  const modelUrl = projectPath(project, project.model || "model.glb");
  const modelExists = await fileExists(modelUrl);

  activeProject = project;
  viewerRequestId += 1;
  destroyViewer();
  viewerFrame.classList.remove("model-ready", "model-loading");
  modelState.textContent = "";
  modelCanvas.removeAttribute("style");
  projectTitle.textContent = title;
  projectCover.src = images[0];
  projectCover.alt = title;
  projectDescription.textContent = await resolveDescription(project);
  renderImageStrip(images, title, modelExists ? modelUrl : "", images[0]);

  dialog.showModal();

  if (modelExists) {
    await showProjectModel(modelUrl, images[0], title);
  }
};

const createCardDots = (count) => {
  const dots = document.createElement("span");
  const safeCount = Math.max(1, count);

  dots.className = "card-dots";
  dots.setAttribute("aria-hidden", "true");

  for (let index = 0; index < safeCount; index += 1) {
    const dot = document.createElement("span");
    if (index === 0) dot.className = "is-active";
    dots.append(dot);
  }

  return dots;
};

const createCard = async (project) => {
  const title = localizedProjectTitle(project);
  const card = document.createElement("article");
  const media = document.createElement("div");
  const imageButton = document.createElement("button");
  const image = document.createElement("img");
  const label = document.createElement("button");
  const coverUrl = await resolveCover(project);
  const images = await resolveImages(project, coverUrl);
  const modelUrl = projectPath(project, project.model || "model.glb");
  const modelExists = await fileExists(modelUrl);
  const dots = createCardDots(images.length);
  const isWide = project.layout === "wide";
  let cardImageIndex = 0;

  const updateCardImage = (direction) => {
    cardImageIndex = (cardImageIndex + direction + images.length) % images.length;
    image.src = images[cardImageIndex];
    dots.querySelectorAll("span").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === cardImageIndex);
    });
  };

  card.className = isWide ? "project-card is-wide" : "project-card";
  media.className = "project-media";
  imageButton.className = "project-image-button";
  imageButton.type = "button";
  image.src = images[0];
  image.alt = "";
  image.loading = "lazy";
  label.className = "project-title";
  label.type = "button";
  label.textContent = title;

  imageButton.append(image);
  media.append(imageButton);

  if (modelExists) {
    const modelBadge = document.createElement("span");
    modelBadge.className = "project-3d-badge";
    modelBadge.textContent = "3D";
    modelBadge.setAttribute("aria-hidden", "true");
    media.append(modelBadge);
  }

  if (images.length > 1) {
    const previousButton = document.createElement("button");
    const nextButton = document.createElement("button");

    previousButton.className = "gallery-card-nav gallery-card-prev";
    previousButton.type = "button";
    previousButton.setAttribute("aria-label", `${title} - ${getTranslation().labels.previousImage}`);
    previousButton.textContent = "‹";

    nextButton.className = "gallery-card-nav gallery-card-next";
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", `${title} - ${getTranslation().labels.nextImage}`);
    nextButton.textContent = "›";

    previousButton.addEventListener("click", (event) => {
      event.stopPropagation();
      updateCardImage(-1);
    });

    nextButton.addEventListener("click", (event) => {
      event.stopPropagation();
      updateCardImage(1);
    });

    media.append(previousButton, nextButton);
  }

  imageButton.addEventListener("click", () => openProject(project));
  label.addEventListener("click", () => openProject(project));
  card.append(media, dots, label);
  return card;
};

const renderGalleryCards = async (projects) => {
  const cards = await Promise.all(projects.map(createCard));

  galleryGrid.replaceChildren(...cards);

  if (featuredGrid) {
    const featuredCards = await Promise.all(projects.slice(0, 5).map(createCard));
    featuredGrid.replaceChildren(...featuredCards);
  }
};

const renderGallery = async () => {
  projectsCache = await fetch("projects/projects.json").then((response) => response.json());
  await renderGalleryCards(projectsCache);
};

const initialiseHero = async () => {
  if (!heroSection || !heroCanvas || !heroCounter || !heroCurrent) return;

  const slides = [
    {
      url: "assets/hero/02-industrial-complex.jpg",
      tone: "dark",
      zoom: [1.018, 1.07],
      offset: [[-0.018, 0.018], [0.014, -0.008]],
      parallax: 0.009,
    },
    {
      url: "assets/hero/03-facades-panorama.jpg",
      tone: "dark",
      zoom: [1.005, 1.025],
      offset: [[-0.185, 0], [0.185, 0]],
      parallax: 0.003,
    },
    {
      url: "assets/hero/01-airport-building.jpg",
      tone: "dark",
      zoom: [1.035, 1.095],
      offset: [[-0.008, -0.012], [0.016, 0.006]],
      parallax: 0.01,
    },
    {
      url: "assets/hero/05-urban-connection.jpg",
      tone: "light",
      zoom: [1.015, 1.05],
      offset: [[0, 0.175], [0, -0.175]],
      parallax: 0.007,
    },
    {
      url: "assets/hero/04-structural-model.jpg",
      tone: "dark",
      zoom: [1.015, 1.07],
      offset: [[-0.012, 0.012], [0.014, -0.01]],
      parallax: 0.006,
    },
  ];

  const transitionDuration = 1.35;
  const sceneMotionDuration = 20;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loadingScreen = new LogoLoader({
    background: "#ffffff",
    size: 192,
    planeSize: 1.68,
    fadeDuration: 520,
    dotDuration: 260,
    holdAfterDot: 260,
    autoStart: true,
  });
  loadingScreen.overlay.classList.add("hero-loading-screen");

  const renderer = new THREE.WebGLRenderer({
    canvas: heroCanvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;

  const uniforms = {
    uTextureA: { value: null },
    uTextureB: { value: null },
    uImageSizeA: { value: new THREE.Vector2(1, 1) },
    uImageSizeB: { value: new THREE.Vector2(1, 1) },
    uViewport: { value: new THREE.Vector2(1, 1) },
    uOffsetA: { value: new THREE.Vector2() },
    uOffsetB: { value: new THREE.Vector2() },
    uZoomA: { value: 1 },
    uZoomB: { value: 1 },
    uPointerA: { value: new THREE.Vector2() },
    uPointerB: { value: new THREE.Vector2() },
    uTransition: { value: 0 },
    uDirection: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    depthWrite: false,
    depthTest: false,
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform sampler2D uTextureA;
      uniform sampler2D uTextureB;
      uniform vec2 uImageSizeA;
      uniform vec2 uImageSizeB;
      uniform vec2 uViewport;
      uniform vec2 uOffsetA;
      uniform vec2 uOffsetB;
      uniform vec2 uPointerA;
      uniform vec2 uPointerB;
      uniform float uZoomA;
      uniform float uZoomB;
      uniform float uTransition;
      uniform float uDirection;

      varying vec2 vUv;

      float easeInOut(float value) {
        return value * value * (3.0 - 2.0 * value);
      }

      float hash(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      vec2 coverUv(vec2 uv, vec2 viewport, vec2 imageSize, float zoom, vec2 offset, vec2 pointer) {
        float viewportAspect = viewport.x / viewport.y;
        float imageAspect = imageSize.x / imageSize.y;
        vec2 sampleScale = vec2(1.0);

        if (viewportAspect > imageAspect) {
          sampleScale.y = imageAspect / viewportAspect;
        } else {
          sampleScale.x = viewportAspect / imageAspect;
        }

        return clamp((uv - 0.5) * sampleScale / zoom + 0.5 + offset + pointer, vec2(0.001), vec2(0.999));
      }

      void main() {
        float transition = easeInOut(clamp(uTransition, 0.0, 1.0));
        vec2 transitionDrift = vec2(0.0, (transition - 0.5) * 0.018 * uDirection);

        vec2 uvA = coverUv(vUv, uViewport, uImageSizeA, uZoomA * (1.0 + transition * 0.018), uOffsetA + transitionDrift, uPointerA);
        vec2 uvB = coverUv(vUv, uViewport, uImageSizeB, uZoomB * (1.018 - transition * 0.018), uOffsetB - transitionDrift, uPointerB);

        float blur = sin(transition * 3.14159265) * 10.0;
        vec2 pixel = 1.0 / max(uViewport, vec2(1.0));
        vec2 blurDirectionA = vec2(1.0, 0.45) * pixel * uDirection;
        vec2 blurDirectionB = vec2(-0.35, 1.0) * pixel;

        vec4 colorA = texture2D(uTextureA, uvA) * 0.34
          + texture2D(uTextureA, uvA + blurDirectionA * blur) * 0.18
          + texture2D(uTextureA, uvA - blurDirectionA * blur) * 0.18
          + texture2D(uTextureA, uvA + blurDirectionB * blur) * 0.15
          + texture2D(uTextureA, uvA - blurDirectionB * blur) * 0.15;
        vec4 colorB = texture2D(uTextureB, uvB) * 0.34
          + texture2D(uTextureB, uvB + blurDirectionA * blur) * 0.18
          + texture2D(uTextureB, uvB - blurDirectionA * blur) * 0.18
          + texture2D(uTextureB, uvB + blurDirectionB * blur) * 0.15
          + texture2D(uTextureB, uvB - blurDirectionB * blur) * 0.15;

        float noise = (hash(floor(vUv * vec2(92.0, 54.0))) - 0.5) * 0.035 * sin(transition * 3.14159265);
        vec4 finalColor = mix(colorA, colorB, clamp(transition + noise, 0.0, 1.0));
        finalColor.rgb = clamp(finalColor.rgb * 1.24, 0.0, 1.0);
        gl_FragColor = finalColor;
        #include <colorspace_fragment>
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const manager = new THREE.LoadingManager();
  loadingScreen.connect(manager);
  const textureLoader = new THREE.TextureLoader(manager);
  const textures = new Array(slides.length);
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();

  let currentIndex = 0;
  let nextIndex = 1;
  let isTransitioning = false;
  let transitionStartedAt = 0;
  let activeSceneStartedAt = performance.now();
  let lastFrameTime = performance.now();
  let wheelAccumulator = 0;
  let wheelResetTimer = 0;
  let touchStartY = null;
  let autoAdvanceTimer = 0;

  const loadTexture = (url) =>
    new Promise((resolve, reject) => {
      textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          resolve(texture);
        },
        undefined,
        reject
      );
    });

  const setTextureUniforms = (prefix, texture) => {
    uniforms[`uTexture${prefix}`].value = texture;
    uniforms[`uImageSize${prefix}`].value.set(
      texture.image.naturalWidth || texture.image.width,
      texture.image.naturalHeight || texture.image.height
    );
  };

  const updateCounter = (index) => {
    heroCurrent.textContent = String(index + 1);
    heroCounter.classList.toggle("hero-counter--light", slides[index].tone === "light");
    heroCounter.classList.toggle("hero-counter--dark", slides[index].tone !== "light");
  };

  const interpolateMotion = (index, progress) => {
    const slide = slides[index];
    const t = reducedMotion ? 0.5 : progress * progress * (3 - 2 * progress);

    return {
      zoom: THREE.MathUtils.lerp(slide.zoom[0], slide.zoom[1], t),
      x: THREE.MathUtils.lerp(slide.offset[0][0], slide.offset[1][0], t),
      y: THREE.MathUtils.lerp(slide.offset[0][1], slide.offset[1][1], t),
    };
  };

  const setMotion = (prefix, index, progress) => {
    const motion = interpolateMotion(index, progress);
    const parallax = reducedMotion ? 0 : slides[index].parallax;

    uniforms[`uZoom${prefix}`].value = motion.zoom;
    uniforms[`uOffset${prefix}`].value.set(motion.x, motion.y);
    uniforms[`uPointer${prefix}`].value.set(pointerCurrent.x * parallax, pointerCurrent.y * parallax);
  };

  const scheduleAutoAdvance = () => {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = window.setTimeout(() => {
      if (getActiveTab() === "news" && !isTransitioning) navigate(1);
    }, 9000);
  };

  const startTransition = (direction) => {
    if (isTransitioning) return;
    window.clearTimeout(autoAdvanceTimer);

    const candidateIndex = (currentIndex + direction + slides.length) % slides.length;
    if (!textures[candidateIndex]) {
      loadTexture(slides[candidateIndex].url).then((texture) => {
        textures[candidateIndex] = texture;
        if (getActiveTab() === "news" && !isTransitioning) {
          startTransition(direction);
        } else {
          scheduleAutoAdvance();
        }
      });
      return;
    }

    isTransitioning = true;
    transitionStartedAt = performance.now();
    nextIndex = candidateIndex;
    uniforms.uDirection.value = direction;
    uniforms.uTransition.value = 0;
    setTextureUniforms("B", textures[nextIndex]);
    setMotion("B", nextIndex, 0);
    window.setTimeout(() => updateCounter(nextIndex), transitionDuration * 500);
  };

  const finishTransition = (now) => {
    const carriedProgress = 0.18;

    currentIndex = nextIndex;
    isTransitioning = false;
    activeSceneStartedAt = now - sceneMotionDuration * carriedProgress * 1000;
    uniforms.uTransition.value = 0;
    setTextureUniforms("A", textures[currentIndex]);
    const upcomingIndex = (currentIndex + 1) % slides.length;
    if (textures[upcomingIndex]) setTextureUniforms("B", textures[upcomingIndex]);
    setMotion("A", currentIndex, carriedProgress);
    if (textures[upcomingIndex]) setMotion("B", upcomingIndex, 0);
  };

  const navigate = (direction) => startTransition(direction >= 0 ? 1 : -1);

  resizeHero = () => {
    const rect = heroSection.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    uniforms.uViewport.value.set(width, height);
  };

  const animate = (now) => {
    const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    pointerCurrent.lerp(pointerTarget, 1 - Math.exp(-4.5 * deltaTime));

    const activeElapsed = (now - activeSceneStartedAt) / 1000;
    const activeProgress = Math.min(activeElapsed / sceneMotionDuration, 1);
    setMotion("A", currentIndex, activeProgress);

    if (isTransitioning) {
      const transitionElapsed = (now - transitionStartedAt) / 1000;
      const transitionProgress = Math.min(transitionElapsed / transitionDuration, 1);
      uniforms.uTransition.value = transitionProgress;
      setMotion("B", nextIndex, transitionProgress * 0.18);

      if (transitionProgress >= 1) {
        finishTransition(now);
        scheduleAutoAdvance();
      }
    }

    renderer.render(scene, camera);
  };

  heroSection.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (isTransitioning) return;

      wheelAccumulator += event.deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAccumulator = 0;
      }, 180);

      if (Math.abs(wheelAccumulator) >= 42) {
        navigate(Math.sign(wheelAccumulator));
        wheelAccumulator = 0;
      }
    },
    { passive: false }
  );

  heroSection.addEventListener("touchstart", (event) => {
    touchStartY = event.changedTouches[0]?.clientY ?? null;
  }, { passive: true });

  heroSection.addEventListener("touchend", (event) => {
    if (touchStartY === null || isTransitioning) return;
    const endY = event.changedTouches[0]?.clientY ?? touchStartY;
    const delta = touchStartY - endY;
    touchStartY = null;
    if (Math.abs(delta) > 38) navigate(Math.sign(delta));
  }, { passive: true });

  heroSection.addEventListener("pointermove", (event) => {
    const rect = heroSection.getBoundingClientRect();
    pointerTarget.set(
      ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2,
      (0.5 - (event.clientY - rect.top) / Math.max(rect.height, 1)) * 2
    );
  }, { passive: true });

  heroCounter.addEventListener("click", () => navigate(1));
  window.addEventListener("resize", resizeHero);
  window.addEventListener("keydown", (event) => {
    if (getActiveTab() !== "news") return;
    const nextKeys = ["ArrowDown", "ArrowRight", "PageDown", " ", "Enter"];
    const previousKeys = ["ArrowUp", "ArrowLeft", "PageUp"];
    if (nextKeys.includes(event.key)) {
      event.preventDefault();
      navigate(1);
    }
    if (previousKeys.includes(event.key)) {
      event.preventDefault();
      navigate(-1);
    }
  });

  try {
    await loadingScreen.ready;
    [textures[0], textures[1]] = await Promise.all([loadTexture(slides[0].url), loadTexture(slides[1].url)]);
    slides.slice(2).forEach((slide, index) => {
      const textureIndex = index + 2;
      loadTexture(slide.url).then((texture) => {
        textures[textureIndex] = texture;
      });
    });
    setTextureUniforms("A", textures[0]);
    setTextureUniforms("B", textures[1]);
    setMotion("A", 0, 0);
    setMotion("B", 1, 0);
    updateCounter(0);
    resizeHero();
    renderer.setAnimationLoop(animate);
    scheduleAutoAdvance();
  } catch (error) {
    console.error("Неуспешно зареждане на hero секцията:", error);
    loadingScreen.hide();
  }
};

const ensureHeroInitialised = () => {
  if (!heroInitPromise && getActiveTab() === "news") {
    heroInitPromise = initialiseHero();
  }
  return heroInitPromise;
};

closeDialog.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  viewerRequestId += 1;
  destroyViewer();
  activeProject = null;
});
window.addEventListener("hashchange", scheduleTabUpdate);
window.addEventListener("load", scheduleTabUpdate);
navLinks.forEach((link) => link.addEventListener("click", scheduleTabUpdate));
languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextLanguage = button.dataset.lang;
    if (!I18N[nextLanguage] || nextLanguage === currentLanguage) return;
    currentLanguage = nextLanguage;
    localStorage.setItem("kapkov-language", currentLanguage);
    applyLanguage();
  });
});

applyLanguage();
renderGallery().then(setActiveTab);
