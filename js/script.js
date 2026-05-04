document.addEventListener('DOMContentLoaded', () => {
  const isMobile = () => window.innerWidth <= 1024;

  /* ── PC 전용: 수직 스크롤 → 수평 스크롤 변환 ── */
  const strips = document.querySelectorAll('.strip, .strip-about');
  strips.forEach(strip => {
    strip.addEventListener('wheel', (e) => {
      if (isMobile()) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        strip.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  });

  /* ── 모바일/태블릿 전용: 탭으로 앞뒤 표지 전환 ── */
  if (isMobile()) {
    document.querySelectorAll('.img').forEach(imgEl => {
      imgEl.addEventListener('click', (e) => {
        // 링크 클릭이 아닌 이미지 영역 직접 탭인 경우만 처리
        if (e.target.tagName === 'A' || e.target.closest('a')) return;
        imgEl.classList.toggle('tapped');
      });
    });
  }

  /* ── 로고 클릭: 모바일에서 index로 이동 ── */
  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      // 모바일/태블릿에서는 바로 index로 이동 (기존 메뉴 토글 제거)
      if (isMobile()) {
        // 기본 href 동작 허용 (index.html)
        return;
      }
    });
  }
});
