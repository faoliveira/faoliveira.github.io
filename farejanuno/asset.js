// MotionOne Animation Implementation
document.addEventListener('DOMContentLoaded', function() {
  // Check if MotionOne is available
  if (typeof Motion === 'undefined' || !Motion.animate) {
    console.warn('MotionOne library not loaded. Falling back to CSS transitions.');
    // Fallback: show content immediately if MotionOne fails to load
    const mainContent = document.querySelector('.content-wrapper');
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.transform = 'translateY(0)';
    }
    return;
  }

  // Get the main content container
  const mainContent = document.querySelector('.content-wrapper');

  if (!mainContent) {
    console.warn('Main content container not found.');
    return;
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Respect user's motion preference - show content immediately
    mainContent.style.opacity = '1';
    mainContent.style.transform = 'translateY(0)';
    return;
  }

  // Animate the main content on page load
  try {
    Motion.animate(
      mainContent,
      {
        opacity: [0, 1],
        transform: ['translateY(30px)', 'translateY(0)']
      },
      {
        duration: 0.8,
        easing: 'ease-out',
        delay: 0.2
      }
    );

    // Optional: Add subtle animation to the logo
    const logo = document.querySelector('.main-logo');
    if (logo) {
      Motion.animate(
        logo,
        {
          opacity: [0, 1],
          transform: ['scale(0.9)', 'scale(1)']
        },
        {
          duration: 0.6,
          easing: 'ease-out',
          delay: 0.4
        }
      );

      // Add a continuous "sniffing" animation to the logo
      Motion.animate(
        logo,
        {
          transform: ['rotate(0deg)', 'rotate(-2deg)', 'rotate(2deg)', 'rotate(-2deg)', 'rotate(2deg)', 'rotate(0deg)']
        },
        {
          duration: 2.5,      // Slower duration for a subtle effect
          repeat: Infinity,   // Loop forever
          delay: 1.5,         // Start after the initial animations
          easing: 'ease-in-out'
        }
      );
    }

    // Optional: Stagger animation for text elements
    const textElements = [
      '.main-title',
      '.subtitle',
      '.description',
      '.telegram-button'
    ];

    textElements.forEach((selector, index) => {
      const element = document.querySelector(selector);
      if (element) {
        Motion.animate(
          element,
          {
            opacity: [0, 1],
            transform: ['translateY(20px)', 'translateY(0)']
          },
          {
            duration: 0.6,
            easing: 'ease-out',
            delay: 0.6 + (index * 0.1)
          }
        );
      }
    });

  } catch (error) {
    console.error('Error running MotionOne animations:', error);
    // Fallback: show content immediately if animation fails
    mainContent.style.opacity = '1';
    mainContent.style.transform = 'translateY(0)';
  }
});

// Optional: Add hover animation for the Telegram button
document.addEventListener('DOMContentLoaded', function() {
  const telegramButton = document.querySelector('.telegram-button');

  if (telegramButton && typeof Motion !== 'undefined') {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      telegramButton.addEventListener('mouseenter', function() {
        try {
          Motion.animate(
            this,
            {
              transform: 'translateY(-3px) scale(1.02)'
            },
            {
              duration: 0.3,
              easing: 'ease-out'
            }
          );
        } catch (error) {
          console.error('Error in button hover animation:', error);
        }
      });

      telegramButton.addEventListener('mouseleave', function() {
        try {
          Motion.animate(
            this,
            {
              transform: 'translateY(0) scale(1)'
            },
            {
              duration: 0.3,
              easing: 'ease-out'
            }
          );
        } catch (error) {
          console.error('Error in button hover animation:', error);
        }
      });
    }
  }
});

// Optional: Add subtle parallax effect to the footer GIF on scroll
document.addEventListener('DOMContentLoaded', function() {
  const footerGif = document.querySelector('.footer-gif');

  if (footerGif && typeof Motion !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      let ticking = false;

      function updateGifPosition() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.1;

        try {
          Motion.animate(
            footerGif,
            {
              transform: `translateY(${rate}px)`
            },
            {
              duration: 0.1,
              easing: 'linear'
            }
          );
        } catch (error) {
          console.error('Error in parallax animation:', error);
        }

        ticking = false;
      }

      function requestTick() {
        if (!ticking) {
          requestAnimationFrame(updateGifPosition);
          ticking = true;
        }
      }

      window.addEventListener('scroll', requestTick);
    }
  }
});

// Utility function to handle theme changes (if needed in the future)
function handleThemeChange() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}

// Listen for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleThemeChange);

// Initialize theme on load
document.addEventListener('DOMContentLoaded', handleThemeChange);
