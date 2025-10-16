/* ========================================
   BLITZ LANDING PAGE - FINAL PERFECTION
   All tweaks + New structure
   ======================================== */

// ========================================
// CURSOR TRAIL EFFECT - BUBBLES ARE BACK!
// ========================================

const canvas = document.getElementById('cursorCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

if (canvas && ctx) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 60; // MORE BUBBLES! 🫧

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 3 + 1; // Nice bubble size
      this.speedX = Math.random() * 2 - 1;
      this.speedY = Math.random() * 2 - 1;
      this.life = 1;
      this.decay = Math.random() * 0.02 + 0.01; // Slower decay
      this.color = `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '6, 182, 212'}, ${this.life * 0.5})`; // Better opacity
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;
      this.color = `rgba(${Math.random() > 0.5 ? '139, 92, 246' : '6, 182, 212'}, ${this.life * 0.5})`;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // NO shadowBlur - clean bubbles without glow! ✨
    }
  }

  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Create bubbles on EVERY mouse move! 🫧
    if (particles.length < particleCount) {
      particles.push(new Particle(mouseX, mouseY));
    }
  });

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((particle, index) => {
      particle.update();
      particle.draw();
      
      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    });
    
    requestAnimationFrame(animateParticles);
  }

  animateParticles();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}


// ========================================
// SPOTLIGHT FOLLOW CURSOR - SUBTLE
// ========================================

const spotlight = document.getElementById('spotlight');

if (spotlight) {
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    
    spotlight.style.left = `${x - 300}px`;
    spotlight.style.top = `${y - 300}px`;
  });
}

// ========================================
// PARTICLES BACKGROUND
// ========================================

const particlesContainer = document.getElementById('particles');

if (particlesContainer) {
  for (let i = 0; i < 80; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = `${Math.random() * 3 + 1}px`;
    particle.style.height = particle.style.width;
    particle.style.background = Math.random() > 0.5 
      ? 'rgba(139, 92, 246, 0.4)' 
      : 'rgba(6, 182, 212, 0.4)';
    particle.style.borderRadius = '50%';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.filter = 'blur(1px)';
    particle.style.animation = `float-particle ${Math.random() * 20 + 10}s linear infinite`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    particlesContainer.appendChild(particle);
  }
}

// Add particle animation
const particleStyle = document.createElement('style');
particleStyle.textContent = `
  @keyframes float-particle {
    0% { 
      transform: translate(0, 0) scale(1); 
      opacity: 0;
    }
    10% { opacity: 0.6; }
    90% { opacity: 0.6; }
    100% { 
      transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(0); 
      opacity: 0;
    }
  }
`;
document.head.appendChild(particleStyle);

// ========================================
// MOBILE NAVIGATION TOGGLE
// ========================================

const nav = document.querySelector('.nav ul');
const header = document.querySelector('.header-content');

const toggleBtn = document.createElement('button');
toggleBtn.textContent = '☰';
toggleBtn.classList.add('nav-toggle');
toggleBtn.setAttribute('aria-label', 'Toggle navigation');
toggleBtn.setAttribute('aria-expanded', 'false');

header.insertBefore(toggleBtn, nav);

toggleBtn.addEventListener('click', () => {
  const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
  
  nav.classList.toggle('show');
  toggleBtn.setAttribute('aria-expanded', !isExpanded);
  toggleBtn.textContent = nav.classList.contains('show') ? '✕' : '☰';
  
  toggleBtn.style.transform = nav.classList.contains('show') ? 'rotate(90deg)' : 'rotate(0deg)';
});

// Close nav on outside click
document.addEventListener('click', (e) => {
  if (!nav.contains(e.target) && !toggleBtn.contains(e.target)) {
    nav.classList.remove('show');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.textContent = '☰';
    toggleBtn.style.transform = 'rotate(0deg)';
  }
});

// ========================================
// SMOOTH SCROLL & ACTIVE NAV
// ========================================

const navLinks = document.querySelectorAll('.nav-link, a[href^="#"]');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    
    if (href && href.startsWith('#')) {
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        // Close mobile nav
        nav.classList.remove('show');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.textContent = '☰';
        toggleBtn.style.transform = 'rotate(0deg)';
        
        // Smooth scroll
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update URL
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      }
    }
  });
});

// Active section highlighting
const sections = document.querySelectorAll('section[id]');

