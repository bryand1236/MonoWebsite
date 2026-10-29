/**
 * MONO Main Application Logic
 * Brand: MONO - Move On, Never Ordinary
 * Contact: +62 852-4021-1742 (Reno) | IG: @mono_.time
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const RENO_WHATSAPP = '6285240211742';

  // FLOATING LOCAL-TIME WATCHES (Top-Left Blue & Top-Right Red)
  const floatingClocks = document.querySelectorAll('.floating-mono-clock-time');
  if (floatingClocks.length > 0) {
    const clockFormatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    function updateFloatingClocks() {
      const now = new Date();
      const timeStr = clockFormatter.format(now);
      const isoStr = now.toISOString();
      floatingClocks.forEach((clock) => {
        clock.textContent = timeStr;
        clock.dateTime = isoStr;
      });
    }

    updateFloatingClocks();
    window.setInterval(updateFloatingClocks, 1000);

    // DRAGGABLE FLOATING CLOCKS
    const clockContainers = document.querySelectorAll('.floating-mono-clock');
    clockContainers.forEach((clock) => {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialLeft = 0;
      let initialTop = 0;

      function onPointerDown(e) {
        // Only react to main button click / touch
        if (e.button !== undefined && e.button !== 0) return;
        
        isDragging = true;
        clock.classList.add('is-dragging');
        clock.classList.add('has-dragged');

        // Read current computed bounding rect
        const rect = clock.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        startX = e.clientX;
        startY = e.clientY;

        // Switch to absolute positioning with pixel coordinates
        clock.style.left = `${initialLeft}px`;
        clock.style.top = `${initialTop}px`;
        clock.style.right = 'auto';
        clock.style.bottom = 'auto';

        clock.setPointerCapture(e.pointerId);
        e.preventDefault();
      }

      function onPointerMove(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // Keep inside viewport with small margin
        const rect = clock.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width - 8;
        const maxTop = window.innerHeight - rect.height - 8;

        newLeft = Math.max(8, Math.min(newLeft, maxLeft));
        newTop = Math.max(8, Math.min(newTop, maxTop));

        clock.style.left = `${newLeft}px`;
        clock.style.top = `${newTop}px`;
      }

      function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        clock.classList.remove('is-dragging');
        try {
          clock.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }

      clock.addEventListener('pointerdown', onPointerDown);
      clock.addEventListener('pointermove', onPointerMove);
      clock.addEventListener('pointerup', onPointerUp);
      clock.addEventListener('pointercancel', onPointerUp);
    });
  }

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

  // PREORDER MODAL
  const preorderModal = document.getElementById('preorder-modal');
  const preorderOpenButtons = document.querySelectorAll('.open-preorder-modal-btn');
  const preorderCloseButton = preorderModal && preorderModal.querySelector('.preorder-modal-close');
  let preorderPreviousFocus = null;

  function closePreorderModal() {
    if (!preorderModal || !preorderModal.classList.contains('is-open')) return;
    preorderModal.classList.remove('is-open');
    preorderModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('preorder-modal-open');
    if (preorderPreviousFocus instanceof HTMLElement) preorderPreviousFocus.focus();
  }

  if (preorderModal) {
    preorderOpenButtons.forEach((button) => {
      button.setAttribute('aria-controls', 'preorder-modal');
      button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('click', () => {
        preorderPreviousFocus = button;
        preorderModal.classList.add('is-open');
        preorderModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('preorder-modal-open');
        const mobileMenu = document.querySelector('.mobile-menu');
        const mobileToggle = document.querySelector('.mobile-nav-toggle');
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
        const firstField = preorderModal.querySelector('input, select, textarea') || preorderCloseButton;
        if (firstField) firstField.focus({ preventScroll: true });
      });
    });

    if (preorderCloseButton) preorderCloseButton.addEventListener('click', closePreorderModal);
    preorderModal.addEventListener('click', (event) => {
      if (event.target === preorderModal) closePreorderModal();
    });
    document.addEventListener('keydown', (event) => {
      if (!preorderModal.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        closePreorderModal();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = Array.from(preorderModal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

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
        'Halo MONO Time! Saya ingin melakukan preorder jam tangan MONO.',
        '',
        `Nama: ${String(formData.get('name') || '').trim()}`,
        `WhatsApp: ${String(formData.get('phone') || '').trim()}`,
        `Model / Varian: ${edition} — ${variantName}`,
        `Jumlah: ${String(formData.get('quantity') || '')}`
      ];
      const notes = String(formData.get('notes') || '').trim();
      if (notes) details.push(`Catatan: ${notes}`);

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

  // 9. PREORDER SHOWCASE CLOCK CYCLER / CAROUSEL
  const carouselImages = document.querySelectorAll('.preorder-carousel-img');
  const carouselDots = document.querySelectorAll('.preorder-dot');
  const carouselCaption = document.getElementById('preorder-carousel-caption');
  const carouselContainer = document.querySelector('.preorder-banner-preview');

  if (carouselImages.length > 0) {
    let activeCarouselIndex = 0;
    let carouselTimer = null;

    function showCarouselSlide(index) {
      if (index < 0 || index >= carouselImages.length) return;
      activeCarouselIndex = index;

      carouselImages.forEach((img, i) => {
        if (i === activeCarouselIndex) {
          img.classList.add('is-active');
        } else {
          img.classList.remove('is-active');
        }
      });

      carouselDots.forEach((dot, i) => {
        if (i === activeCarouselIndex) {
          dot.classList.add('is-active');
        } else {
          dot.classList.remove('is-active');
        }
      });

      if (carouselCaption) {
        const activeImg = carouselImages[activeCarouselIndex];
        const name = activeImg.dataset.name || activeImg.alt || '';
        carouselCaption.textContent = name;
      }
    }

    function nextCarouselSlide() {
      const next = (activeCarouselIndex + 1) % carouselImages.length;
      showCarouselSlide(next);
    }

    function startCarousel() {
      stopCarousel();
      carouselTimer = setInterval(nextCarouselSlide, 2600);
    }

    function stopCarousel() {
      if (carouselTimer) {
        clearInterval(carouselTimer);
        carouselTimer = null;
      }
    }

    // Dot click support
    carouselDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const targetIdx = parseInt(dot.dataset.target, 10);
        if (!isNaN(targetIdx)) {
          showCarouselSlide(targetIdx);
          startCarousel(); // reset timer on manual interaction
        }
      });
    });

    // Pause on hover
    if (carouselContainer) {
      carouselContainer.addEventListener('mouseenter', stopCarousel);
      carouselContainer.addEventListener('mouseleave', startCarousel);
    }

    startCarousel();
  }
});
