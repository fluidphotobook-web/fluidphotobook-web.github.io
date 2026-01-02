// DOM 요소 가져오기
const strip = document.getElementById('issues');
const dividerEl = document.querySelector('.divider');
const meta = document.getElementById('meta');

// 1. 페이지 로드 시 가장 최신 이슈(가장 오른쪽)로 스크롤
function snapToLatest() {
  strip.scrollLeft = strip.scrollWidth;
  window.scrollTo(0, 0); 
}

document.addEventListener('DOMContentLoaded', snapToLatest);
window.addEventListener('load', snapToLatest);


// 2. 오른쪽 하단 메타 정보 업데이트 로직
function updateMeta() {
  // 메타 정보 업데이트는 가장 가까운 카드를 기준으로 합니다.
  const cards = Array.from(strip.querySelectorAll('.card'));
  
  // 메타 자체가 strip 안에 있으므로, 카드가 2개일 때 meta가 3번째 요소임.
  // 따라서 closestElement는 카드 또는 메타가 될 수 있습니다.
  const allScrollableItems = Array.from(strip.children); 
  
  let closest = allScrollableItems[0];
  let min = Infinity;
  const limitX = strip.getBoundingClientRect().left; 

  for (const item of allScrollableItems) {
    const r = item.getBoundingClientRect();
    const dx = Math.abs(r.left - limitX); 
    if (dx < min) { min = dx; closest = item; }
  }
  
  // 가장 가까운 요소가 카드인지 확인하고 데이터를 가져옵니다.
  if (closest.classList.contains('card')) {
      const issue = closest.getAttribute('data-issue');
      const year = closest.getAttribute('data-year');
      const stock = closest.getAttribute('data-stock');

      meta.querySelector('.no').textContent = issue;
      meta.querySelector('.year').textContent = year;
      meta.querySelector('.stock').textContent = stock;
  }
  
  // (참고: 가장 가까운 요소가 .meta 자신일 경우, 메타 정보는 변경되지 않습니다.)
}

updateMeta();
strip.addEventListener('scroll', () => {
  if (strip._ticking) return;
  strip._ticking = true;
  requestAnimationFrame(() => { updateMeta(); strip._ticking = false; });
});


// 3. 휠 이벤트 변환 로직 (세로 휠 -> 가로 스크롤)
function handleGlobalWheel(e) {
  if (window.innerWidth <= 768) return; 

  const rect = dividerEl.getBoundingClientRect();
  const rect = dividerEl.getBoundingClientRect();
  const isRightSide = e.clientX >= rect.left; 
  const verticalDominant = Math.abs(e.deltaY) > Math.abs(e.deltaX);
  
  if (isRightSide && verticalDominant) {
    e.preventDefault();
    const factor = 1.5; 
    strip.scrollLeft += e.deltaY * factor;
    window.scrollTo(0, 0); 
  }
}
window.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });


// 4. 키보드 편의 기능 (← / → 키)
window.addEventListener('keydown', (e) => {
  const step = strip.clientWidth * 0.85; 
  if (e.key === 'ArrowRight') { strip.scrollBy({ left: step, behavior: 'smooth' }); }
  if (e.key === 'ArrowLeft')  { strip.scrollBy({ left: -step, behavior: 'smooth' }); }
});


// 5. 터치 스와이프 지원 
let _tStart = null;
window.addEventListener('touchstart', (e) => {
  if (!e.touches || e.touches.length === 0) return;
  const t = e.touches[0];
  _tStart = { x: t.clientX, y: t.clientY };
}, { passive: true, capture: true });

window.addEventListener('touchmove', (e) => {
  if (!_tStart || !e.touches || e.touches.length === 0) return;
  const t = e.touches[0];
  const rect = dividerEl.getBoundingClientRect();
  const isRightSide = t.clientX >= rect.left;
  if (!isRightSide) return;
  
  const dy = t.clientY - _tStart.y;
  const dx = t.clientX - _tStart.x;
  
  if (Math.abs(dy) > Math.abs(dx)) {
    strip.scrollLeft += dy * 1.5; 
    _tStart = { x: t.clientX, y: t.clientY };
    e.preventDefault();
  }
}, { passive: false, capture: true });