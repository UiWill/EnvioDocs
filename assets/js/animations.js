// Inicializando animações para o site EnvioDocs

// Animação do Loader
document.addEventListener('DOMContentLoaded', () => {
    // Loader animation com Lottie
    const loaderAnimation = lottie.loadAnimation({
        container: document.getElementById('loaderAnimation'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://assets2.lottiefiles.com/packages/lf20_b88nh30c.json' // Uma animação de documentos/arquivos
    });

    // Remover loader após o carregamento completo
    window.addEventListener('load', () => {
        const loaderWrapper = document.querySelector('.loader-wrapper');
        setTimeout(() => {
            loaderWrapper.classList.add('loader-hidden');
        }, 1000);
    });

    // Inicializar AOS
    AOS.init({
        duration: 800,
        once: false,
        mirror: true
    });

    // Inicializar Smooth Scroll com Lenis
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // GSAP Animations
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Hero Section Animations
        gsap.to('.hero-shapes .shape', {
            y: -50,
            duration: 1.5,
            ease: 'power3.out',
            stagger: 0.2
        });

        // Text reveal animation for headlines
        gsap.utils.toArray('.animated-text').forEach(text => {
            gsap.from(text, {
                scrollTrigger: {
                    trigger: text,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                y: 50,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            });
        });

        // Section animations
        gsap.utils.toArray('section').forEach(section => {
            const elements = section.querySelectorAll('.feature, .step, .vantagem');
            
            if (elements.length) {
                gsap.from(elements, {
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                        end: 'bottom 20%',
                        toggleActions: 'play none none none'
                    },
                    y: 30,
                    opacity: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: 'power2.out'
                });
            }
        });

        // Parallax effect for background images
        gsap.utils.toArray('.parallax-bg').forEach(bg => {
            gsap.to(bg, {
                scrollTrigger: {
                    trigger: bg.parentElement,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                },
                y: -100,
                ease: 'none'
            });
        });
    }
}); 