function initSidebarCalendar() {
  const weekdayEl = document.getElementById("sidebar-calendar-weekday");
  const dateEl = document.getElementById("sidebar-calendar-date");
  const yearEl = document.getElementById("sidebar-calendar-year");

  if (!dateEl || !yearEl || !weekdayEl) {
    console.warn("sidebar-calendar 요소를 찾을 수 없습니다.");
    return;
  }

  const today = new Date();

  // 한국어 요일명
  const weekdays = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];

  // 영어 요일 약어
  const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekdayIndex = today.getDay();
  const year = today.getFullYear();

  // ✅ 각 요소에 표시
  weekdayEl.textContent = weekdayShort[weekdayIndex]; // Fri 등 영어 약어
  dateEl.textContent = `${month}월 ${date}일 ${weekdays[weekdayIndex]}`; // 10월 25일 금요일
  yearEl.textContent = `${year}년`;
}
