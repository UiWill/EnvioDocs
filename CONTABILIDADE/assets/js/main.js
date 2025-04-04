// Aguardar o carregamento do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o loader
    setTimeout(function() {
        const loader = document.querySelector('.loader-wrapper');
        loader.classList.add('loader-hidden');
    }, 1500);

    // Inicializar o menu mobile
    const hamburgerInput = document.getElementById('hamburger-input');
    const menuAberto = document.querySelector('.menu-aberto');
    const navLinks = document.querySelectorAll('.nav-menu a');

    hamburgerInput.addEventListener('change', function() {
        if (this.checked) {
            menuAberto.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            menuAberto.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Fechar o menu ao clicar em um link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburgerInput.checked = false;
            menuAberto.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Inicializar o Lenis para smooth scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Inicializar o AOS (Animate on Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Inicializar o GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Animação para a seção inicial
    gsap.from('.conteudo-inicio', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out'
    });

    // Animação para a seção sobre
    gsap.from('.textos-sobre', {
        scrollTrigger: {
            trigger: '.sobre',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: -50,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.from('.imagem-sobre', {
        scrollTrigger: {
            trigger: '.sobre',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: 50,
        duration: 1,
        ease: 'power3.out'
    });

    // Animação para as caixas de funcionalidades
    gsap.from('.box-skills', {
        scrollTrigger: {
            trigger: '.skills',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out'
    });

    // Animação para o formulário de contato
    gsap.from('.formulario-contato', {
        scrollTrigger: {
            trigger: '.contato',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: -50,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.from('.logo-contato', {
        scrollTrigger: {
            trigger: '.contato',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: 50,
        duration: 1,
        ease: 'power3.out'
    });

    // Formulário de contato
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const mensagem = document.getElementById('mensagem').value;
            
            // Aqui você pode implementar o envio do formulário
            // Por exemplo, usando fetch para enviar para um backend
            
            alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
            contactForm.reset();
        });
    }
}); 