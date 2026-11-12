// Inline SVG icons (stroke style, 24×24). Brand glyphs are simplified.
const s = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const f = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">${d}</svg>`;

export const icons = {
  window: s('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/><path d="M7 21h10"/>'),
  tools: s('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  wrench: s('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  door: s('<path d="M5 21V3h14v18"/><path d="M3 21h18"/><path d="M8 6h8v12H8z"/><circle cx="14.5" cy="12" r=".6" fill="currentColor"/>'),
  balcony: s('<path d="M4 10V4h16v6"/><path d="M12 4v6"/><path d="M2 10h20"/><path d="M4 10v10M20 10v10M8 10v10M12 10v10M16 10v10M2 20h20"/>'),
  net: s('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 8h16M4 13h16M4 18h16M9 3v18M15 3v18" stroke-width="1"/>'),
  sill: s('<path d="M3 15h18v3H3z"/><path d="M6 15V4h12v11"/>'),
  blinds: s('<path d="M4 3h16"/><path d="M5 6h14M5 9h14M5 12h14M5 15h14M5 18h14"/><path d="M12 3v18"/>'),
  box: s('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'),
  key: s('<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 20 3M16 7l3 3M14 9l2 2"/>'),
  card: s('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
  shield: s('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  thermo: s('<path d="M14 14.8V4a2 2 0 1 0-4 0v10.8a4 4 0 1 0 4 0z"/>'),
  sound: s('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'),
  phone: s('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
  mail: s('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>'),
  pin: s('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
  clock: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check: s('<path d="m5 12 4.5 4.5L19 7"/>'),
  play: f('<path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.3-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/>'),
  star: f('<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z"/>'),
  menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
  globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  // social
  instagram: s('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8" fill="currentColor"/>'),
  facebook: f('<path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4A20 20 0 0 0 14.3 4c-2.2 0-3.8 1.4-3.8 3.9v2.6H8v3h2.5V21z"/>'),
  telegram: f('<path d="M21.4 3.6 2.9 10.8c-1.2.5-1.2 1.3-.2 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.8c.3-1.3-.5-1.9-1.5-1.5zM8.6 13.5l9.6-6.1c.5-.3.9-.1.5.2l-8 7.3-.3 3.3z"/>'),
  whatsapp: f('<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/>'),
  viber: s('<path d="M7 3h10a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-5l-4 3v-3H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z"/><path d="M9 8c0 3 2 5 5 6l1-1-2-1-1 .5c-1-.5-1.5-1-2-2l.5-1-1-2z" stroke-width="1.3"/>'),
  tiktok: f('<path d="M16.6 2h-3.3v13.2a2.8 2.8 0 1 1-2.8-2.8c.3 0 .5 0 .8.1V9.1a6.1 6.1 0 1 0 5.3 6.1V8.5a7.7 7.7 0 0 0 4.4 1.4V6.6a4.4 4.4 0 0 1-4.4-4.6z"/>'),
  youtube: f('<path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3z"/>'),
  vk: f('<path d="M12.8 17.5c-5.7 0-9-3.9-9.1-10.4h2.9c.1 4.8 2.2 6.8 3.9 7.2V7.1h2.7v4.1c1.7-.2 3.4-2.1 4-4.1h2.7a8 8 0 0 1-3.7 5.2 8.3 8.3 0 0 1 4.3 5.2h-3c-.6-2-2.2-3.5-4.3-3.7v3.7z"/>'),
  linkedin: f('<path d="M6.9 8.5H3.5V20h3.4zM5.2 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM20.5 13.4c0-3.1-1.7-5.1-4.4-5.1-1.5 0-2.6.8-3 1.6V8.5H9.8V20h3.4v-5.9c0-1.6.6-2.7 2-2.7s1.9 1.1 1.9 2.7V20h3.4z"/>'),
  site: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>')
};

export const socialLabels = {
  instagram: 'Instagram', facebook: 'Facebook', telegram: 'Telegram', whatsapp: 'WhatsApp',
  viber: 'Viber', tiktok: 'TikTok', youtube: 'YouTube', vk: 'VK', linkedin: 'LinkedIn', site: 'Web'
};
