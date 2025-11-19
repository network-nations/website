// js/main-scripts.js

// --- 1. SHARED UTILS ---

function getColor(colorName) {
    const style = getComputedStyle(document.body);
    return style.getPropertyValue(`--${colorName}`).trim();
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.remove('light-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// --- 2. RHIZOMATIC NETWORK ANIMATION ---

const canvas = document.getElementById('networkCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Configuration for organic feel
const config = {
    nodeCount: 0, // Calculated based on screen size
    connectionDistance: 120,
    baseVelocity: 0.15,
    pulseSpeed: 0.02,
    signalProbability: 0.005 // Chance for a neuron signal to fire
};

let width, height;
const nodes = [];
const signals = [];

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // Random drift velocity
        this.vx = (Math.random() - 0.5) * config.baseVelocity;
        this.vy = (Math.random() - 0.5) * config.baseVelocity;
        this.radius = Math.random() * 2 + 1.5; // Slightly larger nodes
        this.pulse = Math.random() * Math.PI; // Random phase
    }

    update() {
        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Bounce gently off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Pulse effect
        this.pulse += config.pulseSpeed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // Use new faint node color with better visibility
        ctx.fillStyle = getColor('node-color');
        ctx.globalAlpha = 0.7 + Math.sin(this.pulse) * 0.3; // More visible breathing alpha
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Signal {
    constructor(startNode, endNode) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.progress = 0;
        this.speed = 0.02 + Math.random() * 0.02;
        this.alive = true;
    }

    update() {
        this.progress += this.speed;
        if (this.progress >= 1) this.alive = false;
    }

    draw() {
        const x = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
        const y = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2); // Smaller signal dot
        ctx.fillStyle = getColor('primary-color'); // Orange "synapses"
        ctx.globalAlpha = 0.5; // Less bright
        ctx.shadowBlur = 3; // Reduced glow
        ctx.shadowColor = getColor('primary-color');
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
}

function resizeCanvas() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initNodes();
}

function initNodes() {
    nodes.length = 0;
    // Density calculation: 1 node per 8000px sq (approx)
    const density = 9000;
    config.nodeCount = Math.floor((width * height) / density);

    for (let i = 0; i < config.nodeCount; i++) {
        nodes.push(new Node(Math.random() * width, Math.random() * height));
    }
}

function animateRhizome() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const lineColor = getColor('line-color');

    // Update and Draw Nodes
    nodes.forEach(node => {
        node.update();
        node.draw();
    });

    // Draw Connections & Signals
    ctx.lineWidth = 0.8;
    
    for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
            const nodeB = nodes[j];
            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            const distSq = dx * dx + dy * dy;
            const distThresholdSq = config.connectionDistance * config.connectionDistance;

            if (distSq < distThresholdSq) {
                // Calculate opacity based on distance (fade out at range limit)
                const opacity = 1 - (distSq / distThresholdSq);
                
                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                ctx.lineTo(nodeB.x, nodeB.y);
                ctx.strokeStyle = lineColor;
                ctx.globalAlpha = opacity * 0.4; // Subtle lines
                ctx.stroke();
                ctx.globalAlpha = 1.0;

                // Chance to spawn a signal on this connection
                if (Math.random() < config.signalProbability) {
                    signals.push(new Signal(nodeA, nodeB));
                }
            }
        }
    }

    // Update and Draw Signals
    for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        // Check if connection still exists (distance check)
        const dx = sig.startNode.x - sig.endNode.x;
        const dy = sig.startNode.y - sig.endNode.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > config.connectionDistance * config.connectionDistance) {
            sig.alive = false;
        }

        if (sig.alive) {
            sig.update();
            sig.draw();
        } else {
            signals.splice(i, 1);
        }
    }

    requestAnimationFrame(animateRhizome);
}

// --- 3. PAGE INTERACTION ---

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Shared Initialization ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    const storedTheme = localStorage.getItem('theme');
    const preferredScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    setTheme(storedTheme || preferredScheme);
    
    if (canvas) {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animateRhizome();
    }

    // --- Index Page Specific Logic ---
    const cardContainer = document.getElementById('card-container');
    if (cardContainer) {
        const cards = document.querySelectorAll('.card');
        const toggleExpand = document.getElementById('toggleExpand');
        if (toggleExpand) {
            toggleExpand.addEventListener('change', function() {
                const isExpanded = this.checked;
                cards.forEach(card => card.classList.toggle('expanded', isExpanded));
            });
        }
        cards.forEach(card => {
            card.addEventListener('click', function(e) {
                if (e.target.tagName.toLowerCase() === 'a') return;
                this.classList.toggle('expanded');
            });
        });
        
        // Carousel Logic
        const track = document.querySelector('.carousel-track');
        const nav = document.querySelector('.carousel-nav');
        const nextButton = document.querySelector('.carousel-button.next');
        const prevButton = document.querySelector('.carousel-button.prev');
        if (track && nav && nextButton && prevButton) {
            let currentIndex = 0;
            const updateCarousel = () => {
                 const slides = Array.from(track.children);
                 const dots = Array.from(nav.children);
                 if (slides.length === 0) return;
                 if (currentIndex < 0) currentIndex = slides.length - 1;
                 if (currentIndex >= slides.length) currentIndex = 0;
                 track.style.transform = `translateX(-${currentIndex * 100}%)`;
                 const currentDot = nav.querySelector('.current-slide');
                 if(currentDot) currentDot.classList.remove('current-slide');
                 if(dots[currentIndex]) dots[currentIndex].classList.add('current-slide');
            };
            updateCarousel(); 
            prevButton.addEventListener('click', () => { currentIndex--; updateCarousel(); });
            nextButton.addEventListener('click', () => { currentIndex++; updateCarousel(); });
            nav.addEventListener('click', e => {
                const targetDot = e.target.closest('button.carousel-indicator');
                if (!targetDot) return;
                currentIndex = Array.from(nav.children).indexOf(targetDot);
                updateCarousel();
            });
             document.addEventListener('keydown', e => {
                const carousel = e.target.closest('.carousel');
                 if (carousel || document.activeElement === document.body) {
                    if (e.key === 'ArrowLeft') { currentIndex--; updateCarousel(); } 
                    else if (e.key === 'ArrowRight') { currentIndex++; updateCarousel(); }
                }
            });
        }
    }
});