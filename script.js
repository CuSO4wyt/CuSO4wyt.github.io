// Content and native disclosure controls work without JavaScript.
const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const sections = [...document.querySelectorAll('main > section[id]')];
const siteHeader = document.querySelector('.site-header');
let updateScheduled = false;
const updateActiveSection = () => {
  const marker = (siteHeader?.getBoundingClientRect().height || 0) + 32;
  let activeId = sections[0]?.id;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= marker) activeId = section.id;
  }
  for (const link of sectionLinks) {
    if (link.hash === `#${activeId}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  updateScheduled = false;
};
const scheduleUpdate = () => {
  if (updateScheduled) return;
  updateScheduled = true;
  requestAnimationFrame(updateActiveSection);
};
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
updateActiveSection();

// The original image links remain usable when dialog support is unavailable.
const viewer = document.querySelector('#image-viewer');
if (viewer && typeof viewer.showModal === 'function') {
  const image = document.querySelector('#viewer-image');
  const stage = document.querySelector('#viewer-stage');
  const title = document.querySelector('#viewer-title');
  const caption = document.querySelector('#viewer-caption');
  const count = document.querySelector('#viewer-count');
  const zoom = document.querySelector('#viewer-zoom');
  const paperLinks = document.querySelector('#viewer-paper-links');
  const readPaper = document.querySelector('#viewer-paper');
  const downloadPaper = document.querySelector('#viewer-download');
  const projectNames = { flowguard: 'FlowGuard', tracelens: 'TraceLens', proactiveflow: 'ProactiveFlow' };
  const researchGallery = [...document.querySelectorAll('.project-teaser')].map(link => {
    const project = link.closest('.project');
    const paper = project.querySelector('.paper-download');
    return { link, src: link.href, alt: link.querySelector('img').alt,
      title: projectNames[project.id], caption: project.querySelector('h3').textContent,
      paper: paper.href, download: paper.download };
  });
  const projectGallery = [...document.querySelectorAll('[data-gallery="projects"]')].map(link => ({
    link, src: link.href, alt: link.querySelector('img').alt,
    title: link.dataset.title, caption: link.querySelector('img').alt, lang: 'en'
  }));
  let gallery = [];
  let index = 0;
  let returnFocus;
  let previousOverflow = '';
  let swiped = false;
  const setZoom = enabled => {
    stage.classList.toggle('is-zoomed', enabled);
    zoom.setAttribute('aria-pressed', String(enabled));
    zoom.textContent = enabled ? 'Fit to screen' : 'Zoom in';
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  };
  const showImage = () => {
    const item = gallery[index];
    setZoom(false);
    image.src = item.src;
    image.alt = item.alt;
    title.textContent = item.title;
    caption.textContent = item.caption;
    caption.lang = item.lang || 'en';
    count.textContent = `${index + 1} / ${gallery.length}`;
    document.querySelector('.viewer-paging').hidden = gallery.length < 2;
    paperLinks.hidden = !item.paper;
    if (item.paper) {
      readPaper.href = item.paper;
      downloadPaper.href = item.paper;
      downloadPaper.download = item.download;
    }
  };
  const advance = step => {
    index = (index + step + gallery.length) % gallery.length;
    showImage();
  };
  for (const group of [researchGallery, projectGallery]) {
    group.forEach((item, itemIndex) => item.link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      gallery = group;
      index = itemIndex;
      returnFocus = item.link;
      showImage();
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      viewer.showModal();
      document.querySelector('#viewer-close').focus();
    }));
  }
  document.querySelector('#viewer-close').addEventListener('click', () => viewer.close());
  document.querySelector('#viewer-prev').addEventListener('click', () => advance(-1));
  document.querySelector('#viewer-next').addEventListener('click', () => advance(1));
  zoom.addEventListener('click', () => setZoom(zoom.getAttribute('aria-pressed') !== 'true'));
  image.addEventListener('click', () => {
    if (swiped) { swiped = false; return; }
    setZoom(zoom.getAttribute('aria-pressed') !== 'true');
  });
  viewer.addEventListener('keydown', event => {
    if (zoom.getAttribute('aria-pressed') === 'true') return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      advance(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    returnFocus?.focus({ preventScroll: true });
  });
  let touchStart = null;
  stage.addEventListener('pointerdown', event => {
    swiped = false;
    if (event.pointerType === 'touch' && zoom.getAttribute('aria-pressed') !== 'true') {
      touchStart = { x: event.clientX, y: event.clientY };
    }
  });
  stage.addEventListener('pointerup', event => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swiped = true;
      advance(dx < 0 ? 1 : -1);
    }
  });
  stage.addEventListener('pointercancel', () => { touchStart = null; });
}