function highlightActiveSection() {
  const scrollY = window.pageYOffset;
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 200;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');
    
    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

let scrollTimeout;
window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    cancelAnimationFrame(scrollTimeout);
  }
  scrollTimeout = requestAnimationFrame(highlightActiveSection);
});

// ========================================
// MAGNETIC BUTTONS
// ========================================

const magneticButtons = document.querySelectorAll('.magnetic');

magneticButtons.forEach(button => {
  button.addEventListener('mousemove', (e) => {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const strength = 0.3;
    button.style.transform = `translate(${x * strength}px, ${y * strength}px) scale(1.05)`;
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translate(0, 0) scale(1)';
  });
});

// ========================================
// BENTO GRID 3D HOVER
// ========================================

const bentoCards = document.querySelectorAll('.bento-card');

bentoCards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) translateZ(20px)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ========================================
// INTERSECTION OBSERVER - SCROLL REVEALS
// ========================================

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const revealElements = document.querySelectorAll(`
  .bento-card,
  .premium-hero-card,
  .designer-plate,
  .neuro-card,
  .testimonial-float-card
`);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0) scale(1)';
      }, index * 50);
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(50px) scale(0.95)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  revealObserver.observe(el);
});

// ========================================
// HERO STATS COUNTER ANIMATION
// ========================================

const statNumbers = document.querySelectorAll('.stat-number');

function animateCounter(element) {
  const target = element.textContent.trim();
  const isPercent = target.includes('%');
  const numericValue = parseInt(target.replace(/\D/g, ''), 10);
  
  if (isNaN(numericValue)) return;
  
  let current = 0;
  const increment = numericValue / 50;
  const duration = 2000;
  const stepTime = duration / 50;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= numericValue) {
      current = numericValue;
      clearInterval(timer);
    }
    element.textContent = isPercent ? `${Math.floor(current)}%` : Math.floor(current);
  }, stepTime);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(stat => statsObserver.observe(stat));

// ========================================
// MOCKUP WINDOW 3D TILT
// ========================================

const mockupWindows = document.querySelectorAll('.mockup-window');

mockupWindows.forEach(window => {
  const card = window.closest('.premium-hero-card');
  
  if (card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateY = (x - centerX) / 40;
      const rotateX = (centerY - y) / 40;
      
      window.style.transform = `perspective(1500px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(20px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      window.style.transform = 'perspective(1500px) rotateY(0deg) rotateX(0deg) translateZ(0)';
    });
  }
});

// ========================================
// DESIGNER PLATE HOVER EFFECTS
// ========================================

const designerPlates = document.querySelectorAll('.designer-plate');

designerPlates.forEach(plate => {
  plate.addEventListener('mouseenter', function() {
    const icon = this.querySelector('.plate-icon');
    if (icon) {
      icon.style.transform = 'scale(1.15) rotate(5deg)';
    }
  });
  
  plate.addEventListener('mouseleave', function() {
    const icon = this.querySelector('.plate-icon');
    if (icon) {
      icon.style.transform = '';
    }
  });
});

// ========================================
// BUTTON RIPPLE EFFECT
// ========================================

const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
  button.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.5)';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'ripple-effect 0.6s ease-out';
    
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
});

const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple-effect {
    to {
      width: 500px;
      height: 500px;
      opacity: 0;
    }
  }
`;
document.head.appendChild(rippleStyle);

// ========================================
// TESTIMONIAL AUTO-ROTATION
// ========================================

const testimonialCards = document.querySelectorAll('.testimonial-float-card');
let currentTestimonial = 0;

function rotateTestimonialHighlight() {
  testimonialCards.forEach((card, index) => {
    if (index === currentTestimonial) {
      card.style.borderColor = 'var(--purple-primary)';
      card.style.boxShadow = '0 30px 80px rgba(139, 92, 246, 0.4), 0 0 100px rgba(139, 92, 246, 0.25)';
      card.style.transform = 'translateY(-25px) scale(1.05)';
    } else {
      card.style.borderColor = '';
      card.style.boxShadow = '';
      card.style.transform = '';
    }
  });
  
  currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
}

if (testimonialCards.length > 0) {
  setInterval(rotateTestimonialHighlight, 4000);
}

// ========================================
// PARALLAX SCROLL EFFECTS
// ========================================

const parallaxElements = document.querySelectorAll('.hero-aurora, .card-aurora, .cta-aurora-bg');

window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  
  parallaxElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const speed = 0.3;
      const yPos = -(scrolled * speed);
      el.style.transform = `translateY(${yPos}px) scale(1.1)`;
    }
  });
});

