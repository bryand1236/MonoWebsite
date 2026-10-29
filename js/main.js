/**
 * MONO Main Application Logic
 * Brand: MONO - Move On, Never Ordinary
 * Contact: +62 852-4021-1742 (Reno) | IG: @mono_.time
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const RENO_WHATSAPP = '6285240211742';

  // 0. CUTE MASCOT INTRO LOADER ANIMATION
  const introOverlay = document.getElementById('mascot-intro-overlay');
  if (introOverlay) {
    // Play subtle friendly beep when watch shines
    setTimeout(() => {
      if (window.MonoWatch3D && typeof window.MonoWatch3D.playBeep === 'function') {
        window.MonoWatch3D.playBeep(3800, 0.08);
      }
    }, 450);

    setTimeout(() => {
      if (window.MonoWatch3D && typeof window.MonoWatch3D.playBeep === 'function') {
        window.MonoWatch3D.playBeep(4800, 0.05);
      }
    }, 950);

    // Dismiss overlay smoothly after progress completes, then trigger cascading page reveal
    setTimeout(() => {
      introOverlay.classList.add('intro-dismissed');
      document.body.classList.remove('intro-active');
      document.body.classList.add('page-revealed');

      setTimeout(() => {
        if (introOverlay.parentNode) {
          introOverlay.parentNode.removeChild(introOverlay);
        }
      }, 700);
    }, 1800);
  } else {
    document.body.classList.remove('intro-active');
    document.body.classList.add('page-revealed');
  }

  // 1. MOBILE MENU TOGGLE
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const isOpen = mobileMenu.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
      });
    });
  }

  // 1b. NAVBAR HIDE ON SCROLL DOWN, SHOW ON SCROLL UP
  const siteHeader = document.querySelector('header.site-header');
  if (siteHeader) {
    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    let ticking = false;

    function onScroll() {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const diff = currentScrollY - lastScrollY;

      // Shadow when scrolled down
      if (currentScrollY > 20) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }

      // Hide when scrolling down past top zone (80px), show immediately when scrolling up
      if (currentScrollY <= 80) {
        siteHeader.classList.remove('nav-hidden');
      } else if (diff > 5) {
        // Scrolling downwards
        siteHeader.classList.add('nav-hidden');
      } else if (diff < -5) {
        // Scrolling upwards
        siteHeader.classList.remove('nav-hidden');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  // 1c. ACTIVE NAV LINK HIGHLIGHT ON SCROLL (SPY)
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"], .mobile-menu a[href^="#"]');
  const sections = Array.from(document.querySelectorAll('section[id]'));

  function updateActiveNavLink() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
    const headerOffset = 140; // Offset for fixed navbar + breathing room

    let currentSectionId = '';

    // If near bottom of the page, activate the last section (e.g. contact)
    const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60);

    if (isAtBottom && sections.length > 0) {
      currentSectionId = sections[sections.length - 1].getAttribute('id');
    } else {
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - headerOffset;
        const sectionHeight = section.offsetHeight;
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          currentSectionId = section.getAttribute('id');
        }
      });
    }

    if (currentSectionId) {
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === `#${currentSectionId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });
  // Initial check on page load
  updateActiveNavLink();

  // 2. 3D COLOR SWATCH SELECTORS
  const swatchButtons = document.querySelectorAll('.color-swatch-btn');
  const colorNameMap = {
    blue: 'Cobalt Sky (Signature MONO)',
    red: 'Crimson Flame',
    mint: 'Mint Breeze',
    white: 'Glacier White',
    black: 'Stealth Black',
    capsule_black: 'Capsule Noir'
  };
  const preorderVariant = document.getElementById('preorder-variant');

  swatchButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      if (window.MonoWatch3D && color) {
        // Remove active from ALL swatches across both groups
        swatchButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Update the correct selected-name label
        const isCapsule = color.startsWith('capsule');
        const boxLabel = document.getElementById('selected-color-name');
        const capsuleLabel = document.getElementById('selected-capsule-name');
        if (isCapsule && capsuleLabel) {
          capsuleLabel.textContent = colorNameMap[color] || color;
          if (boxLabel) boxLabel.textContent = '—';
        } else if (boxLabel) {
          boxLabel.textContent = colorNameMap[color] || color;
          if (capsuleLabel) capsuleLabel.textContent = '—';
        }

        window.MonoWatch3D.switchColor(color);
        if (preorderVariant && colorNameMap[color]) {
          preorderVariant.value = color;
        }
      }
    });
  });

  // 2b. PREORDER REQUEST VIA WHATSAPP (PERSISTENCE CAN BE ADDED LATER)
  const preorderForm = document.getElementById('preorder-form');
  if (preorderForm) {
    preorderForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!preorderForm.reportValidity()) return;

      const formData = new FormData(preorderForm);
      const variant = String(formData.get('variant') || '');
      const variantName = colorNameMap[variant];
      const edition = variant.startsWith('capsule') ? 'Capsule Edition' : 'Box Edition';
      const status = document.getElementById('preorder-status');
      if (!variantName) {
        if (status) status.textContent = 'Please select a valid watch edition and color.';
        return;
      }

      const details = [
        'Hello MONO Time! I’d like to preorder a watch.',
        '',
        `Name: ${String(formData.get('name') || '').trim()}`,
        `WhatsApp: ${String(formData.get('phone') || '').trim()}`,
        `Watch: ${edition} — ${variantName}`,
        `Quantity: ${String(formData.get('quantity') || '')}`,
        `Delivery city / area: ${String(formData.get('city') || '').trim()}`
      ];
      const email = String(formData.get('email') || '').trim();
      const notes = String(formData.get('notes') || '').trim();
      if (email) details.push(`Email: ${email}`);
      if (notes) details.push(`Notes: ${notes}`);
      details.push('', 'I understand this request is not confirmed until MONO replies.');

      const waUrl = `https://wa.me/${RENO_WHATSAPP}?text=${encodeURIComponent(details.join('\n'))}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (status) {
        status.textContent = 'Your preorder message is ready. Send it in WhatsApp to contact MONO. Nothing has been saved on this website. ';
        const fallbackLink = document.createElement('a');
        fallbackLink.href = waUrl;
        fallbackLink.target = '_blank';
        fallbackLink.rel = 'noopener noreferrer';
        fallbackLink.textContent = 'Open WhatsApp';
        status.append(fallbackLink);
      }
    });
  }

  // 3. 3D CHASSIS TOGGLE (Classic Box vs Capsule Oval)
  const chassisOptions = document.querySelectorAll('.model-chassis-toggle .toggle-option');
  chassisOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const chassis = btn.dataset.chassis;
      if (window.MonoWatch3D && chassis) {
        chassisOptions.forEach((o) => o.classList.remove('active'));
        btn.classList.add('active');
        window.MonoWatch3D.switchChassis(chassis);
      }
    });
  });

  // 4. 3D STUDIO ACTION BUTTONS
  const btnToggleMode = document.getElementById('btn-toggle-mode');
  if (btnToggleMode) {
    btnToggleMode.addEventListener('click', () => {
      if (window.MonoWatch3D) {
        window.MonoWatch3D.toggleMode();
      }
    });
  }

  const btnResetCam = document.getElementById('btn-reset-cam');
  if (btnResetCam) {
    btnResetCam.addEventListener('click', () => {
      if (window.MonoWatch3D) window.MonoWatch3D.resetCamera();
    });
  }

  const btnAutoRotate = document.getElementById('btn-auto-rotate');
  if (btnAutoRotate) {
    btnAutoRotate.addEventListener('click', () => {
      if (window.MonoWatch3D) window.MonoWatch3D.toggleAutoRotate();
    });
  }

  // 5. DIRECT CONTACT VIA WHATSAPP (NO E-COMMERCE / NO SALES CARTS)
  window.contactRenoWhatsApp = function (topic = 'general') {
    let message = '';
    const selectedColorName = document.getElementById('selected-color-name')?.innerText || 'Cobalt Sky';

    if (topic === 'color') {
      message = `Hello MONO Time! 👋\nI'm checking out the 3D view of the MONO watch in *${selectedColorName}* on the website.\n\nCould I ask about stock availability & this color? Thanks! 🔥 #MoveOnNeverOrdinary`;
    } else {
      message = `Hello MONO Time! 👋\nI'd like to ask about the MONO digital keychain watch. Thanks! 🔥 #MoveOnNeverOrdinary`;
    }

    if (window.MonoWatch3D) {
      window.MonoWatch3D.playBeep(4200, 0.08);
    }

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${RENO_WHATSAPP}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  // 6. COPY PHONE NUMBER HELPER
  window.copyPhoneNumber = function (btnElement) {
    const phone = '0852-4021-1742';
    navigator.clipboard.writeText(phone).then(() => {
      if (btnElement) {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="bi bi-check-circle-fill" style="margin-right: 6px;"></i><span>Copied!</span>';
        btnElement.classList.add('copied');
        setTimeout(() => {
          btnElement.innerHTML = originalText;
          btnElement.classList.remove('copied');
        }, 2200);
      }
      if (window.MonoWatch3D) {
        window.MonoWatch3D.playBeep(3500, 0.05);
      }
    }).catch(() => {
      alert('Official contact number: ' + phone);
    });
  };

  // 8. SCROLL EFFECTS: LINEUP WATCHES POPPING UP & CONTINUOUSLY ASCENDING UPWARDS
  const catapultWatches = document.querySelectorAll('.catapult-watch');
  if (catapultWatches.length > 0) {
    let ticking = false;

    function handleScrollCatapult() {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const scrollProgress = scrollY / maxScroll; // 0 to 1

      catapultWatches.forEach((watch) => {
        const trigger = parseFloat(watch.dataset.trigger) || 0.1;
        const appearStart = trigger - 0.05;
        const popFull = trigger;

        if (scrollProgress < appearStart) {
          // Below viewport waiting to appear
          watch.classList.remove('is-active', 'is-ascending', 'is-out-of-view');
        } else if (scrollProgress >= appearStart && scrollProgress <= popFull) {
          // In the popping up phase into full view
          watch.classList.add('is-active');
          watch.classList.remove('is-ascending', 'is-out-of-view');
        } else {
          // Has already shown up: as user scrolls more down, it travels continuously UP and into the depth
          const delta = (scrollProgress - popFull) / (1 - popFull); // 0 to 1+
          
          // Move up in Y (pixels/vh equivalent)
          const moveY = -delta * (window.innerHeight * 1.35); // goes up well past the top
          // Depth pushes back
          const moveZ = 150 - delta * 750;
          // Scale shrinks from large (1.35) down towards distant perspective
          const scale = Math.max(0.22, 1.35 - delta * 1.05);
          // Rotation tilts further
          const rotOffset = (watch.classList.contains('side-left') ? -delta * 40 : delta * 40);
          // Lateral drift slightly outwards
          const moveX = (watch.classList.contains('side-left') ? -delta * 80 : delta * 80);

          watch.style.setProperty('--ascend-x', `${moveX}px`);
          watch.style.setProperty('--ascend-y', `${moveY}px`);
          watch.style.setProperty('--ascend-z', `${moveZ}px`);
          watch.style.setProperty('--ascend-scale', scale);
          watch.style.setProperty('--ascend-rot', `${rotOffset}deg`);

          // Only fade out when completely past the top of the screen!
          // Watch element bottom position approx:
          const rect = watch.getBoundingClientRect();
          if (rect.bottom < -20) {
            watch.classList.remove('is-active', 'is-ascending');
            watch.classList.add('is-out-of-view');
          } else {
            watch.classList.remove('is-active', 'is-out-of-view');
            watch.classList.add('is-ascending');
          }
        }
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScrollCatapult);
        ticking = true;
      }
    }, { passive: true });

    // Initial check
    handleScrollCatapult();
  }
});
