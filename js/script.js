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
});
