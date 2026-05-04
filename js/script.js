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

  /* ── 모바일/태블릿: 탭으로 앞뒤 표지 전환 ── */
  document.querySelectorAll('.img').forEach(imgEl => {
    imgEl.addEventListener('click', (e) => {
      if (isTouchDevice()) {
        // 이미지 영역 클릭 시 상세페이지 이동 방지하고 표지만 전환
        if (imgEl.tagName === 'A' || e.target.closest('a') === imgEl) {
          e.preventDefault();
          imgEl.classList.toggle('tapped');
        } else {
          imgEl.classList.toggle('tapped');
        }
      }
    });
  });

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
});
