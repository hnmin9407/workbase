/* =================================
   헤더 - 사이드바 접기/펼치기 (수정됨)
   ================================= */

const MOBILE_BREAKPOINT = 768;

function initSidebarFold() {
    const foldButton = document.getElementById('sidebar-fold-button');
    const overlay = document.getElementById('sidebar-overlay'); // CSS와 ID 일치
    const sidebar = document.getElementById('sidebar');

    if (!foldButton || !overlay || !sidebar) {
        console.warn('필수 요소(버튼, 오버레이, 사이드바)를 찾을 수 없습니다.');
        return;
    }

    // --- (A) 클릭 이벤트 핸들러 ---
    const toggleSidebar = () => {
        // 클릭 시에는 항상 애니메이션 활성화
        sidebar.classList.remove('no-transition'); 
        
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            // 모바일 토글
            document.body.classList.remove('sidebar-collapsed');
            document.body.classList.toggle('mobile-sidebar-open');
        } else {
            // PC 토글
            document.body.classList.remove('mobile-sidebar-open');
            document.body.classList.toggle('sidebar-collapsed');
        }
    };
    foldButton.addEventListener('click', toggleSidebar);

    overlay.addEventListener('click', () => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            document.body.classList.remove('mobile-sidebar-open');
        }
    });

    // --- (B) 💡 [핵심] 리사이즈 이벤트 핸들러 (간소화) ---
    // CSS가 transform을 통일했기 때문에,
    // 리사이즈 시에는 다른 모드의 클래스만 정리해주면 됩니다.
    
    let resizeTimer;
    window.addEventListener('resize', () => {
        // 리사이즈 중에는 애니메이션을 꺼서 성능 확보 및 버그 방지
        sidebar.classList.add('no-transition');
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            const isNowMobile = window.innerWidth <= MOBILE_BREAKPOINT;

            if (isNowMobile) {
                // 모바일로 전환 시: PC 상태(collapsed)를 제거
                document.body.classList.remove('sidebar-collapsed');
            } else {
                // PC로 전환 시: 모바일 상태(open)를 제거
                document.body.classList.remove('mobile-sidebar-open');
            }

            // 리사이즈가 끝나면 다시 애니메이션 활성화
            // (requestAnimationFrame으로 한 프레임 뒤에 실행 보장)
            requestAnimationFrame(() => {
                sidebar.classList.remove('no-transition');
            });
            
        }, 100); // 100ms 디바운스
    });
}

/* =================================
   프로젝트 메뉴 접기/펼치기 (수정됨)
   ================================= */
function initProjectMenus() {

    // --- 1. 클릭 이벤트 핸들러 설정 (먼저 수행) ---
    const foldButtons = document.querySelectorAll('.menu-fold-button');

    foldButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            const parentWrap = button.closest('.project-menu-wrap, .fixed-project-menu-wrap');
            const menuWrap = parentWrap.querySelector('.menu-wrap');

            if (!parentWrap || !menuWrap) return;

            parentWrap.classList.toggle('is-folded');

            if (menuWrap.classList.toggle('is-open')) {
                menuWrap.style.maxHeight = menuWrap.scrollHeight + 'px';
                menuWrap.style.opacity = '1';
            } else {
                menuWrap.style.maxHeight = '0px';
                menuWrap.style.opacity = '0';
            }
        });
    });

    // --- 2. 💡 초기 상태 설정 (requestAnimationFrame 사용) ---
    // 브라우저가 DOM 삽입 후 레이아웃 계산을 "완료한" 직후에 실행합니다.
    requestAnimationFrame(() => {
        const allMenuWraps = document.querySelectorAll('.menu-wrap');
        
        allMenuWraps.forEach(menuWrap => {
            // .is-open 클래스를 가진 모든 메뉴를 찾습니다.
            if (menuWrap.classList.contains('is-open')) {
                
                // 1. 초기 높이를 설정 (애니메이션 없음)
                // (이제 "고정됨"과 "프로젝트"의 scrollHeight가 모두 정확히 계산된 상태)
                menuWrap.style.maxHeight = menuWrap.scrollHeight + 'px';
                menuWrap.style.opacity = '1';

                // 2. 아이콘 상태 설정
                const parentWrap = menuWrap.closest('.project-menu-wrap, .fixed-project-menu-wrap');
                if (parentWrap) {
                    parentWrap.classList.remove('is-folded');
                }
            }
        });

        // --- 3. 💡 애니메이션 활성화 (다음 프레임) ---
        // 초기 높이 설정이 "적용된" 후, 다음 프레임에서 애니메이션 클래스를 추가합니다.
        // 이렇게 하면 초기 렌더링(즉시 펼침)과 클릭(애니메이션)이 완벽히 분리됩니다.
        requestAnimationFrame(() => {
            allMenuWraps.forEach(menuWrap => {
                menuWrap.classList.add('transitions-enabled');
            });
        });
    });
}
/* =================================
   메뉴 선택 효과
   ================================= */

function initSidebarMenu() {
  const menuButtons = document.querySelectorAll(".menu-button");

  if (menuButtons.length === 0) {
    console.warn("initSidebarMenu: .menu-button 요소를 찾지 못했습니다.");
    return;
  }

  menuButtons.forEach((item) => {
    item.addEventListener("click", () => {
      // 1. 모든 메뉴에서 .selected 클래스 제거
      menuButtons.forEach((i) => {
        i.classList.remove("selected");
      });

      // 2. 클릭된 메뉴에 .selected 클래스 추가
      item.classList.add("selected");
    });
  });
}

/* =================================
   메인 초기화
   ================================= */

/**
 * DOM 콘텐츠가 로드된 후 모든 사이드바 기능을 초기화합니다.
 */
function initializeSidebarApp() {
    initSidebarFold();     // 1. 사이드바 접기/펼치기 (PC/모바일)
    initProjectMenus();    // 2. 프로젝트 메뉴 아코디언
    initSidebarMenu();     // 3. 메뉴 아이템 선택 효과
}