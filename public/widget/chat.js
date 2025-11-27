(function () {
  'use strict';

  // Configuration from script tag
  const script = document.currentScript;
  const config = {
    baseUrl: script.getAttribute('data-base-url') || 'https://app.livingwellnessdental.com',
    theme: script.getAttribute('data-theme') || 'light',
    accent: script.getAttribute('data-accent') || '3ec972',
    position: script.getAttribute('data-position') || 'right',
    greeting: script.getAttribute('data-greeting') || 'Hi! How can I help you today?',
  };

  // Create container
  const container = document.createElement('div');
  container.id = 'lwd-chat-widget';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    ${config.position}: 20px;
    z-index: 999999;
    width: 60px;
    height: 60px;
    transition: all 0.3s ease;
  `;
  document.body.appendChild(container);

  // Create iframe
  const iframe = document.createElement('iframe');
  const params = new URLSearchParams({
    theme: config.theme,
    accent: config.accent,
    position: config.position,
    greeting: config.greeting,
  });

  iframe.src = `${config.baseUrl}/widget/chat?${params}`;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
  `;
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.setAttribute('title', 'Living Wellness Dental Chat Widget');
  container.appendChild(iframe);

  // Handle resize messages from iframe
  window.addEventListener('message', function (event) {
    if (event.data.type === 'lwd-widget-resize') {
      container.style.width = event.data.width + 'px';
      container.style.height = event.data.height + 'px';
    }
  });
})();
