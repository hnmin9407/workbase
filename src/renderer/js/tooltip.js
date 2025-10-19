// tooltip.js

function initTooltip() {
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    if (el.dataset.tooltipBound) return;
    el.dataset.tooltipBound = "true";

    let tooltip;

    const createTooltip = () => {
      const text = el.getAttribute('data-tooltip');
      const direction = el.getAttribute('data-direction') || 'top';

      tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = text;
      tooltip.setAttribute('data-direction', direction);
      document.body.appendChild(tooltip);

      const rect = el.getBoundingClientRect();
      const tRect = tooltip.getBoundingClientRect();
      let top, left;

      if (direction === 'top') {
        top = rect.top - tRect.height - 8;
        left = rect.left + rect.width / 2 - tRect.width / 2;
      } else if (direction === 'bottom') {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2 - tRect.width / 2;
      } else if (direction === 'left') {
        top = rect.top + rect.height / 2 - tRect.height / 2;
        left = rect.left - tRect.width - 8;
      } else if (direction === 'right') {
        top = rect.top + rect.height / 2 - tRect.height / 2;
        left = rect.right + 8;
      } else if (direction === 'center') {
        top = rect.top + rect.height / 2 - tRect.height / 2;
        left = rect.left + rect.width / 2 - tRect.width / 2;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;

      requestAnimationFrame(() => tooltip.classList.add('show'));
    };

    el.addEventListener('mouseenter', () => {
      // ✅ 기존 툴팁 있으면 transitionend 기다리지 말고 강제로 제거
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
      createTooltip();
    });

    el.addEventListener('mouseleave', () => {
      if (!tooltip) return;
      tooltip.classList.remove('show');

      // transitionend 전에 다시 mouseenter가 오면 제거 로직이 꼬이므로
      // tooltip 참조를 바로 끊어주고, DOM 제거만 transitionend에서 수행
      const toRemove = tooltip;
      tooltip = null;

      toRemove.addEventListener('transitionend', () => {
        toRemove.remove();
      }, { once: true });
    });
  });
}
