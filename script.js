// ===== 1. Smooth Scroll 앵커 이동 =====
// 동작 원리: 클릭한 링크의 href(#섹션id)로 이동할 위치를 계산하되,
// 고정 header에 콘텐츠가 가려지지 않도록 header 높이만큼 위치를 보정한다.
// [수정] 푸터의 "맨 위로" 버튼(.top-btn)도 동일한 방식으로 동작하도록 셀렉터에 추가
document.querySelectorAll('a.nav-link, a.btn, a.top-btn').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    var href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();

      // [수정] "맨 위로" 버튼 처리: #top은 position: fixed인 header라서
      // 위치 계산이 불가능하므로(getBoundingClientRect().top이 항상 0),
      // 문서 최상단(0)으로 직접 이동시킨다.
      if (href === '#top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      var target = document.querySelector(href);
      if (target) {
        var headerHeight = document.querySelector('header').offsetHeight;
        var targetTop = target.getBoundingClientRect().top
                        + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      }
    }
  });
});

// ===== 2. 폼 유효성 검사 =====
// 동작 원리: 제출 시 기본 전송 동작을 막고(preventDefault),
// 입력값을 순서대로 검사하여 오류가 있으면 alert 출력 + 해당 입력창에
// .error 클래스를 부여해 빨간 테두리로 시각적으로도 강조한다.

// [추가] 오류 표시 공통 함수: alert + 빨간 테두리 + 포커스 이동
function showError(field, msg) {
  alert(msg);
  field.classList.add('error');
  field.focus();
}

// [추가] 사용자가 다시 입력을 시작하면 빨간 테두리 제거
document.querySelectorAll('#contactForm input, #contactForm textarea')
  .forEach(function(field) {
    field.addEventListener('input', function() {
      this.classList.remove('error');
    });
  });

document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();

  var nameField = document.getElementById('name');
  var emailField = document.getElementById('email');
  var messageField = document.getElementById('message');

  var name = nameField.value.trim();
  var email = emailField.value.trim();
  var message = messageField.value.trim();

  // 필수 항목 체크
  if (name === '') {
    showError(nameField, '이름을 입력해주세요.');
    return;
  }

  if (email === '') {
    showError(emailField, '이메일을 입력해주세요.');
    return;
  }

  // 이메일 형식 체크 (정규표현식: 공백/@ 제외 문자 + @ + 도메인 + . + 최상위 도메인)
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showError(emailField, '올바른 이메일 형식을 입력해주세요.\n예: example@email.com');
    return;
  }

  if (message === '') {
    showError(messageField, '메시지를 입력해주세요.');
    return;
  }

  // 모두 통과
  alert('메시지가 전송되었습니다!\n빠른 시일 내에 연락드리겠습니다 😊');
  this.reset();
});

// ===== 3. 네비게이션 활성 링크 표시 =====
// 동작 원리: 스크롤 위치가 어느 섹션 범위(offsetTop ~ offsetTop+높이)에
// 있는지 판별하여, 해당 섹션의 메뉴 링크에만 .active 클래스를 부여한다.
// [수정] 기존 인라인 스타일(style.color 직접 변경) 방식을 .active 클래스 방식으로
//        변경하여 CSS(디자인)와 JavaScript(동작)의 역할을 분리
var sections = document.querySelectorAll('section');
var navLinks = document.querySelectorAll('nav ul li a');

window.addEventListener('scroll', function() {
  var scrollPos = window.pageYOffset + 80;

  sections.forEach(function(section) {
    if (
      scrollPos >= section.offsetTop &&
      scrollPos < section.offsetTop + section.offsetHeight
    ) {
      navLinks.forEach(function(link) {
        link.classList.remove('active');
      });
      var activeLink = document.querySelector(
        'nav ul li a[href="#' + section.id + '"]'
      );
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  });

  // [추가] 스크롤 진행 바 업데이트
  // 동작 원리: (현재 스크롤 위치 / 전체 스크롤 가능 높이) 비율을 %로 환산해 바의 너비로 적용
  var scrollTop = window.pageYOffset;
  var docHeight = document.documentElement.scrollHeight - window.innerHeight;
  var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  document.getElementById('progressBar').style.width = progress + '%';
});


// ===== 4. [추가] 스크롤 페이드인 효과 =====
// 동작 원리: scroll 이벤트(9장)가 발생할 때마다 각 요소의 문서 기준 위치를 계산하여,
// 요소의 상단이 "화면 하단에서 15% 올라온 지점"보다 위로 올라오면(= 화면에 충분히
// 들어오면) .visible 클래스를 부여하고, CSS의 @keyframes(fadeUp) 애니메이션(5장)이
// 실행되어 서서히 나타난다. 이미 나타난 요소는 다시 검사하지 않는다.
var fadeTargets = document.querySelectorAll(
  '.home-content, .section-title, .about-grid, .projects-grid, .contact-desc, .contact-form, .sns-area'
);

// 대상 요소에 초기 상태(.fade-in: 투명) 클래스 부여
fadeTargets.forEach(function(el) {
  el.classList.add('fade-in');
});

function checkFade() {
  // 기준선: 현재 스크롤 위치 + 화면 높이의 85% 지점
  var triggerLine = window.pageYOffset + window.innerHeight * 0.85;

  fadeTargets.forEach(function(el) {
    if (!el.classList.contains('visible')) {
      // 요소의 문서 기준 절대 위치 (smooth scroll과 동일한 계산 방식)
      var elTop = el.getBoundingClientRect().top + window.pageYOffset;
      if (elTop < triggerLine) {
        el.classList.add('visible');   // 애니메이션 시작
      }
    }
  });
}

window.addEventListener('scroll', checkFade);
checkFade();  // 첫 화면에 이미 보이는 요소(.home-content 등)는 로드 직후 바로 표시
