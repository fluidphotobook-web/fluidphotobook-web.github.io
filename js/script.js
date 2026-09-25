document.addEventListener('DOMContentLoaded', () => {
  const isTouchDevice = () => window.innerWidth <= 600;

  /* ── PC 전용: 수직 스크롤 → 수평 스크롤 변환 ── */
  const strips = document.querySelectorAll('.strip, .strip-about');
  strips.forEach(strip => {
    strip.addEventListener('wheel', (e) => {
      if (document.body.classList.contains('show-monographs')) return;
      if (document.body.id === 'detail-body') return;
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
  const GRID_VIEWS = ['monographs', 'zines'];
  const applyView = view => {
    const isGrid = GRID_VIEWS.includes(view);
    document.body.classList.toggle('show-monographs', isGrid);
    document.body.classList.toggle('show-zines', view === 'zines');
  };
  const updateViewFromURL = () => {
    applyView(new URLSearchParams(window.location.search).get('view'));
  };

  updateViewFromURL();

  GRID_VIEWS.forEach(view => {
    document.querySelectorAll(`.${view}`).forEach(link => {
      link.addEventListener('click', (e) => {
        if (document.body.id !== 'index-body') return;
        e.preventDefault();
        applyView(view);
        const url = new URL(window.location);
        url.searchParams.set('view', view);
        window.history.pushState({}, '', url);
      });
    });
  });

  // fluidpaper 링크 클릭 시 새로고침 없는 전환
  if (fluidpaperLink) {
    fluidpaperLink.addEventListener('click', (e) => {
      if (document.body.id === 'index-body') {
        if (document.body.classList.contains('show-monographs') || (isTouchDevice() && !document.body.classList.contains('is-works'))) {
          e.preventDefault();
          document.body.classList.remove('show-monographs', 'show-zines');
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
      pages: ['cover-front', 1, 2, 3, 4, 'cover-back'],
      srcFor: page => Number.isInteger(page)
        ? `srcs/img/others/haircuts_inner_${page}.jpg`
        : `srcs/img/others/haircuts_${page}.jpg`
    },
    leo: { pages: [], srcFor: () => '' },
    sihun: { pages: [], srcFor: () => '' }
  };

  const videoConfig = {
    haircuts: { src: 'srcs/video/haircuts.mp4', poster: 'srcs/video/haircuts-poster.jpg', aspect: 1734 / 1440 },
    leo: { src: 'srcs/video/leo.mp4', poster: 'srcs/video/leo-poster.jpg', aspect: 2400 / 3200 },
    sihun: { src: 'srcs/video/sihun.mp4', poster: 'srcs/video/sihun-poster.jpg', aspect: 2740 / 2048 }
  };

  document.querySelectorAll('.book-viewer').forEach(viewer => {
    const volume = viewer.dataset.volume;
    const config = volumeConfig[volume] || { pages: [], srcFor: () => '' };
    const pages = config.pages;
    const slideshow = viewer.querySelector('.interior-slideshow');
    const count = viewer.querySelector('.slide-count');
    const previous = viewer.querySelector('.slide-arrow-prev');
    const next = viewer.querySelector('.slide-arrow-next');
    const arrowButtons = [previous, next].filter(Boolean);
    let activeIndex = 0;
    let requestedIndex = 0;

    // Haircuts pages resize the frame per slide (see applyFrameHeight below),
    // so the arrows can't stay centered with top:50% or they'd jump up/down
    // with it. Pin them, once, to the vertical center of the frame's default
    // (pre-resize) height instead.
    const baselineArrowTop = `${viewer.clientHeight / 2}px`;
    if (baselineArrowTop) {
      arrowButtons.forEach(btn => { btn.style.top = baselineArrowTop; });
    }

    pages.forEach((page, index) => {
      const image = document.createElement('img');
      image.src = config.srcFor(page);
      image.alt = `${volume === 'haircuts' ? 'Haircuts; various forms' : 'fluid ' + ({ 1: "'24", 2: "'25" }[volume] || volume)}, page ${index + 1}`;
      image.decoding = 'async';
      image.loading = index < 2 ? 'eager' : 'lazy';
      if (index < 2) image.fetchPriority = 'high';
      if (index === 0) image.classList.add('is-active');
      slideshow.appendChild(image);
    });

    const images = Array.from(slideshow.querySelectorAll('img'));
    const renderControls = () => {
      if (count) count.textContent = `${requestedIndex + 1} / ${images.length}`;
      arrowButtons.forEach(btn => { btn.disabled = images.length <= 1; });
    };
    const setCoverPosition = isRevealed => {
      viewer.classList.toggle('is-revealed', isRevealed);
    };
    const reveal = () => setCoverPosition(true);

    // Haircuts pages mix landscape and portrait scans. Rather than letterboxing
    // everything into one fixed-ratio frame (which shrinks portrait pages down
    // to fit), size the frame to each page's own ratio at a constant width:
    // landscape pages stay wide and short, portrait pages stay full-width and
    // grow taller, and nothing gets cropped.
    const video = videoConfig[volume];
    const fitsToImage = Boolean(video);
    const applyFrameHeight = image => {
      if (!image.naturalWidth) return;
      const width = slideshow.clientWidth;
      viewer.style.height = `${width * (image.naturalHeight / image.naturalWidth)}px`;
    };

    // Haircuts only: past the last page, a fullscreen tiled video loop takes
    // over (leaving the logo/nav/book meta visible on top, in white). Any
    // arrow press exits back to a cover.
    let inVideoMode = false;
    let videoTileEls = [];
    let videoMuted = true;
    const videoTilesEl = viewer.querySelector('.video-tiles');
    const unmuteBtn = viewer.querySelector('.video-unmute-btn');
    // Safari clips a fixed-position descendant to the bounds of any
    // ancestor with overflow:hidden (here: .book-viewer > .img >
    // .cover-container > .card-reduced > .strip > .wrap), leaving a gap
    // down the left edge of the fullscreen video. Chrome ignores that
    // ancestor chain for fixed elements, so it never showed the bug.
    // Re-parenting to <body> removes every clipping ancestor.
    if (videoTilesEl) document.body.appendChild(videoTilesEl);
    if (unmuteBtn) document.body.appendChild(unmuteBtn);
    const VIDEO_SRC = video?.src;
    const VIDEO_POSTER = video?.poster;
    const VIDEO_ASPECT = video?.aspect || 1;

    const buildVideoTiles = () => {
      if (!videoTilesEl) return;
      // Desktop fills the viewport height and tiles sideways to cover the
      // width; on a narrow phone that would crop most of the frame off, so
      // fit the width instead (matching the mobile CSS) and tile downward
      // to cover the height.
      const isNarrow = window.innerWidth <= 600;
      // Tile for the large viewport so the loop also fills the area under
      // mobile browser toolbars.
      const tallest = Math.max(window.innerHeight, window.screen?.height || 0,
        isNarrow ? document.documentElement.scrollHeight + 2 * window.innerHeight : 0);
      const needed = isNarrow
        ? Math.max(1, Math.ceil(tallest / (window.innerWidth / VIDEO_ASPECT)))
        : Math.max(1, Math.ceil(window.innerWidth / (window.innerHeight * VIDEO_ASPECT)));
      while (videoTileEls.length < needed) {
        const el = document.createElement('video');
        // Only the first tile ever carries sound; the rest are visual copies.
        el.muted = videoTileEls.length === 0 ? videoMuted : true;
        el.defaultMuted = true;
        el.loop = true;
        el.autoplay = true;
        el.playsInline = true;
        el.preload = 'auto';
        el.poster = VIDEO_POSTER;
        el.setAttribute('aria-hidden', 'true');
        el.src = VIDEO_SRC;
        // A play() issued before enough data arrives can be dropped; retry once playable.
        el.addEventListener('canplay', () => { if (inVideoMode && el.paused) el.play().catch(() => {}); });
        videoTilesEl.appendChild(el);
        videoTileEls.push(el);
        if (inVideoMode) el.play().catch(() => {});
      }
      while (videoTileEls.length > needed) {
        const el = videoTileEls.pop();
        el.pause();
        el.remove();
      }
    };
    const handleResize = () => { if (inVideoMode) buildVideoTiles(); };
    // Page height settles after fonts/images load; keep the tile column tall enough.
    if (fitsToImage && 'ResizeObserver' in window) {
      new ResizeObserver(handleResize).observe(document.body);
    }

    // iOS Safari fills the status bar with the root background colour while
    // the page sits at scroll 0 (and during overscroll). Keep that colour in
    // step with the footage so the bar reads as part of the video.
    const isIOSWebKit = window.CSS?.supports?.('-webkit-touch-callout', 'none');
    let tintTimer = null;
    const tintCanvas = document.createElement('canvas');
    tintCanvas.width = tintCanvas.height = 1;
    const tintCtx = tintCanvas.getContext('2d', { willReadFrequently: true });
    const sampleTint = () => {
      const el = videoTileEls[0];
      if (!el || el.readyState < 2) return;
      try {
        tintCtx.drawImage(el, 0, 0, el.videoWidth, el.videoHeight * 0.1, 0, 0, 1, 1);
        const [r, g, b] = tintCtx.getImageData(0, 0, 1, 1).data;
        document.documentElement.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      } catch (_) {}
    };
    // Keep the document scrolled inside the bleed so the footage stays drawn
    // under Safari's bars at both ends, and stop scrolling at the logo/footer.
    let bleedOn = false;
    const bleedPx = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bleed')) || 0;
    let settleTimer = null;
    const settleScroll = () => {
      if (!bleedOn) return;
      const b = bleedPx();
      const max = document.documentElement.scrollHeight - window.innerHeight - b;
      const target = window.scrollY < b ? b : window.scrollY > max ? Math.max(b, max) : null;
      if (target !== null) window.scrollTo({ top: target, behavior: 'smooth' });
    };
    // Fallback if snapping didn't pull the page back out of the bleed.
    const onBleedScroll = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settleScroll, 140);
    };
    let anchors = [];
    const startBleed = () => {
      if (!isIOSWebKit || window.innerWidth > 600 || bleedOn) return;
      bleedOn = true;
      document.documentElement.classList.add('ios-bleed');
      anchors = ['top', 'bottom'].map(pos => {
        const el = document.createElement('div');
        el.className = `bleed-anchor bleed-anchor-${pos}`;
        el.setAttribute('aria-hidden', 'true');
        document.body.appendChild(el);
        return el;
      });
      requestAnimationFrame(() => window.scrollTo(0, bleedPx()));
      window.addEventListener('scroll', onBleedScroll, { passive: true });
    };
    const stopBleed = () => {
      if (!bleedOn) return;
      bleedOn = false;
      document.documentElement.classList.remove('ios-bleed');
      anchors.forEach(el => el.remove());
      anchors = [];
      window.removeEventListener('scroll', onBleedScroll);
    };
    const startBarTint = () => {
      if (!isIOSWebKit || tintTimer) return;
      sampleTint();
      tintTimer = setInterval(sampleTint, 250);
    };
    const stopBarTint = () => {
      clearInterval(tintTimer);
      tintTimer = null;
      document.documentElement.style.backgroundColor = '';
    };

    const enterVideoMode = () => {
      inVideoMode = true;
      // Bottom rubber-band shows the root background: tile the poster there.
      startBarTint();
      startBleed();
      document.body.classList.add('video-active');
      // The arrows only render at full opacity once .is-revealed is set (see
      // .book-viewer.is-revealed .slide-arrow); without it they'd stay
      // invisible in video mode since the video tiles sit on top and swallow
      // the hover that would otherwise reveal them.
      viewer.classList.add('is-revealed');
      // The arrows' baseline top is pinned to the small book frame; in video
      // mode they should sit at the vertical center of the full viewport
      // instead (handled by the body.video-active CSS), so clear the inline
      // override.
      arrowButtons.forEach(btn => { btn.style.top = ''; });
      buildVideoTiles();
      videoTileEls.forEach(el => { el.currentTime = 0; el.play().catch(() => {}); });
    };
    const exitVideoMode = () => {
      inVideoMode = false;
      stopBarTint();
      stopBleed();
      document.body.classList.remove('video-active');
      if (baselineArrowTop) {
        arrowButtons.forEach(btn => { btn.style.top = baselineArrowTop; });
      }
      videoTileEls.forEach(el => el.pause());
    };
    if (fitsToImage && unmuteBtn) {
      unmuteBtn.addEventListener('click', () => {
        videoMuted = !videoMuted;
        videoTileEls.forEach((el, i) => { el.muted = i === 0 ? videoMuted : true; });
        unmuteBtn.textContent = videoMuted ? 'Unmute' : 'Mute';
      });
      window.addEventListener('resize', handleResize);
    }

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
      applyFrameHeight(nextImage);
      images[targetIndex + 1]?.decode?.().catch(() => {});
    };
    const changeSlide = direction => {
      if (!images.length) return;
      if (fitsToImage && inVideoMode) {
        exitVideoMode();
        reveal();
        requestedIndex = direction === 1 ? 0 : images.length - 1;
        renderControls();
        showRequestedSlide();
        return;
      }
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
      if (fitsToImage && direction === 1 && requestedIndex === images.length - 1) {
        enterVideoMode();
        return;
      }
      requestedIndex = (requestedIndex + direction + images.length) % images.length;
      renderControls();
      showRequestedSlide();
    };

    renderControls();
    if (fitsToImage) {
      // Haircuts opens straight into the video finale instead of a book
      // photo; arrows step forward into the cover, then pages, then the
      // back cover, then loop back to the video.
      enterVideoMode();
    } else {
      reveal();
      showRequestedSlide();
    }
    previous?.addEventListener('click', () => changeSlide(-1));
    next?.addEventListener('click', () => changeSlide(1));

    viewer.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); changeSlide(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); changeSlide(1); }
    });

    // Swipe (touch devices): a book/slideshow reads as swipeable, and a
    // tap-only viewer on mobile leaves that expectation unmet. Track the
    // touch as it moves so a clearly horizontal drag can preventDefault
    // (stopping the page from scrolling sideways under the swipe), while a
    // vertical one is left alone to scroll the page normally.
    let touchStartX = 0;
    let touchStartY = 0;
    let touchIsHorizontal = null;
    viewer.addEventListener('touchstart', event => {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchIsHorizontal = null;
    }, { passive: true });
    viewer.addEventListener('touchmove', event => {
      const touch = event.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (touchIsHorizontal === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        touchIsHorizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (touchIsHorizontal) event.preventDefault();
    }, { passive: false });
    viewer.addEventListener('touchend', event => {
      if (!touchIsHorizontal) return;
      const dx = event.changedTouches[0].clientX - touchStartX;
      const SWIPE_THRESHOLD = 40;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      changeSlide(dx < 0 ? 1 : -1);
    });
  });

  /* ── prev/next text cursor over the viewer halves ── */
  const arrows = document.querySelectorAll('.slide-arrow');
  if (arrows.length && window.matchMedia('(hover: hover)').matches) {
    const textCursor = document.createElement('div');
    textCursor.className = 'text-cursor';
    textCursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(textCursor);
    arrows.forEach(arrow => {
      const label = arrow.classList.contains('slide-arrow-prev') ? 'prev' : 'next';
      arrow.addEventListener('pointerenter', () => {
        textCursor.textContent = label;
        textCursor.classList.add('is-visible');
      });
      arrow.addEventListener('pointerleave', () => textCursor.classList.remove('is-visible'));
    });
    window.addEventListener('pointermove', e => {
      textCursor.style.left = `${e.clientX}px`;
      textCursor.style.top = `${e.clientY}px`;
    }, { passive: true });
  }

  /* ── Currency toggle (KRW / EUR) ──
     Lives as one more line in the footer nav instead of its own floating
     pill, so it doesn't sit on top of content (or the video finale) as a
     separate white box. */
  const currencyToggle = document.createElement('div');
  currencyToggle.className = 'currency-toggle';
  currencyToggle.setAttribute('aria-label', 'Currency');
  currencyToggle.innerHTML = `
    <button type="button" class="currency-option" data-currency="KRW">KRW</button>
    <span class="currency-sep" aria-hidden="true">/</span>
    <button type="button" class="currency-option" data-currency="EUR">EUR</button>
  `;
  const menuNav = document.querySelector('.menu');
  (menuNav || document.body).appendChild(currencyToggle);

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
