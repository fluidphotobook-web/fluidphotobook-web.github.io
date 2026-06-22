document.addEventListener('DOMContentLoaded', () => {
  const isTouchDevice = () => window.innerWidth <= 600;

  /* ── PC 전용: 수직 스크롤 → 수평 스크롤 변환 ── */
  const strips = document.querySelectorAll('.strip, .strip-about');
  strips.forEach(strip => {
    strip.addEventListener('wheel', (e) => {
      if (window.innerWidth > 1024) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          strip.scrollLeft += e.deltaY;
        }
      }
    }, { passive: false });
  });

  /* ── 모바일: 랜딩 페이지 → 작품 목록 전환 ── */
  const fluidpaperLink = document.getElementById('fluidpaper-link');
  if (fluidpaperLink && isTouchDevice()) {
    fluidpaperLink.addEventListener('click', (e) => {
      if (!document.body.classList.contains('is-works')) {
        e.preventDefault();
        document.body.classList.add('is-works');
        window.scrollTo(0, 0);
      }
    });
  }

  /* ── 모바일: 이미지 클릭 시 상세페이지 이동 허용 (플립 모션 제거) ── */
  // 사용자의 요청으로 모바일에서 이미지 클릭 시 뒷커버 전환 모션을 제거했습니다.
  // 이제 목록의 이미지를 클릭하면 바로 상세페이지로 이동합니다.

  /* ── 로고 클릭 ── */
  const logo = document.getElementById('logo');
  if (logo && isTouchDevice()) {
    logo.addEventListener('click', (e) => {
      if (document.body.id === 'index-body' && document.body.classList.contains('is-works')) {
        e.preventDefault();
        document.body.classList.remove('is-works');
        window.scrollTo(0, 0);
      }
    });
  }

  /* ── Detail pages: cover reveal + interior slideshow ── */
  const volumeImages = {
    1: [1, 2, 18, 19, 20, 22, 23, 27, 28, 29, 31, 32, 35, 36, 37, 41, 42, 43, 44, 45, 46, 47, 48],
    2: [1, 2, 5, 8, 10, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 30, 31, 32, 36, 40, 42, 43, 45, 49, 55, 56, 60, 63, 64]
  };

  document.querySelectorAll('.book-viewer').forEach(viewer => {
    const volume = viewer.dataset.volume;
    const pages = volumeImages[volume] || [];
    const slideshow = viewer.querySelector('.interior-slideshow');
    const count = viewer.querySelector('.slide-count');
    const previous = viewer.querySelector('.slide-arrow-prev');
    const next = viewer.querySelector('.slide-arrow-next');
    let activeIndex = 0;
    let requestedIndex = 0;

    pages.forEach((page, index) => {
      const image = document.createElement('img');
      image.src = `srcs/img-web/vol${volume}/fluidvol${volume}_${String(page).padStart(2, '0')}.webp`;
      image.alt = `fluid N°${volume}, page ${index + 1}`;
      image.decoding = 'async';
      image.loading = index < 2 ? 'eager' : 'lazy';
      if (index < 2) image.fetchPriority = 'high';
      if (index === 0) image.classList.add('is-active');
      slideshow.appendChild(image);
    });

    const images = Array.from(slideshow.querySelectorAll('img'));
    const renderControls = () => {
      count.textContent = `${requestedIndex + 1} / ${images.length}`;
      previous.disabled = requestedIndex === 0;
      next.disabled = requestedIndex === images.length - 1;
    };
    const setCoverPosition = isRevealed => {
      viewer.style.setProperty('--cover-offset', isRevealed ? `${viewer.clientHeight * 1.08}px` : '0px');
      viewer.classList.toggle('is-revealed', isRevealed);
    };
    const reveal = () => setCoverPosition(true);
    const showRequestedSlide = async () => {
      const targetIndex = requestedIndex;
      const nextImage = images[targetIndex];

      // Keep the visible page in place until the next file is decoded. This
      // prevents a white frame when arrows are pressed in quick succession.
      try {
        if (nextImage.decode) await nextImage.decode();
        else if (!nextImage.complete) {
          await new Promise(resolve => nextImage.addEventListener('load', resolve, { once: true }));
        }
      } catch (_) {
        // A completed image can reject decode() in some browsers; it is still
        // safe to display when the browser has loaded pixel data.
      }

      if (targetIndex !== requestedIndex || !nextImage.complete || !nextImage.naturalWidth) return;
      images.forEach((image, index) => image.classList.toggle('is-active', index === targetIndex));
      activeIndex = targetIndex;
      images[targetIndex + 1]?.decode?.().catch(() => {});
    };
    const changeSlide = direction => {
      reveal();
      requestedIndex = Math.max(0, Math.min(images.length - 1, requestedIndex + direction));
      renderControls();
      showRequestedSlide();
    };

    renderControls();
    previous.addEventListener('click', () => changeSlide(-1));
    next.addEventListener('click', () => changeSlide(1));

    viewer.addEventListener('wheel', event => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      setCoverPosition(event.deltaY > 0);
    }, { passive: false });

    viewer.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); changeSlide(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); changeSlide(1); }
    });
  });
});
