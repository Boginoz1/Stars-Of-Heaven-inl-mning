(function () {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  const ready = (fn) => {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  function injectGlobalStyles() {
    const css = `
      #sw-loader {
        position: fixed; inset: 0; background: #0e0e12; z-index: 9999;
        display: flex; flex-direction: column; align-items: center;
        justify-content: center;
        transition: opacity .5s ease, visibility .5s ease;
      }
      #sw-loader.sw-hide { opacity: 0; visibility: hidden; pointer-events: none; }
      #sw-loader .sw-loader-text {
        font-family: Georgia, serif; color: #d9b85c; letter-spacing: 4px;
        font-size: 1.4rem; margin-bottom: 1.2rem; text-transform: uppercase;
        animation: sw-pulse 1.6s ease-in-out infinite;
      }
      #sw-loader .sw-spinner {
        width: 46px; height: 46px; border-radius: 50%;
        border: 3px solid rgba(217,184,92,0.25); border-top-color: #d9b85c;
        animation: sw-spin 0.9s linear infinite;
      }
      @keyframes sw-spin { to { transform: rotate(360deg); } }
      @keyframes sw-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

      #sw-progress {
        position: fixed; top: 0; left: 0; height: 3px; width: 0%;
        background: linear-gradient(90deg, #d9b85c, #fff5d6, #d9b85c);
        z-index: 3000; transition: width .1s linear;
      }

      #sw-starfield {
        position: fixed; inset: 0; width: 100%; height: 100%;
        z-index: -1; pointer-events: none;
      }

      .hero { overflow: hidden; }

      header.sw-scrolled { padding: 0.6rem 2rem; box-shadow: 0 4px 18px rgba(0,0,0,0.5); }

      .sw-nav-toggle {
        display: none; flex-direction: column; gap: 5px;
        background: none; border: none; cursor: pointer; padding: 6px;
      }
      .sw-nav-toggle span {
        width: 26px; height: 3px; background: #d9b85c; border-radius: 2px;
        transition: transform .25s ease, opacity .25s ease;
      }
      .sw-nav-toggle.sw-active span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
      .sw-nav-toggle.sw-active span:nth-child(2) { opacity: 0; }
      .sw-nav-toggle.sw-active span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

      @media (max-width: 700px) {
        .sw-nav-toggle { display: flex; }
        header nav { width: 100%; order: 3; display: none; }
        header nav.sw-nav-open { display: block; animation: sw-slidedown .3s ease; }
        header nav ul { flex-direction: column; gap: 0.2rem; }
        header nav ul li { width: 100%; }
        header nav ul li a { display: block; padding: 0.7rem 0.2rem; }
      }
      @keyframes sw-slidedown {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      #sw-top-btn {
        position: fixed; bottom: 24px; right: 24px; width: 48px; height: 48px;
        border-radius: 50%; background: #d9b85c; color: #0e0e12; border: none;
        font-size: 1.3rem; font-weight: bold; cursor: pointer;
        opacity: 0; visibility: hidden; transform: translateY(16px);
        transition: opacity .3s ease, transform .3s ease, visibility .3s;
        z-index: 1500; box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      }
      #sw-top-btn.sw-show { opacity: 1; visibility: visible; transform: translateY(0); }
      #sw-top-btn:hover { background: #fff5d6; }

      #sw-cursor {
        position: fixed; top: 0; left: 0; width: 18px; height: 18px;
        border: 2px solid #d9b85c; border-radius: 50%; pointer-events: none;
        z-index: 9998; transform: translate(-50%, -50%);
        transition: width .2s, height .2s, background .2s;
        mix-blend-mode: difference;
      }
      #sw-cursor.sw-cursor-active { width: 34px; height: 34px; background: rgba(217,184,92,0.25); }
      body.sw-has-cursor, body.sw-has-cursor a, body.sw-has-cursor button, body.sw-has-cursor .card {
        cursor: none;
      }

      .sw-reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s ease, transform .7s ease; }
      .sw-reveal.sw-revealed { opacity: 1; transform: translateY(0); }

      .card { will-change: transform; position: relative; }

      .sw-track-toggle {
        margin-top: 0.6rem; background: none; border: 1px solid #d9b85c;
        color: #d9b85c; font-size: 0.75rem; text-transform: uppercase;
        letter-spacing: 1px; padding: 0.35rem 0.8rem; border-radius: 4px;
        cursor: pointer; transition: background .2s ease, color .2s ease;
      }
      .sw-track-toggle:hover { background: #d9b85c; color: #0e0e12; }
      .track-list li.sw-hidden-track { display: none; }

      thead th { cursor: pointer; user-select: none; }
      thead th.sw-sort-asc::after { content: " \\25B2"; color: #d9b85c; font-size: 0.7rem; }
      thead th.sw-sort-desc::after { content: " \\25BC"; color: #d9b85c; font-size: 0.7rem; }

      .sw-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.75);
        display: flex; align-items: center; justify-content: center;
        z-index: 5000; opacity: 0; visibility: hidden;
        transition: opacity .3s ease, visibility .3s ease; padding: 1.5rem;
      }
      .sw-modal-overlay.sw-open { opacity: 1; visibility: visible; }
      .sw-modal {
        background: #1a1a20; border: 1px solid #d9b85c; border-radius: 10px;
        max-width: 520px; width: 100%; padding: 2rem; position: relative;
        transform: scale(.9); transition: transform .3s ease;
        max-height: 85vh; overflow-y: auto;
      }
      .sw-modal-overlay.sw-open .sw-modal { transform: scale(1); }
      .sw-modal img {
        width: 120px; height: 120px; object-fit: cover; border-radius: 50%;
        filter: grayscale(100%); margin-bottom: 1rem; border: 3px solid #d9b85c;
      }
      .sw-modal h2 { color: #d9b85c; margin-bottom: 0.2rem; }
      .sw-modal .sw-modal-close {
        position: absolute; top: 12px; right: 16px; background: none;
        border: none; color: #f1f1f4; font-size: 1.6rem; cursor: pointer; line-height: 1;
      }
      .sw-modal .sw-modal-close:hover { color: #d9b85c; }
      .sw-modal-trivia {
        margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #2a2a30;
        font-style: italic; color: #cfcfd4;
      }
      .card.sw-clickable { cursor: pointer; }

      .sw-burst-star {
        position: fixed; pointer-events: none; color: #d9b85c; font-size: 1rem;
        z-index: 9997; animation: sw-burst-fly 0.9s ease-out forwards;
      }
      @keyframes sw-burst-fly {
        0% { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(var(--sw-x), var(--sw-y)) scale(0); opacity: 0; }
      }

      #sw-konami-banner {
        position: fixed; top: 20px; left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: #d9b85c; color: #0e0e12; font-weight: bold;
        padding: 0.9rem 1.6rem; border-radius: 6px; z-index: 9999;
        transition: transform .4s ease; box-shadow: 0 6px 18px rgba(0,0,0,0.5);
      }
      #sw-konami-banner.sw-show { transform: translateX(-50%) translateY(0); }

      .sw-counting { color: #d9b85c; font-weight: bold; }

      body.sw-tabbing a:focus,
      body.sw-tabbing button:focus {
        outline: 3px solid #d9b85c; outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .sw-reveal { transition: none; opacity: 1; transform: none; }
      }
    `;
    const styleTag = document.createElement('style');
    styleTag.id = 'sw-dynamic-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  function injectExtraStyles() {
    const css = `
      .sw-achievement-toast {
        position: fixed; top: -100px; right: 20px; background: #1a1a20;
        border: 1px solid #d9b85c; border-radius: 10px; padding: 1rem 1.3rem;
        display: flex; align-items: center; gap: 0.9rem; z-index: 9999;
        max-width: 320px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        transition: top .5s ease;
      }
      .sw-achievement-toast.sw-show { top: 20px; }
      .sw-achievement-icon { font-size: 2rem; }
      .sw-achievement-title { font-size: 0.7rem; text-transform: uppercase; color: #8a8a90; letter-spacing: 1px; }
      .sw-achievement-name { font-weight: bold; color: #d9b85c; font-size: 1rem; }
      .sw-achievement-desc { font-size: 0.8rem; color: #cfcfd4; }

      .sw-confetti-piece {
        position: fixed; pointer-events: none; z-index: 9996;
        animation: sw-confetti-fall 1.5s ease-out forwards;
      }
      @keyframes sw-confetti-fall {
        to { transform: translate(var(--sw-cx), var(--sw-cy)) rotate(var(--sw-rot)); opacity: 0; }
      }

      .sw-trail-star {
        position: fixed; pointer-events: none; z-index: 9995; font-size: 1rem;
        transform: translate(-50%, -50%);
        animation: sw-trail-fade .7s ease-out forwards;
      }
      @keyframes sw-trail-fade {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(1.8) translateY(-20px); }
      }

      .sw-ripple {
        position: absolute; border-radius: 50%; background: rgba(217,184,92,0.4);
        transform: scale(0); animation: sw-ripple-anim .6s ease-out; pointer-events: none;
      }
      @keyframes sw-ripple-anim { to { transform: scale(1); opacity: 0; } }

      #sw-matrix-canvas { position: fixed; inset: 0; z-index: 9990; }
      #sw-matrix-close {
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        z-index: 9991; background: #d9b85c; color: #000; border: none;
        padding: .6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: bold;
      }

      body.sw-crt-mode::before {
        content: ''; position: fixed; inset: 0; z-index: 9000; pointer-events: none;
        background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px);
      }
      body.sw-crt-mode { animation: sw-crt-flicker 0.15s infinite; }
      @keyframes sw-crt-flicker { 0% { opacity: 1; } 50% { opacity: 0.98; } 100% { opacity: 1; } }

      .sw-emoji-rain {
        position: fixed; top: -40px; z-index: 9994; pointer-events: none;
        animation: sw-emoji-fall linear forwards;
      }
      @keyframes sw-emoji-fall { to { transform: translateY(110vh) rotate(360deg); } }

      @keyframes sw-shake-anim {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
      }
      body.sw-shake { animation: sw-shake-anim .5s; }
      #sw-riff-text {
        position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
        font-family: Georgia, serif; font-size: 2.4rem; color: #d9b85c;
        text-shadow: 0 0 20px rgba(217,184,92,.8); z-index: 9999; pointer-events: none;
        animation: sw-riff-pop .6s ease-out;
      }
      @keyframes sw-riff-pop {
        from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }

      #sw-banana {
        position: fixed; bottom: 20px; left: -60px; font-size: 3rem;
        z-index: 9994; animation: sw-banana-dance 3s ease-in-out forwards;
      }
      @keyframes sw-banana-dance {
        0% { left: -60px; transform: rotate(0deg); }
        50% { left: 50%; transform: rotate(360deg) translateY(-40px); }
        100% { left: 110%; transform: rotate(720deg); }
      }

      #sw-rick-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999;
        display: flex; align-items: center; justify-content: center; padding: 1.5rem;
      }
      .sw-rick-box {
        background: #1a1a20; border: 2px solid #d9b85c; border-radius: 10px;
        padding: 2rem; text-align: center; max-width: 400px;
      }
      .sw-rick-box p { font-size: 1.3rem; color: #d9b85c; margin-bottom: 1.2rem; }
      .sw-rick-box button {
        background: #d9b85c; border: none; color: #0e0e12; font-weight: bold;
        padding: 0.6rem 1.4rem; border-radius: 6px; cursor: pointer;
      }

      body.sw-high-contrast { filter: contrast(1.4) saturate(1.3); }
      body.sw-high-contrast a { text-decoration: underline !important; }

      #sw-dev-credits, #sw-shortcuts-panel, #sw-achievements-panel {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #1a1a20; border: 1px solid #d9b85c; border-radius: 10px;
        padding: 1.8rem; z-index: 9999; max-width: 420px; width: 90%;
        max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      }
      #sw-dev-credits h3, #sw-shortcuts-panel h3, #sw-achievements-panel h3 {
        color: #d9b85c; margin-bottom: 0.8rem;
      }
      #sw-dev-credits p { margin-bottom: 0.6rem; color: #cfcfd4; }
      #sw-shortcuts-panel ul { list-style: disc; padding-left: 1.2rem; color: #cfcfd4; }
      #sw-shortcuts-panel ul li { margin-bottom: 0.4rem; }
      #sw-dev-credits button, #sw-shortcuts-panel button, #sw-achievements-panel button,
      #sw-ach-close, #sw-game-close {
        margin-top: 1rem; background: #d9b85c; border: none; color: #0e0e12;
        font-weight: bold; padding: 0.5rem 1.2rem; border-radius: 6px; cursor: pointer;
      }

      #sw-achievements-panel ul { list-style: none; }
      #sw-achievements-panel li {
        display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem 0;
        border-bottom: 1px solid #2a2a30;
      }
      #sw-achievements-panel li span { font-size: 1.6rem; }
      .sw-ach-locked strong { color: #5a5a60; }
      .sw-ach-locked small { color: #4a4a50; }
      .sw-ach-unlocked strong { color: #d9b85c; }
      .sw-ach-unlocked small { color: #cfcfd4; }

      #sw-screensaver-logo {
        position: fixed; top: 0; left: 0; z-index: 9993;
        font-family: Georgia, serif; font-size: 1.6rem; color: #d9b85c;
        font-weight: bold; pointer-events: none;
      }

      .sw-hunt-star {
        position: fixed; font-size: 1.4rem; color: #d9b85c; opacity: .3;
        cursor: pointer; z-index: 500; transition: opacity .2s, transform .2s;
        animation: sw-hunt-twinkle 2s ease-in-out infinite;
      }
      .sw-hunt-star:hover { opacity: 1; transform: scale(1.4); }
      @keyframes sw-hunt-twinkle { 0%, 100% { opacity: .2; } 50% { opacity: .5; } }

      .sw-milestone-toast {
        position: fixed; bottom: -60px; left: 50%; transform: translateX(-50%);
        background: #d9b85c; color: #0e0e12; font-weight: bold;
        padding: 0.7rem 1.4rem; border-radius: 6px; z-index: 2500;
        transition: bottom .4s ease;
      }
      .sw-milestone-toast.sw-show { bottom: 20px; }

      #sw-whoa {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        font-size: 3rem; font-weight: bold; color: #d9b85c; z-index: 9999;
        pointer-events: none; animation: sw-whoa-pop 1s ease-out forwards;
      }
      @keyframes sw-whoa-pop {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        30% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
      }

      #sw-visualizer {
        position: fixed; bottom: 20px; left: 20px; display: flex;
        align-items: flex-end; gap: 3px; height: 30px; z-index: 400; opacity: .5;
      }
      #sw-visualizer span {
        width: 4px; background: #d9b85c; height: 10%;
        animation: sw-vis-bounce 1s ease-in-out infinite;
      }
      @keyframes sw-vis-bounce { 0%, 100% { height: 10%; } 50% { height: 100%; } }
      @media (max-width: 700px) { #sw-visualizer { display: none; } }

      #sw-quote-ticker {
        position: fixed; bottom: -80px; left: 50%; transform: translateX(-50%);
        background: #1a1a20; border: 1px solid #d9b85c; color: #f1f1f4;
        padding: .8rem 1.4rem; border-radius: 8px; max-width: 90%;
        text-align: center; font-style: italic; z-index: 2000;
        transition: bottom .5s ease;
      }
      #sw-quote-ticker.sw-show { bottom: 20px; }

      #sw-aurora {
        position: fixed; inset: -20%; z-index: -2;
        background:
          radial-gradient(circle at 20% 20%, rgba(217,184,92,0.08), transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(166,106,42,0.08), transparent 45%);
        filter: blur(60px);
        animation: sw-aurora-move 20s ease-in-out infinite alternate;
      }
      @keyframes sw-aurora-move {
        0% { transform: translate(0, 0) rotate(0deg); }
        100% { transform: translate(5%, 8%) rotate(8deg); }
      }

      #sw-lightbox {
        position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9998;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; visibility: hidden; transition: opacity .3s ease, visibility .3s ease;
        padding: 2rem;
      }
      #sw-lightbox.sw-open { opacity: 1; visibility: visible; }
      #sw-lightbox img {
        max-width: 90%; max-height: 85vh; border-radius: 8px;
        border: 2px solid #d9b85c; box-shadow: 0 10px 50px rgba(0,0,0,0.7);
      }
      #sw-lightbox-close {
        position: absolute; top: 20px; right: 30px; background: none; border: none;
        color: #fff; font-size: 2.4rem; cursor: pointer;
      }

      .card.sw-shimmer::after {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(120deg, transparent, rgba(217,184,92,.35), transparent);
        animation: sw-shimmer-sweep .9s ease; pointer-events: none;
      }
      @keyframes sw-shimmer-sweep {
        from { transform: translateX(-100%); }
        to { transform: translateX(100%); }
      }

      #sw-game-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999;
        display: flex; align-items: center; justify-content: center; padding: 1.5rem;
      }
      .sw-game-box {
        background: #1a1a20; border: 2px solid #d9b85c; border-radius: 10px;
        padding: 1.8rem; max-width: 500px; width: 100%; text-align: center;
      }
      .sw-game-box h3 { color: #d9b85c; margin-bottom: 0.5rem; }
      #sw-game-score { color: #cfcfd4; margin: 0.6rem 0; font-weight: bold; }
      #sw-game-arena {
        position: relative; height: 300px; background: #0e0e12;
        border: 1px dashed #d9b85c; border-radius: 8px; overflow: hidden; margin: 1rem 0;
      }
      .sw-game-star {
        position: absolute; font-size: 1.8rem; cursor: pointer;
        animation: sw-game-pulse .9s ease-in-out;
      }
      @keyframes sw-game-pulse {
        0% { transform: scale(0); }
        20% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
      .sw-game-result { color: #d9b85c; font-size: 1.2rem; font-weight: bold; margin-top: 2rem; }
    `;
    const styleTag = document.createElement('style');
    styleTag.id = 'sw-extra-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  const SOH_ACHIEVEMENTS = {
    konami: { name: 'Legendary Coder', desc: 'Hittade Konami-koden', icon: '🕹️' },
    logoClicks: { name: 'Stjärnsamlare', desc: 'Klickade på logotypen 10 gånger', icon: '⭐' },
    starHunt: { name: 'Stjärnjägare', desc: 'Hittade alla gömda stjärnor', icon: '🌟' },
    matrix: { name: 'Följ den vita kaninen', desc: 'Aktiverade Matrix-läget', icon: '💊' },
    disco: { name: 'Diskokung', desc: 'Aktiverade diskoläget', icon: '🪩' },
    metal: { name: 'Headbanger', desc: 'Aktiverade metalläget', icon: '🤘' },
    banana: { name: 'Bananrepublik', desc: 'Hittade bananen', icon: '🍌' },
    rick: { name: 'Never Gonna Give You Up', desc: 'Blev rickrollad', icon: '🎵' },
    scrollEnd: { name: 'Botten nådd', desc: 'Scrollade till botten av sidan', icon: '🏁' },
    nightOwl: { name: 'Nattuggla', desc: 'Besökte sidan efter midnatt', icon: '🦉' },
    speedster: { name: 'Hastighetsdemon', desc: 'Scrollade väldigt snabbt', icon: '💨' },
    retro: { name: 'Tillbaka till 90-talet', desc: 'Aktiverade retro-läget', icon: '📼' },
    gameWin: { name: 'Stjärnfångaren', desc: 'Fick 10+ poäng i minispelet', icon: '🎮' },
  };

  function unlockAchievement(key) {
    const data = SOH_ACHIEVEMENTS[key];
    if (!data) return;
    const unlocked = JSON.parse(localStorage.getItem('sw-achievements') || '{}');
    if (unlocked[key]) return;
    unlocked[key] = true;
    localStorage.setItem('sw-achievements', JSON.stringify(unlocked));
    showAchievementToast(data);
  }

  function showAchievementToast(data) {
    const toast = document.createElement('div');
    toast.className = 'sw-achievement-toast';
    toast.innerHTML = `
      <span class="sw-achievement-icon">${data.icon}</span>
      <div>
        <div class="sw-achievement-title">Prestation upplåst!</div>
        <div class="sw-achievement-name">${data.name}</div>
        <div class="sw-achievement-desc">${data.desc}</div>
      </div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('sw-show'));
    setTimeout(() => {
      toast.classList.remove('sw-show');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  function initPageLoad() {
    const loader = document.createElement('div');
    loader.id = 'sw-loader';
    loader.innerHTML = `
      <div class="sw-loader-text">Stars of Heaven</div>
      <div class="sw-spinner"></div>
    `;
    document.body.appendChild(loader);

    const minShowTime = 500;
    const start = Date.now();

    window.addEventListener('load', () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(minShowTime - elapsed, 0);
      setTimeout(() => {
        loader.classList.add('sw-hide');
        setTimeout(() => loader.remove(), 600);
      }, wait);
    });
  }

  function initStarfield() {
    const canvas = document.createElement('canvas');
    canvas.id = 'sw-starfield';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let stars = [];
    let width, height;

    function createStar() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.3,
        alpha: Math.random(),
        delta: Math.random() * 0.02 + 0.005,
        direction: Math.random() > 0.5 ? 1 : -1,
      };
    }

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const starCount = Math.floor((width * height) / 9000);
      stars = Array.from({ length: starCount }, createStar);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        star.alpha += star.delta * star.direction;
        if (star.alpha <= 0.1 || star.alpha >= 1) star.direction *= -1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(217, 184, 92, ${star.alpha})`;
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function loop() {
      draw();
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);

    if (prefersReducedMotion) {
      draw();
    } else {
      loop();
    }
  }

  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'sw-progress';
    document.body.appendChild(bar);

    function update() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }

    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  }

  function initHeader() {
    const header = $('header');
    if (!header) return;
    const nav = $('nav', header);

    header.style.transition = 'padding .3s ease, box-shadow .3s ease';
    window.addEventListener('scroll', () => {
      header.classList.toggle('sw-scrolled', window.scrollY > 50);
    });

    if (!nav) return;

    const toggle = document.createElement('button');
    toggle.className = 'sw-nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Öppna meny');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    header.insertBefore(toggle, nav);

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('sw-nav-open');
      toggle.classList.toggle('sw-active', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Stäng meny' : 'Öppna meny');
    });

    $$('a', nav).forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('sw-nav-open');
        toggle.classList.remove('sw-active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 700) {
        nav.classList.remove('sw-nav-open');
        toggle.classList.remove('sw-active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start',
          });
        }
      });
    });
  }

  function initScrollReveal() {
    const sections = $$('main > section').filter(
      (s) => !s.classList.contains('hero')
    );
    const cards = $$('.card');
    const targets = Array.from(new Set([...sections, ...cards]));

    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach((t) => t.classList.add('sw-reveal', 'sw-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sw-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach((el, i) => {
      el.classList.add('sw-reveal');
      el.style.transitionDelay = (i % 4) * 0.1 + 's';
      observer.observe(el);
    });
  }

  function initCardTilt() {
    if (isTouchDevice || prefersReducedMotion) return;

    $$('.card').forEach((card) => {
      card.style.transition = 'transform 0.1s ease';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  function initHeroParallax() {
    const heroImg = $('.hero img');
    const heroText = $('.hero-text');
    if (!heroImg || prefersReducedMotion) return;

    let ticking = false;

    function update() {
      const scrollY = window.scrollY;
      const heroHeight = heroImg.parentElement.offsetHeight;
      if (scrollY < heroHeight + 200) {
        heroImg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.05)`;
        if (heroText) {
          heroText.style.transform = `translateY(${scrollY * 0.15}px)`;
        }
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    });
  }

  function initTypewriter() {
    const p = $('.hero-text p');
    if (!p || prefersReducedMotion) return;

    const fullText = p.textContent;
    p.textContent = '';
    p.style.borderRight = '2px solid #d9b85c';

    let i = 0;
    function type() {
      if (i <= fullText.length) {
        p.textContent = fullText.slice(0, i);
        i++;
        setTimeout(type, 45);
      } else {
        p.style.borderRight = 'none';
      }
    }

    setTimeout(type, 600);
  }

  function initBackToTop() {
    const btn = document.createElement('button');
    btn.id = 'sw-top-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Till toppen');
    btn.innerHTML = '&uarr;';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.classList.toggle('sw-show', window.scrollY > 400);
    });

    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });
  }

  function initTrackListToggle() {
    $$('.track-list').forEach((list) => {
      const items = Array.from(list.children);
      if (items.length <= 2) return;

      items.forEach((li, idx) => {
        if (idx >= 2) li.classList.add('sw-hidden-track');
      });

      const btn = document.createElement('button');
      btn.className = 'sw-track-toggle';
      btn.type = 'button';
      btn.textContent = `Visa alla låtar (${items.length})`;
      btn.setAttribute('aria-expanded', 'false');
      list.insertAdjacentElement('afterend', btn);

      btn.addEventListener('click', () => {
        const isCollapsed = items.some((li) =>
          li.classList.contains('sw-hidden-track')
        );
        items.forEach((li, idx) => {
          if (idx >= 2) li.classList.toggle('sw-hidden-track', !isCollapsed);
        });
        btn.textContent = isCollapsed
          ? 'Visa färre låtar'
          : `Visa alla låtar (${items.length})`;
        btn.setAttribute('aria-expanded', String(isCollapsed));
      });
    });
  }

  function initTableSort() {
    const table = $('table');
    if (!table) return;

    const ths = $$('thead th', table);
    const tbody = $('tbody', table);
    if (!tbody) return;

    function toSeconds(str) {
      const parts = str.split(':').map(Number);
      return parts[0] * 60 + parts[1];
    }

    ths.forEach((th, index) => {
      th.addEventListener('click', () => {
        const rows = Array.from(tbody.rows);
        const asc = !th.classList.contains('sw-sort-asc');

        ths.forEach((h) => h.classList.remove('sw-sort-asc', 'sw-sort-desc'));
        th.classList.add(asc ? 'sw-sort-asc' : 'sw-sort-desc');

        rows.sort((a, b) => {
          let valA = a.cells[index].textContent.trim();
          let valB = b.cells[index].textContent.trim();
          const timePattern = /^\d+:\d{2}$/;

          if (timePattern.test(valA) && timePattern.test(valB)) {
            valA = toSeconds(valA);
            valB = toSeconds(valB);
          } else if (/^\d+$/.test(valA) && /^\d+$/.test(valB)) {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
          } else {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
          }

          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });

        rows.forEach((row) => tbody.appendChild(row));
      });
    });
  }

  function initCustomCursor() {
    if (isTouchDevice || prefersReducedMotion) return;

    const cursor = document.createElement('div');
    cursor.id = 'sw-cursor';
    document.body.appendChild(cursor);
    document.body.classList.add('sw-has-cursor');

    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function loop() {
      curX += (mouseX - curX) * 0.2;
      curY += (mouseY - curY) * 0.2;
      cursor.style.left = curX + 'px';
      cursor.style.top = curY + 'px';
      requestAnimationFrame(loop);
    }
    loop();

    $$('a, button, .card, .sw-nav-toggle').forEach((el) => {
      el.addEventListener('mouseenter', () =>
        cursor.classList.add('sw-cursor-active')
      );
      el.addEventListener('mouseleave', () =>
        cursor.classList.remove('sw-cursor-active')
      );
    });
  }

  function spawnStarBurst(x, y) {
    if (prefersReducedMotion) return;
    const count = 16;

    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'sw-burst-star';
      star.textContent = '✦';

      const angle = (Math.PI * 2 * i) / count;
      const distance = 60 + Math.random() * 60;

      star.style.setProperty('--sw-x', Math.cos(angle) * distance + 'px');
      star.style.setProperty('--sw-y', Math.sin(angle) * distance + 'px');
      star.style.left = x + 'px';
      star.style.top = y + 'px';

      document.body.appendChild(star);
      setTimeout(() => star.remove(), 900);
    }
  }

  function initLogoEasterEgg() {
    const logo = $('.logo');
    if (!logo) return;

    logo.style.cursor = 'pointer';
    logo.addEventListener('click', (e) => {
      spawnStarBurst(e.clientX, e.clientY);
      if (!prefersReducedMotion && logo.animate) {
        logo.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.15)' },
            { transform: 'scale(1)' },
          ],
          { duration: 400, easing: 'ease-out' }
        );
      }
    });
  }

  function initKonamiCode() {
    const sequence = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'b', 'a',
    ];
    let position = 0;

    const banner = document.createElement('div');
    banner.id = 'sw-konami-banner';
    banner.textContent = '🤘 Rock on! Hemligt läge aktiverat!';
    document.body.appendChild(banner);

    function starRain() {
      if (prefersReducedMotion) return;
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight * 0.5;
          spawnStarBurst(x, y);
        }, i * 60);
      }
    }

    function triggerKonami() {
      banner.classList.add('sw-show');
      starRain();
      unlockAchievement('konami');
      setTimeout(() => banner.classList.remove('sw-show'), 3000);
    }

    window.addEventListener('keydown', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === sequence[position]) {
        position++;
        if (position === sequence.length) {
          triggerKonami();
          position = 0;
        }
      } else {
        position = key === sequence[0] ? 1 : 0;
      }
    });
  }

  function initFooterYear() {
    const footerP = $('footer p');
    if (!footerP) return;

    const year = new Date().getFullYear();
    const note = document.createElement('span');
    note.style.display = 'block';
    note.style.fontSize = '0.75rem';
    note.style.marginTop = '0.3rem';
    note.style.color = '#5a5a60';
    note.textContent = `Webbplatsen senast granskad ${year}`;
    footerP.insertAdjacentElement('afterend', note);
  }

  function initActiveNav() {
    const links = $$('header nav ul li a');
    const current = location.pathname.split('/').pop() || 'index.html';

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === current) link.classList.add('active');
    });
  }

  const memberTrivia = {
    'Erik Lindqvist': 'Erik skrev sin första låt vid 14 års ålder och har aldrig slutat sedan dess.',
    'Mikael Dahl': 'Mikael äger över 40 gitarrer, men spelar nästan alltid på samma Gibson Les Paul från 1986.',
    'Johan Berg': 'Innan Stars of Heaven spelade Johan bas i ett lokalt jazzband i Göteborg.',
    'Anders Ström': 'Anders övningspass är legendariska – han har slitit ut mer än 200 par trumpinnar genom åren.',
  };

  function initMemberModal() {
    const cards = $$('.grid-container .card');
    if (!cards.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'sw-modal-overlay';
    overlay.innerHTML = `
      <div class="sw-modal" role="dialog" aria-modal="true">
        <button type="button" class="sw-modal-close" aria-label="Stäng">&times;</button>
        <img src="" alt="">
        <h2></h2>
        <span class="role"></span>
        <p class="sw-modal-bio"></p>
        <p class="sw-modal-trivia"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    const modalImg = $('img', overlay);
    const modalTitle = $('h2', overlay);
    const modalRole = $('.role', overlay);
    const modalBio = $('.sw-modal-bio', overlay);
    const modalTrivia = $('.sw-modal-trivia', overlay);
    const closeBtn = $('.sw-modal-close', overlay);

    let attached = false;

    cards.forEach((card) => {
      const titleEl = $('h2', card) || $('h3', card);
      if (!titleEl) return;

      const name = titleEl.textContent.trim();
      if (!memberTrivia[name]) return;

      attached = true;
      card.classList.add('sw-clickable');
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Visa mer om ${name}`);

      const open = () => {
        const img = $('img', card);
        const role = $('.role', card);
        const bio = $('.card-content p', card);

        modalImg.src = img ? img.src : '';
        modalImg.alt = img ? img.alt : '';
        modalTitle.textContent = name;
        modalRole.textContent = role ? role.textContent : '';
        modalBio.textContent = bio ? bio.textContent.trim() : '';
        modalTrivia.textContent = '🎸 ' + memberTrivia[name];

        overlay.classList.add('sw-open');
        closeBtn.focus();
      };

      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    if (!attached) {
      overlay.remove();
      return;
    }

    function close() {
      overlay.classList.remove('sw-open');
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  function initCounterAnimation() {
    const items = $$('.fact-box ul li');
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateItem(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    items.forEach((li) => observer.observe(li));

    function animateItem(li) {
      const text = li.textContent;
      const match = text.match(/:\s*(\d+)\s*$/);
      if (!match) return;

      const target = parseInt(match[1], 10);
      if (!target) return;

      const prefix = text.slice(0, match.index + 1);
      li.textContent = prefix + ' ';

      const span = document.createElement('span');
      span.className = 'sw-counting';
      li.appendChild(span);

      let current = 0;
      const duration = 800;
      const stepTime = Math.max(Math.floor(duration / target), 30);

      const timer = setInterval(() => {
        current++;
        span.textContent = current;
        if (current >= target) clearInterval(timer);
      }, stepTime);
    }
  }

  function initA11y() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') document.body.classList.add('sw-tabbing');
    });
    window.addEventListener('mousedown', () => {
      document.body.classList.remove('sw-tabbing');
    });
  }

  function spawnConfetti(x, y, count = 40) {
    const colors = ['#d9b85c', '#ffffff', '#ffd700', '#ff6b6b', '#4ecdc4', '#a66a2a'];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'sw-confetti-piece';
      const size = Math.random() * 8 + 4;
      piece.style.width = size + 'px';
      piece.style.height = size * 0.4 + 'px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = x + 'px';
      piece.style.top = y + 'px';
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 300 + 100;
      const xEnd = Math.cos(angle) * velocity;
      const yEnd = Math.sin(angle) * velocity + 200;
      piece.style.setProperty('--sw-cx', xEnd + 'px');
      piece.style.setProperty('--sw-cy', yEnd + 'px');
      piece.style.setProperty('--sw-rot', Math.random() * 720 - 360 + 'deg');
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 1500);
    }
  }

  function initMouseTrail() {
    if (isTouchDevice || prefersReducedMotion) return;
    let shiftHeld = false;
    window.addEventListener('keydown', (e) => { if (e.key === 'Shift') shiftHeld = true; });
    window.addEventListener('keyup', (e) => { if (e.key === 'Shift') shiftHeld = false; });
    let lastSpawn = 0;
    window.addEventListener('mousemove', (e) => {
      if (!shiftHeld) return;
      const now = Date.now();
      if (now - lastSpawn < 40) return;
      lastSpawn = now;
      const star = document.createElement('span');
      star.className = 'sw-trail-star';
      star.textContent = '✨';
      star.style.left = e.clientX + 'px';
      star.style.top = e.clientY + 'px';
      document.body.appendChild(star);
      setTimeout(() => star.remove(), 700);
    });
  }

  function initButtonRipple() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, nav a');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'sw-ripple';
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      if (getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
      }
      target.style.overflow = 'hidden';
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  let swMatrixInterval = null;
  function activateMatrixMode() {
    if (swMatrixInterval) return;
    unlockAchievement('matrix');
    const canvas = document.createElement('canvas');
    canvas.id = 'sw-matrix-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = 'アイウエオカキクケコサシスセソ0123456789STARSOFHEAVEN';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    function draw() {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#d9b85c';
      ctx.font = fontSize + 'px monospace';
      drops.forEach((y, i) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }
    swMatrixInterval = setInterval(draw, 40);

    const closeBtn = document.createElement('button');
    closeBtn.id = 'sw-matrix-close';
    closeBtn.textContent = 'Avsluta Matrix-läge (ESC)';
    document.body.appendChild(closeBtn);
    closeBtn.addEventListener('click', deactivateMatrixMode);

    function escHandler(e) {
      if (e.key === 'Escape') deactivateMatrixMode();
    }
    window.addEventListener('keydown', escHandler);
    canvas._escHandler = escHandler;
  }
  function deactivateMatrixMode() {
    clearInterval(swMatrixInterval);
    swMatrixInterval = null;
    const canvas = $('#sw-matrix-canvas');
    if (canvas) {
      window.removeEventListener('keydown', canvas._escHandler);
      canvas.remove();
    }
    const btn = $('#sw-matrix-close');
    if (btn) btn.remove();
  }

  let swDiscoInterval = null;
  function activateDiscoMode() {
    if (swDiscoInterval) return;
    unlockAchievement('disco');
    const colors = ['#ff004c', '#00e5ff', '#ffea00', '#7cff00', '#ff00e5', '#d9b85c'];
    let i = 0;
    swDiscoInterval = setInterval(() => {
      document.body.style.backgroundColor = colors[i % colors.length];
      i++;
    }, 300);
    setTimeout(deactivateDiscoMode, 8000);
  }
  function deactivateDiscoMode() {
    clearInterval(swDiscoInterval);
    swDiscoInterval = null;
    document.body.style.backgroundColor = '';
  }

  function activateRetroMode() {
    unlockAchievement('retro');
    document.body.classList.toggle('sw-crt-mode');
  }

  function activatePartyMode() {
    const emojis = ['🎉', '🎸', '🤘', '⭐', '🔥', '🎶', '✨'];
    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        const el = document.createElement('span');
        el.className = 'sw-emoji-rain';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = Math.random() * window.innerWidth + 'px';
        el.style.fontSize = (Math.random() * 20 + 16) + 'px';
        el.style.animationDuration = (Math.random() * 2 + 2) + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
      }, i * 50);
    }
  }

  function activateMetalMode() {
    unlockAchievement('metal');
    document.body.classList.add('sw-shake');
    const riffs = [
      'DUN DUN DUN DAAA!',
      'E - A - D - G solo incoming...',
      '🤘 KEEP ON ROCKIN\' 🤘',
      'Volym: 11',
    ];
    const riffText = document.createElement('div');
    riffText.id = 'sw-riff-text';
    riffText.textContent = riffs[Math.floor(Math.random() * riffs.length)];
    document.body.appendChild(riffText);
    setTimeout(() => {
      document.body.classList.remove('sw-shake');
      riffText.remove();
    }, 1200);
  }

  function activateBananaEgg() {
    unlockAchievement('banana');
    const banana = document.createElement('div');
    banana.id = 'sw-banana';
    banana.textContent = '🍌';
    document.body.appendChild(banana);
    setTimeout(() => banana.remove(), 3000);
  }

  function activateRickroll() {
    unlockAchievement('rick');
    if ($('#sw-rick-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'sw-rick-overlay';
    overlay.innerHTML = `
      <div class="sw-rick-box">
        <p>🎵 Never gonna give you up... 🎵</p>
        <button type="button" id="sw-rick-close">Okej, okej, jag fattar</button>
      </div>
    `;
    document.body.appendChild(overlay);
    $('#sw-rick-close', overlay).addEventListener('click', () => overlay.remove());
  }

  function activateContrastMode() {
    document.body.classList.toggle('sw-high-contrast');
  }

  function showDevCredits() {
    if ($('#sw-dev-credits')) return;
    const box = document.createElement('div');
    box.id = 'sw-dev-credits';
    box.innerHTML = `
      <h3>🛠️ Byggd med kärlek</h3>
      <p>Denna sida kodades för Stars of Heaven med HTML, CSS och ren JavaScript.</p>
      <p>Tack för att du utforskar koden!</p>
      <button type="button" id="sw-dev-close">Stäng</button>
    `;
    document.body.appendChild(box);
    $('#sw-dev-close', box).addEventListener('click', () => box.remove());
  }

  function showShortcutsPanel() {
    if ($('#sw-shortcuts-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'sw-shortcuts-panel';
    panel.innerHTML = `
      <h3>⌨️ Hemliga koder</h3>
      <ul>
        <li><strong>matrix</strong> — Matrix-läge</li>
        <li><strong>disco</strong> — Discoläge</li>
        <li><strong>retro</strong> — CRT-läge</li>
        <li><strong>party</strong> — Konfettiregn</li>
        <li><strong>metal</strong> — Skärmskakning</li>
        <li><strong>banana</strong> — 🍌</li>
        <li><strong>rick</strong> — ...du vet</li>
        <li><strong>contrast</strong> — Hög kontrast</li>
        <li><strong>dev</strong> — Utvecklarkrediter</li>
        <li><strong>game</strong> — Minispel</li>
        <li><strong>achievements</strong> — Prestationer</li>
        <li><strong>normal</strong> — Återställ allt</li>
        <li>Håll <strong>Shift</strong> + rör musen — stjärnspår</li>
        <li>↑↑↓↓←→←→BA — Konami-läge</li>
      </ul>
      <button type="button" id="sw-shortcuts-close">Stäng</button>
    `;
    document.body.appendChild(panel);
    $('#sw-shortcuts-close', panel).addEventListener('click', () => panel.remove());
  }

  function resetAllModes() {
    deactivateMatrixMode();
    deactivateDiscoMode();
    document.body.classList.remove('sw-crt-mode', 'sw-high-contrast');
  }

  function showAchievementsPanel() {
    if ($('#sw-achievements-panel')) return;
    const unlocked = JSON.parse(localStorage.getItem('sw-achievements') || '{}');
    const panel = document.createElement('div');
    panel.id = 'sw-achievements-panel';
    const items = Object.keys(SOH_ACHIEVEMENTS)
      .map((key) => {
        const a = SOH_ACHIEVEMENTS[key];
        const got = unlocked[key];
        return `<li class="${got ? 'sw-ach-unlocked' : 'sw-ach-locked'}">
          <span>${got ? a.icon : '🔒'}</span>
          <div>
            <strong>${got ? a.name : '???'}</strong><br>
            <small>${got ? a.desc : 'Inte upplåst än'}</small>
          </div>
        </li>`;
      })
      .join('');

    panel.innerHTML = `
      <h3>🏆 Prestationer</h3>
      <ul>${items}</ul>
      <button type="button" id="sw-ach-close">Stäng</button>
    `;
    document.body.appendChild(panel);
    $('#sw-ach-close', panel).addEventListener('click', () => panel.remove());
  }

  function activateMiniGame() {
    if ($('#sw-game-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'sw-game-overlay';
    overlay.innerHTML = `
      <div class="sw-game-box">
        <h3>🎸 Stjärnfångaren</h3>
        <p>Klicka på stjärnorna innan de försvinner! Du har 15 sekunder.</p>
        <div id="sw-game-score">Poäng: 0</div>
        <div id="sw-game-arena"></div>
        <button type="button" id="sw-game-close">Avsluta</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const arena = $('#sw-game-arena', overlay);
    const scoreEl = $('#sw-game-score', overlay);
    let score = 0;
    let gameActive = true;
    let spawnTimer = null;
    let countdown = 15;

    function spawnTarget() {
      if (!gameActive) return;
      const star = document.createElement('span');
      star.className = 'sw-game-star';
      star.textContent = '⭐';
      star.style.left = Math.random() * 90 + '%';
      star.style.top = Math.random() * 80 + '%';
      arena.appendChild(star);

      const timeout = setTimeout(() => star.remove(), 900);

      star.addEventListener('click', () => {
        score++;
        scoreEl.textContent = `Poäng: ${score}`;
        clearTimeout(timeout);
        const rect = star.getBoundingClientRect();
        star.remove();
        spawnConfetti(rect.left, rect.top, 8);
      });

      spawnTimer = setTimeout(spawnTarget, Math.random() * 400 + 300);
    }
    spawnTarget();

    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        endGame();
      }
    }, 1000);

    function endGame() {
      gameActive = false;
      clearTimeout(spawnTimer);
      arena.innerHTML = `<p class="sw-game-result">Spelet slut! Du fick ${score} poäng 🎉</p>`;
      if (score >= 10) unlockAchievement('gameWin');
    }

    $('#sw-game-close', overlay).addEventListener('click', () => {
      gameActive = false;
      clearTimeout(spawnTimer);
      clearInterval(countdownInterval);
      overlay.remove();
    });
  }

  function initSecretWordDetector() {
    const words = {
      matrix: activateMatrixMode,
      disco: activateDiscoMode,
      retro: activateRetroMode,
      party: activatePartyMode,
      metal: activateMetalMode,
      banana: activateBananaEgg,
      rick: activateRickroll,
      contrast: activateContrastMode,
      dev: showDevCredits,
      game: activateMiniGame,
      achievements: showAchievementsPanel,
      normal: resetAllModes,
    };
    let buffer = '';
    window.addEventListener('keydown', (e) => {
      if (e.key === '?') {
        showShortcutsPanel();
        return;
      }
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-20);
      Object.keys(words).forEach((word) => {
        if (buffer.endsWith(word)) {
          words[word]();
          buffer = '';
        }
      });
    });
  }

  function initIdleScreensaver() {
    let idleTimer = null;
    const idleDelay = 60000;
    let bounceInterval = null;

    function startScreensaver() {
      if (prefersReducedMotion) return;
      const logo = $('.logo');
      if (!logo) return;
      const clone = document.createElement('div');
      clone.id = 'sw-screensaver-logo';
      clone.textContent = logo.textContent;
      document.body.appendChild(clone);

      let x = 100, y = 100, dx = 2, dy = 2;
      bounceInterval = setInterval(() => {
        const w = clone.offsetWidth || 200;
        const h = clone.offsetHeight || 40;
        x += dx; y += dy;
        if (x <= 0 || x + w >= window.innerWidth) dx *= -1;
        if (y <= 0 || y + h >= window.innerHeight) dy *= -1;
        clone.style.transform = `translate(${x}px, ${y}px)`;
      }, 16);
    }

    function stopScreensaver() {
      clearInterval(bounceInterval);
      const clone = $('#sw-screensaver-logo');
      if (clone) clone.remove();
    }

    function resetIdle() {
      clearTimeout(idleTimer);
      stopScreensaver();
      idleTimer = setTimeout(startScreensaver, idleDelay);
    }

    ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach((evt) =>
      window.addEventListener(evt, resetIdle)
    );
    resetIdle();
  }

  function initTitleFlash() {
    const originalTitle = document.title;
    let flashInterval = null;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        let toggle = false;
        flashInterval = setInterval(() => {
          document.title = toggle ? '🎸 Kom tillbaka!' : originalTitle;
          toggle = !toggle;
        }, 1000);
      } else {
        clearInterval(flashInterval);
        document.title = originalTitle;
      }
    });
  }

  function swapFavicon(emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '54px serif';
    ctx.fillText(emoji, 4, 52);
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL();
  }

  function initLogoClickCounter() {
    const logo = $('.logo');
    if (!logo) return;
    let clicks = 0;
    let clickTimer = null;

    logo.addEventListener('click', () => {
      clicks++;
      const stored = parseInt(localStorage.getItem('sw-logo-clicks') || '0', 10) + 1;
      localStorage.setItem('sw-logo-clicks', String(stored));
      if (stored >= 10) unlockAchievement('logoClicks');

      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clicks = 0; }, 600);

      if (clicks === 3) {
        spawnConfetti(window.innerWidth / 2, 100, 80);
        swapFavicon('⭐');
        setTimeout(() => swapFavicon('🎸'), 5000);
      }
    });
  }

  function initStarHunt() {
    const positions = [
      { top: '12%', left: '5%' },
      { top: '40%', left: '90%' },
      { top: '70%', left: '15%' },
      { top: '25%', left: '60%' },
      { top: '85%', left: '80%' },
    ];
    let found = JSON.parse(localStorage.getItem('sw-hunt-found') || '[]');

    positions.forEach((pos, i) => {
      if (found.includes(i)) return;
      const star = document.createElement('span');
      star.className = 'sw-hunt-star';
      star.textContent = '✦';
      star.style.top = pos.top;
      star.style.left = pos.left;
      document.body.appendChild(star);

      star.addEventListener('click', () => {
        const rect = star.getBoundingClientRect();
        star.remove();
        found.push(i);
        localStorage.setItem('sw-hunt-found', JSON.stringify(found));
        spawnConfetti(rect.left, rect.top, 20);
        if (found.length >= positions.length) {
          unlockAchievement('starHunt');
        }
      });
    });
  }

  function initScrollMilestones() {
    const milestones = [25, 50, 75, 100];
    const reached = new Set();
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);
      milestones.forEach((m) => {
        if (pct >= m && !reached.has(m)) {
          reached.add(m);
          showMilestoneToast(m);
          if (m === 100) unlockAchievement('scrollEnd');
        }
      });
    });
  }

  function showMilestoneToast(pct) {
    const toast = document.createElement('div');
    toast.className = 'sw-milestone-toast';
    toast.textContent = pct === 100 ? '🏁 Du har läst allt!' : `📜 ${pct}% utforskat`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('sw-show'));
    setTimeout(() => {
      toast.classList.remove('sw-show');
      setTimeout(() => toast.remove(), 400);
    }, 2000);
  }

  function initFastScrollDetector() {
    let lastY = window.scrollY;
    let lastT = Date.now();
    window.addEventListener('scroll', () => {
      const now = Date.now();
      const dt = now - lastT;
      const dy = Math.abs(window.scrollY - lastY);
      if (dt > 0) {
        const speed = dy / dt;
        if (speed > 3) {
          unlockAchievement('speedster');
          showWhoaText();
        }
      }
      lastY = window.scrollY;
      lastT = now;
    });
  }

  let swWhoaShown = false;
  function showWhoaText() {
    if (swWhoaShown) return;
    swWhoaShown = true;
    const el = document.createElement('div');
    el.id = 'sw-whoa';
    el.textContent = 'WHOA! 🚀';
    document.body.appendChild(el);
    setTimeout(() => {
      el.remove();
      swWhoaShown = false;
    }, 1000);
  }

  function initFakeVisualizer() {
    const vis = document.createElement('div');
    vis.id = 'sw-visualizer';
    for (let i = 0; i < 12; i++) {
      const bar = document.createElement('span');
      bar.style.animationDelay = (i * 0.08) + 's';
      vis.appendChild(bar);
    }
    document.body.appendChild(vis);
  }

  function initVinylSpin() {
    const albumImgs = $$('.card img[src*="album"]');
    if (!albumImgs.length) return;
    albumImgs.forEach((img) => {
      img.style.transition = 'transform 0.6s ease';
      const card = img.closest('.card');
      card.addEventListener('mouseenter', () => {
        img.style.transform = 'rotate(25deg) scale(1.03)';
      });
      card.addEventListener('mouseleave', () => {
        img.style.transform = '';
      });
    });
  }

  const rockQuotes = [
    '"Musik är det enda språket som inte behöver översättas." — Okänd',
    '"Rock \'n\' roll är inte bara musik, det är ett sätt att leva." — Erik Lindqvist',
    '"En bra refräng kan förändra ett liv." — Johan Berg',
    '"Scenen är vårt andra hem." — Anders Ström',
    '"Gitarren pratar när orden tar slut." — Mikael Dahl',
  ];

  function initQuoteTicker() {
    const ticker = document.createElement('div');
    ticker.id = 'sw-quote-ticker';
    document.body.appendChild(ticker);

    let index = 0;
    function showQuote() {
      ticker.textContent = rockQuotes[index % rockQuotes.length];
      ticker.classList.add('sw-show');
      setTimeout(() => ticker.classList.remove('sw-show'), 5000);
      index++;
    }
    setTimeout(showQuote, 4000);
    setInterval(showQuote, 25000);
  }

  function initVisitorCounter() {
    let count = parseInt(localStorage.getItem('sw-visits') || '0', 10);
    count++;
    localStorage.setItem('sw-visits', String(count));
    if (count === 1) {
      console.log('%cVälkommen för första gången! 🎸', 'color:#d9b85c; font-size:14px;');
    } else {
      console.log(`%cVälkommen tillbaka! Detta är ditt besök nummer ${count}.`, 'color:#d9b85c; font-size:14px;');
    }
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      unlockAchievement('nightOwl');
    }
  }

  function initConsoleAPI() {
    window.SOH = {
      confetti: () => spawnConfetti(window.innerWidth / 2, window.innerHeight / 2, 100),
      matrix: activateMatrixMode,
      disco: activateDiscoMode,
      party: activatePartyMode,
      metal: activateMetalMode,
      banana: activateBananaEgg,
      rick: activateRickroll,
      retro: activateRetroMode,
      contrast: activateContrastMode,
      game: activateMiniGame,
      achievements: () => JSON.parse(localStorage.getItem('sw-achievements') || '{}'),
      visits: () => parseInt(localStorage.getItem('sw-visits') || '0', 10),
      reset: resetAllModes,
      help: () => {
        console.log('%cTillgängliga kommandon:', 'color:#d9b85c; font-weight:bold;');
        console.log('SOH.confetti()');
        console.log('SOH.matrix()');
        console.log('SOH.disco()');
        console.log('SOH.party()');
        console.log('SOH.metal()');
        console.log('SOH.banana()');
        console.log('SOH.rick()');
        console.log('SOH.retro()');
        console.log('SOH.contrast()');
        console.log('SOH.game()');
        console.log('SOH.achievements()');
        console.log('SOH.visits()');
        console.log('SOH.reset()');
      },
    };
    console.log('%cPsst... testa SOH.help() i konsolen 👀', 'color:#cfcfd4; font-style:italic;');
  }

  function initDoubleClickFirework() {
    document.addEventListener('dblclick', (e) => {
      if (e.target.closest('input, textarea, button, a, th')) return;
      spawnConfetti(e.clientX, e.clientY, 50);
    });
  }

  function initAuroraBackground() {
    if (prefersReducedMotion) return;
    const aurora = document.createElement('div');
    aurora.id = 'sw-aurora';
    document.body.prepend(aurora);
  }

  function initImageLightbox() {
    const images = $$('.card img, .hero img');
    if (!images.length) return;

    const overlay = document.createElement('div');
    overlay.id = 'sw-lightbox';
    overlay.innerHTML = `<img src="" alt=""><button type="button" id="sw-lightbox-close">&times;</button>`;
    document.body.appendChild(overlay);

    const bigImg = $('img', overlay);
    const closeBtn = $('#sw-lightbox-close', overlay);

    images.forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        bigImg.src = img.src;
        bigImg.alt = img.alt;
        overlay.classList.add('sw-open');
      });
    });

    function close() { overlay.classList.remove('sw-open'); }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  function initCardLongPress() {
    $$('.card').forEach((card) => {
      let pressTimer = null;
      const start = () => {
        pressTimer = setTimeout(() => {
          card.classList.add('sw-shimmer');
          setTimeout(() => card.classList.remove('sw-shimmer'), 1000);
        }, 500);
      };
      const cancel = () => clearTimeout(pressTimer);
      card.addEventListener('mousedown', start);
      card.addEventListener('mouseup', cancel);
      card.addEventListener('mouseleave', cancel);
      card.addEventListener('touchstart', start);
      card.addEventListener('touchend', cancel);
    });
  }

  function initGlitchLogo() {
    const logo = $('.logo');
    if (!logo || prefersReducedMotion) return;
    const original = logo.textContent;
    const glitchChars = '!<>-_\\/[]{}—=+*^?#________';

    logo.addEventListener('mouseenter', () => {
      let iterations = 0;
      const interval = setInterval(() => {
        logo.textContent = original
          .split('')
          .map((char, index) => {
            if (index < iterations) return original[index];
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join('');
        iterations += 0.5;
        if (iterations >= original.length) {
          clearInterval(interval);
          logo.textContent = original;
        }
      }, 35);
    });
  }

  function initConsolePuzzle() {
    console.log('%c🔍 Hittade du alla hemligheter?', 'color:#d9b85c;font-size:14px;');
    console.log('%cLedtråd 1: Skriv ett ord på tangentbordet medan du är på sidan...', 'color:#8a8a90;');
    console.log('%cLedtråd 2: Vissa stjärnor gömmer sig i mörkret 🌟', 'color:#8a8a90;');
    console.log('%cLedtråd 3: Gamla tangentbordskoder lever vidare... ↑↑↓↓←→←→BA', 'color:#8a8a90;');
  }

  function initGuestbook() {
    let name = localStorage.getItem('sw-guest-name');
    if (!name) {
      setTimeout(() => {
        name = prompt('🎤 Välkommen backstage! Vad heter du?');
        if (name) {
          localStorage.setItem('sw-guest-name', name);
          console.log(`%cTrevligt att träffas, ${name}! 🤘`, 'color:#d9b85c;');
        }
      }, 3000);
    } else {
      console.log(`%cVälkommen tillbaka, ${name}! 🤘`, 'color:#d9b85c;');
    }
  }

  function initFooterEasterEgg() {
    const footer = $('footer');
    if (!footer) return;
    footer.addEventListener('click', (e) => {
      if (e.detail === 3) {
        spawnConfetti(window.innerWidth / 2, window.innerHeight - 50, 60);
      }
    });
  }

  injectGlobalStyles();
  injectExtraStyles();

  ready(function () {
    initPageLoad();
    initStarfield();
    initScrollProgress();
    initHeader();
    initSmoothScroll();
    initScrollReveal();
    initCardTilt();
    initHeroParallax();
    initTypewriter();
    initBackToTop();
    initTrackListToggle();
    initTableSort();
    initCustomCursor();
    initLogoEasterEgg();
    initKonamiCode();
    initFooterYear();
    initActiveNav();
    initMemberModal();
    initCounterAnimation();
    initA11y();

    initAuroraBackground();
    initMouseTrail();
    initButtonRipple();
    initSecretWordDetector();
    initIdleScreensaver();
    initTitleFlash();
    initLogoClickCounter();
    initStarHunt();
    initScrollMilestones();
    initFastScrollDetector();
    initFakeVisualizer();
    initVinylSpin();
    initQuoteTicker();
    initVisitorCounter();
    initConsoleAPI();
    initDoubleClickFirework();
    initImageLightbox();
    initCardLongPress();
    initGlitchLogo();
    initConsolePuzzle();
    initGuestbook();
    initFooterEasterEgg();
  });
})(); 