// ========================================
// FLOATING ICONS PARALLAX
// ========================================

const floatingIcons = document.querySelectorAll('.float-icon');

window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  
  floatingIcons.forEach((icon, index) => {
    const speed = 0.1 + (index * 0.02);
    const yPos = scrolled * speed;
    const initialY = parseFloat(getComputedStyle(icon).top);
    icon.style.top = `calc(var(--y) + ${yPos}px)`;
  });
});

// ========================================
// GRADIENT TEXT SHIMMER
// ========================================

const gradientTexts = document.querySelectorAll('.gradient-flow');

gradientTexts.forEach(text => {
  text.addEventListener('mouseenter', function() {
    this.style.animationDuration = '3s';
    this.style.backgroundSize = '400% 400%';
  });
  
  text.addEventListener('mouseleave', function() {
    this.style.animationDuration = '8s';
    this.style.backgroundSize = '300% 300%';
  });
});

// ========================================
// LAZY LOAD IMAGES
// ========================================

const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      imageObserver.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));

// ========================================
// KEYBOARD ACCESSIBILITY
// ========================================

document.addEventListener('keydown', (e) => {
  // Escape to close mobile nav
  if (e.key === 'Escape' && nav.classList.contains('show')) {
    nav.classList.remove('show');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.textContent = '☰';
    toggleBtn.style.transform = 'rotate(0deg)';
    toggleBtn.focus();
  }
  
  // Tab navigation
  if (e.key === 'Tab') {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.style.transform = 'translate(0, 0) scale(1)';
    });
  }
});

// ========================================
// REDUCE MOTION SUPPORT
// ========================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
  document.querySelectorAll('*').forEach(el => {
    el.style.animation = 'none';
    el.style.transition = 'none';
  });
  
  if (canvas) canvas.style.display = 'none';
  if (spotlight) spotlight.style.display = 'none';
  if (particlesContainer) particlesContainer.style.display = 'none';
}

// ========================================
// INITIALIZE ON DOM READY
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🚀 BLITZ - FINAL PERFECTION', 
    'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; color: transparent;'
  );
  console.log('%c✨ All Tools at Your Fingertips', 
    'font-size: 16px; color: #c084fc; font-weight: bold;'
  );
  console.log('%c💎 Premium Tools • Designer Plates • Bento Grid', 
    'font-size: 14px; color: #06b6d4;'
  );
  console.log('%c🎨 Built with ❤️ by Tejas Parmar', 
    'font-size: 14px; color: #f472b6;'
  );
  
  // Add route-ready class
  setTimeout(() => {
    document.body.classList.add('route-ready');
  }, 100);
  
  // Initial highlight
  highlightActiveSection();
  
  // Smooth scroll
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Preload fonts
  if ('fonts' in document) {
    Promise.all([
      document.fonts.load('900 1em Montserrat'),
      document.fonts.load('600 1em Inter')
    ]).then(() => {
      console.log('%c✓ Fonts loaded', 'color: #10b981;');
    });
  }
});

// ========================================
// PERFORMANCE MONITORING
// ========================================

if ('PerformanceObserver' in window) {
  const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log(`%cLCP: ${(entry.renderTime || entry.loadTime).toFixed(2)}ms`, 'color: #06b6d4;');
      }
    }
  });
  
  try {
    perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // Not supported
  }
}

// ========================================
// EASTER EGG: KONAMI CODE
// ========================================

let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
  konamiCode.push(e.key);
  konamiCode = konamiCode.slice(-10);
  
  if (konamiCode.join(',') === konamiSequence.join(',')) {
    document.body.style.animation = 'rainbow-pulse 2s ease infinite';
    
    const easterEggStyle = document.createElement('style');
    easterEggStyle.textContent = `
      @keyframes rainbow-pulse {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
    `;
    document.head.appendChild(easterEggStyle);
    
    alert('🎉 KONAMI CODE ACTIVATED! 🚀\n\nYou found the secret! BLITZ is now in RAINBOW MODE! 🌈');
    
    setTimeout(() => {
      document.body.style.animation = '';
      easterEggStyle.remove();
    }, 10000);
  }
});

// ========================================
// END OF JAVASCRIPT - FINAL PERFECTION!
// ========================================
