document.addEventListener('DOMContentLoaded', () => {
  const isTouchDevice = () => window.innerWidth <= 600;

  /* ── PC 전용: 수직 스크롤 → 수평 스크롤 변환 ── */
  const strips = document.querySelectorAll('.strip, .strip-about');
  strips.forEach(strip => {
    strip.addEventListener('wheel', (e) => {
      if (document.body.classList.contains('show-monographs')) return;
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

  /* ── monographs 뷰 토글 로직 ── */
  const updateViewFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'monographs') {
      document.body.classList.add('show-monographs');
    } else {
      document.body.classList.remove('show-monographs');
    }
  };

  // 초기 로드 시 체크
  updateViewFromURL();

  // monographs 링크 클릭 시 새로고침 없는 전환
  const monographsLinks = document.querySelectorAll('.monographs');
  monographsLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (document.body.id === 'index-body') {
        e.preventDefault();
        document.body.classList.add('show-monographs');
        const url = new URL(window.location);
        url.searchParams.set('view', 'monographs');
        window.history.pushState({}, '', url);
      }
    });
  });

  // fluidpaper 링크 클릭 시 새로고침 없는 전환
  if (fluidpaperLink) {
    fluidpaperLink.addEventListener('click', (e) => {
      if (document.body.id === 'index-body') {
        if (document.body.classList.contains('show-monographs') || (isTouchDevice() && !document.body.classList.contains('is-works'))) {
          e.preventDefault();
          document.body.classList.remove('show-monographs');
          if (isTouchDevice() && !document.body.classList.contains('is-works')) {
            document.body.classList.add('is-works');
          }
          const url = new URL(window.location);
          url.searchParams.delete('view');
          window.history.pushState({}, '', url);
          window.scrollTo(0, 0);
        }
      }
    });
  }

  // 브라우저 뒤로가기/앞으로가기 시 뷰 동기화
  window.addEventListener('popstate', updateViewFromURL);

  /* ── Detail pages: cover reveal + interior slideshow ── */
  const volumeConfig = {
    1: {
      pages: [2, 18, 19, 20, 22, 23, 27, 28, 29, 31, 32, 35, 36, 37, 41, 42, 43, 44, 45, 46, 47],
      srcFor: page => `srcs/img-web/vol1/fluidvol1_${String(page).padStart(2, '0')}.webp`
    },
    2: {
      pages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      srcFor: page => `srcs/img-web/vol2/fluidno2_${String(page).padStart(2, '0')}.avif`
    },
    haircuts: {
      pages: [1, 2, 3, 4, 5, 6, 7, 8],
      srcFor: page => `srcs/img/others/haircuts_inner_${page}.jpg`
    }
  };

  document.querySelectorAll('.book-viewer').forEach(viewer => {
    const volume = viewer.dataset.volume;
    const config = volumeConfig[volume] || { pages: [], srcFor: () => '' };
    const pages = config.pages;
    const slideshow = viewer.querySelector('.interior-slideshow');
    const count = viewer.querySelector('.slide-count');
    const previous = viewer.querySelector('.slide-arrow-prev');
    const next = viewer.querySelector('.slide-arrow-next');
    let activeIndex = 0;
    let requestedIndex = 0;

    pages.forEach((page, index) => {
      const image = document.createElement('img');
      image.src = config.srcFor(page);
      image.alt = `${volume === 'haircuts' ? 'Haircuts; various forms' : 'fluid N°' + volume}, page ${index + 1}`;
      image.decoding = 'async';
      image.loading = index < 2 ? 'eager' : 'lazy';
      if (index < 2) image.fetchPriority = 'high';
      if (index === 0) image.classList.add('is-active');
      slideshow.appendChild(image);
    });

    const images = Array.from(slideshow.querySelectorAll('img'));
    const renderControls = () => {
      count.textContent = `${requestedIndex + 1} / ${images.length}`;
      previous.disabled = images.length <= 1;
      next.disabled = images.length <= 1;
    };
    const setCoverPosition = isRevealed => {
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
      if (!viewer.classList.contains('is-revealed')) {
        reveal();
        if (direction === 1) {
          requestedIndex = 0;
        } else {
          requestedIndex = images.length - 1;
        }
        renderControls();
        showRequestedSlide();
        return;
      }
      requestedIndex = (requestedIndex + direction + images.length) % images.length;
      renderControls();
      showRequestedSlide();
    };

    renderControls();
    reveal();
    showRequestedSlide();
    previous.addEventListener('click', () => changeSlide(-1));
    next.addEventListener('click', () => changeSlide(1));

    viewer.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); changeSlide(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); changeSlide(1); }
    });
  });

  /* ── Currency toggle (KRW / EUR), bottom right ── */
  const currencyToggle = document.createElement('div');
  currencyToggle.className = 'currency-toggle';
  currencyToggle.setAttribute('aria-label', 'Currency');
  currencyToggle.innerHTML = `
    <button type="button" class="currency-option" data-currency="KRW">KRW</button>
    <span class="currency-sep" aria-hidden="true">/</span>
    <button type="button" class="currency-option" data-currency="EUR">EUR</button>
  `;
  document.body.appendChild(currencyToggle);

  const priceDisplays = document.querySelectorAll('.price-display');
  const currencyOptions = currencyToggle.querySelectorAll('.currency-option');

  const applyCurrency = currency => {
    priceDisplays.forEach(el => {
      const value = currency === 'EUR' ? el.dataset.eur : el.dataset.krw;
      if (value) el.textContent = value;
    });
    currencyOptions.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.currency === currency);
    });
  };

  let currentCurrency = localStorage.getItem('fluid-currency') || 'KRW';
  applyCurrency(currentCurrency);

  currencyOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCurrency = btn.dataset.currency;
      localStorage.setItem('fluid-currency', currentCurrency);
      applyCurrency(currentCurrency);
    });
  });
});
