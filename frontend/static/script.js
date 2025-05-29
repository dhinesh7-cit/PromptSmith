document.addEventListener('DOMContentLoaded', () => {
    // --- START: Existing PromptSmith Variables ---
    const userGoalInput = document.getElementById('userGoal');
    const generateButton = document.getElementById('generateButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorDisplay = document.getElementById('errorDisplay');
    const errorMessageText = document.getElementById('errorMessageText');
    const resultsSection = document.getElementById('resultsSection');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const body = document.body;
    const currentYearEl = document.getElementById('currentYear');
    const charCounterEl = document.getElementById('charCounter');
    const MAX_CHARS = 500;

    const promptElements = {
        textPrompt: document.getElementById('textPrompt'),
        imagePrompt: document.getElementById('imagePrompt'),
        codePrompt: document.getElementById('codePrompt'),
        var1TextPrompt: document.getElementById('var1TextPrompt'),
        var1ImagePrompt: document.getElementById('var1ImagePrompt'),
        var1CodePrompt: document.getElementById('var1CodePrompt'),
        var2TextPrompt: document.getElementById('var2TextPrompt'),
        var2ImagePrompt: document.getElementById('var2ImagePrompt'),
        var2CodePrompt: document.getElementById('var2CodePrompt')
    };

    const promptCardElements = {
        textPromptCard: document.getElementById('textPromptCard'),
        imagePromptCard: document.getElementById('imagePromptCard'),
        codePromptCard: document.getElementById('codePromptCard'),
        var1TextPromptCard: document.getElementById('var1TextPromptCard'),
        var1ImagePromptCard: document.getElementById('var1ImagePromptCard'),
        var1CodePromptCard: document.getElementById('var1CodePromptCard'),
        var2TextPromptCard: document.getElementById('var2TextPromptCard'),
        var2ImagePromptCard: document.getElementById('var2ImagePromptCard'),
        var2CodePromptCard: document.getElementById('var2CodePromptCard')
    };
    // --- END: Existing PromptSmith Variables ---

    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    if (userGoalInput && charCounterEl) {
        userGoalInput.addEventListener('input', () => {
            const currentLength = userGoalInput.value.length;
            charCounterEl.textContent = `${currentLength} / ${MAX_CHARS}`;
            if (currentLength > MAX_CHARS) {
                charCounterEl.style.color = 'var(--accent-error)';
                userGoalInput.style.borderColor = 'var(--accent-error)';
            } else {
                charCounterEl.style.color = 'var(--text-muted)';
                userGoalInput.style.borderColor = ''; // Reset to CSS default
            }
        });
        charCounterEl.textContent = `${userGoalInput.value.length} / ${MAX_CHARS}`;
    }

    const clipboard = new ClipboardJS('.copy-btn');
    clipboard.on('success', function(e) {
        const button = e.trigger;
        const originalIconHTML = button.querySelector('i').outerHTML;
        const originalText = button.querySelector('span').textContent;

        button.querySelector('i').className = 'fas fa-check';
        button.querySelector('span').textContent = 'Copied!';
        button.classList.add('copied');
        button.disabled = true;

        setTimeout(() => {
            if (button.querySelector('i')) button.querySelector('i').outerHTML = originalIconHTML;
            if (button.querySelector('span')) button.querySelector('span').textContent = originalText;
            button.classList.remove('copied');
            button.disabled = false;
        }, 1800);
        e.clearSelection();
    });

    clipboard.on('error', function(e) {
        const button = e.trigger;
        const originalText = button.querySelector('span') ? button.querySelector('span').textContent : 'Copy';
        if (button.querySelector('span')) button.querySelector('span').textContent = 'Error!';

        setTimeout(() => {
             if (button.querySelector('span')) button.querySelector('span').textContent = originalText;
        }, 2000);
    });


    generateButton.addEventListener('click', async () => {
        const goal = userGoalInput.value.trim();
        const currentLength = userGoalInput.value.length;

        const selectedGenerationType = document.querySelector('input[name="generationType"]:checked')?.value;
        const selectedModelType = document.querySelector('input[name="modelType"]:checked')?.value;

        if (!goal) {
            displayError('Please define your objective first.');
            userGoalInput.focus();
            return;
        }
        if (currentLength > MAX_CHARS) {
            displayError(`Objective is too long. Max ${MAX_CHARS} characters, please.`);
            userGoalInput.focus();
            return;
        }
        if (!selectedGenerationType) {
            displayError('Select a generation focus (Text, Image, or Code).');
            return;
        }
        if (!selectedModelType) {
            displayError('Select a target model.');
            return;
        }

        // console.log("User Goal:", goal);
        // console.log("Generation Type:", selectedGenerationType);
        // console.log("Model Type:", selectedModelType);

        errorDisplay.style.display = 'none';
        resultsSection.style.display = 'none';
        loadingIndicator.classList.add('visible');
        generateButton.disabled = true;
        generateButton.classList.add('loading');

        try {
            // UPDATED LINE: Changed to relative path for fetch
            const response = await fetch('/generate-prompts/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ goal: goal }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `Server Error: ${response.status}` }));
                throw new Error(errorData.detail || `Server Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            displayResults(data, selectedGenerationType);

        } catch (error) {
            console.error('[PROMPTSMITH APP] Fetch error:', error);
            displayError(error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            loadingIndicator.classList.remove('visible');
            generateButton.disabled = false;
            generateButton.classList.remove('loading');
        }
    });

    function displayError(message) {
        errorMessageText.textContent = message;
        errorDisplay.style.display = 'flex';
        resultsSection.style.display = 'none';
    }

    function displayResults(data, generationType) {
        Object.values(promptCardElements).forEach(card => {
            if(card) card.style.display = 'none';
        });

        if (generationType === 'text' || !generationType) {
            if(data.text_prompt && promptCardElements.textPromptCard) promptCardElements.textPromptCard.style.display = 'block';
            if(data.variation1_text_prompt && promptCardElements.var1TextPromptCard) promptCardElements.var1TextPromptCard.style.display = 'block';
            if(data.variation2_text_prompt && promptCardElements.var2TextPromptCard) promptCardElements.var2TextPromptCard.style.display = 'block';
        }
        if (generationType === 'image' || !generationType) {
            if(data.image_prompt && promptCardElements.imagePromptCard) promptCardElements.imagePromptCard.style.display = 'block';
            if(data.variation1_image_prompt && promptCardElements.var1ImagePromptCard) promptCardElements.var1ImagePromptCard.style.display = 'block';
            if(data.variation2_image_prompt && promptCardElements.var2ImagePromptCard) promptCardElements.var2ImagePromptCard.style.display = 'block';
        }

        promptElements.textPrompt.textContent = data.text_prompt || 'N/A';
        promptElements.imagePrompt.textContent = data.image_prompt || 'N/A';

        promptElements.var1TextPrompt.textContent = data.variation1_text_prompt || 'N/A';
        promptElements.var1ImagePrompt.textContent = data.variation1_image_prompt || 'N/A';

        promptElements.var2TextPrompt.textContent = data.variation2_text_prompt || 'N/A';
        promptElements.var2ImagePrompt.textContent = data.variation2_image_prompt || 'N/A';

        updateCodePromptField(promptElements.codePrompt, promptCardElements.codePromptCard, data.code_prompt, generationType);
        updateCodePromptField(promptElements.var1CodePrompt, promptCardElements.var1CodePromptCard, data.variation1_code_prompt, generationType);
        updateCodePromptField(promptElements.var2CodePrompt, promptCardElements.var2CodePromptCard, data.variation2_code_prompt, generationType);

        resultsSection.style.display = 'block';
        if (resultsSection.scrollIntoView) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function updateCodePromptField(element, cardElement, value, generationType) {
         if (cardElement) {
            if (value && value.toLowerCase() !== 'not applicable for code generation.' && value.trim() !== "") {
                if(element) element.textContent = value;
                if (generationType === 'code' || !generationType) {
                    cardElement.style.display = 'block';
                } else {
                    cardElement.style.display = 'none';
                }
            } else {
                if (generationType === 'code') {
                    if(element) element.textContent = 'Not applicable for code generation.';
                    cardElement.style.display = 'block';
                } else {
                    cardElement.style.display = 'none';
                }
            }
        }
    }

    // ==================================================
    // START: DYNAMIC ANIMATED BACKGROUND SCRIPT
    // ==================================================
    const dynamicBgCanvas = document.getElementById('dynamicBackgroundCanvas');
    if (dynamicBgCanvas) {
        const dynamicBgCtx = dynamicBgCanvas.getContext('2d');
        if (!dynamicBgCtx) {
            console.error("[CANVAS DEBUG] Failed to get 2D context for canvas.");
        }
        let dynamicBgAnimationFrameId;
        let currentCanvasThemeInternal = 'light'; // Default, will be updated by PromptSmith theme

        function canvasRandom(min, max) {
            return Math.random() * (max - min) + min;
        }

        function setupDynamicBackgroundCanvasDimensions() {
            dynamicBgCanvas.width = window.innerWidth;
            dynamicBgCanvas.height = window.innerHeight;
        }

        // --- Light Mode: Clouds & Birds ---
        let clouds = [];
        const MAX_CLOUDS_BG = 8;
        let birds = [];
        const MAX_BIRDS_ON_SCREEN = 5;
        const BIRD_FLOCK_SIZE_MIN = 2;
        const BIRD_FLOCK_SIZE_MAX = 4;
        let lastFlockSpawnTime = 0;
        const FLOCK_SPAWN_INTERVAL = 10000; // ms

        class CloudBG {
            constructor() {
                this.x = canvasRandom(-dynamicBgCanvas.width * 0.7, dynamicBgCanvas.width * 1.2);
                this.y = canvasRandom(dynamicBgCanvas.height * 0.05, dynamicBgCanvas.height * 0.35);
                this.speed = canvasRandom(0.01, 0.04); // Very slow
                this.puffs = [];
                this.opacity = canvasRandom(1, 1);
                this.baseWidth = canvasRandom(180, 400);
                this.baseHeight = canvasRandom(60, 120);

                const numCorePuffs = Math.floor(canvasRandom(5, 8));
                for (let i = 0; i < numCorePuffs; i++) {
                    const offsetX = canvasRandom(-this.baseWidth * 0.45, this.baseWidth * 0.45);
                    const offsetY = canvasRandom(-this.baseHeight * 0.35, this.baseHeight * 0.35);
                    const radiusX = canvasRandom(this.baseWidth * 0.2, this.baseWidth * 0.4);
                    const radiusY = canvasRandom(this.baseHeight * 0.25, this.baseHeight * 0.55);
                    this.puffs.push({ offsetX, offsetY, radiusX, radiusY });
                }
                const numDetailPuffs = Math.floor(canvasRandom(4, 7));
                for (let i = 0; i < numDetailPuffs; i++) {
                    const corePuffIndex = Math.floor(canvasRandom(0, numCorePuffs));
                    const corePuff = this.puffs[corePuffIndex];
                     if (!corePuff) continue;
                    const sidePlacement = Math.random() < 0.5 ? -1 : 1;
                    const placementFactor = canvasRandom(0.4, 0.8);
                    const offsetX = corePuff.offsetX + (corePuff.radiusX * sidePlacement * placementFactor * (Math.random() < 0.5 ? 1: 0));
                    const offsetY = corePuff.offsetY + (corePuff.radiusY * sidePlacement * placementFactor * (Math.random() >= 0.5 ? 1: 0)) - canvasRandom(5,15) ;
                    const radius = canvasRandom(this.baseWidth * 0.05, this.baseWidth * 0.15);
                    this.puffs.push({ offsetX, offsetY, radiusX: radius, radiusY: radius * canvasRandom(0.7, 1.1)});
                }
            }
            update() {
                this.x += this.speed;
                let minPuffX = Infinity;
                this.puffs.forEach(p => minPuffX = Math.min(minPuffX, p.offsetX - p.radiusX));

                if (this.x + minPuffX > dynamicBgCanvas.width) { // If leftmost part of cloud is off screen right
                    let maxPuffXRelative = -Infinity; // Find rightmost extent of cloud relative to its x
                    this.puffs.forEach(p => maxPuffXRelative = Math.max(maxPuffXRelative, p.offsetX + p.radiusX));
                    this.x = -maxPuffXRelative - canvasRandom(50, 200); // Reset fully off-screen left
                    this.y = canvasRandom(dynamicBgCanvas.height * 0.05, dynamicBgCanvas.height * 0.35);
                }
            }
            draw() {
                let cloudColorString = getComputedStyle(document.documentElement).getPropertyValue('--canvas-cloud-color').trim();
                if (!cloudColorString || cloudColorString === "''" || cloudColorString === "none") cloudColorString = 'rgba(255, 255, 255, 0.85)';

                if ((cloudColorString.startsWith("'") && cloudColorString.endsWith("'")) || (cloudColorString.startsWith('"') && cloudColorString.endsWith('"'))) {
                    cloudColorString = cloudColorString.substring(1, cloudColorString.length - 1);
                }

                const originalGlobalAlpha = dynamicBgCtx.globalAlpha;
                dynamicBgCtx.globalAlpha = this.opacity;

                let baseRGBFill = 'rgb(255,255,255)';
                if (cloudColorString.startsWith('rgba')) {
                    baseRGBFill = cloudColorString.substring(0, cloudColorString.lastIndexOf(',')) + ')';
                    baseRGBFill = baseRGBFill.replace('rgba', 'rgb');
                } else if (cloudColorString.startsWith('rgb') || cloudColorString.startsWith('#')) {
                    baseRGBFill = cloudColorString;
                }
                dynamicBgCtx.fillStyle = baseRGBFill;

                this.puffs.forEach(puff => {
                    dynamicBgCtx.beginPath();
                    dynamicBgCtx.ellipse(this.x + puff.offsetX, this.y + puff.offsetY, puff.radiusX, puff.radiusY, 0, 0, Math.PI * 2);
                    dynamicBgCtx.fill();
                });
                dynamicBgCtx.globalAlpha = originalGlobalAlpha;
            }
        }

        class Bird {
            constructor(startX, startY) {
                this.x = startX;
                this.y = startY;
                this.speedX = canvasRandom(0.8, 2.2);
                this.speedY = canvasRandom(-0.15, 0.15);
                this.size = canvasRandom(6, 12);
                this.wingPhase = canvasRandom(0, Math.PI * 2);
                this.wingSpeed = canvasRandom(0.2, 0.35);
                this.color = 'rgba(80, 80, 80, 0.75)';
                this.flapAmplitude = this.size * canvasRandom(0.4, 0.6);
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.wingPhase = (this.wingPhase + this.wingSpeed); // Let it grow, sin/cos will handle periodicity
            }
            draw() {
                dynamicBgCtx.strokeStyle = this.color;
                dynamicBgCtx.lineWidth = Math.max(1, this.size / 5);
                dynamicBgCtx.beginPath();
                const wingYOffset = Math.sin(this.wingPhase) * this.flapAmplitude;
                dynamicBgCtx.moveTo(this.x - this.size, this.y + wingYOffset);
                dynamicBgCtx.lineTo(this.x, this.y);
                dynamicBgCtx.lineTo(this.x + this.size, this.y + wingYOffset);
                dynamicBgCtx.stroke();
            }
            isOffscreen() {
                return this.x > dynamicBgCanvas.width + this.size * 2 || this.x < -this.size * 2 ||
                       this.y > dynamicBgCanvas.height + this.size * 2 || this.y < -this.size * 2;
            }
        }

        function spawnFlock() {
            const flockSize = Math.floor(canvasRandom(BIRD_FLOCK_SIZE_MIN, BIRD_FLOCK_SIZE_MAX + 1));
            const startY = canvasRandom(dynamicBgCanvas.height * 0.1, dynamicBgCanvas.height * 0.5);
            const startX = -canvasRandom(50, 150);

            // console.log(`[CANVAS DEBUG] Spawning flock of ${flockSize} birds.`);
            for (let i = 0; i < flockSize; i++) {
                if (birds.length < MAX_BIRDS_ON_SCREEN) {
                    const birdX = startX - i * canvasRandom(15, 40);
                    const birdY = startY + canvasRandom(-30, 30);
                    birds.push(new Bird(birdX, birdY));
                }
            }
            lastFlockSpawnTime = performance.now();
        }

        function initLightModeCanvas() {
            // console.log('[CANVAS DEBUG] Initializing Light Mode Canvas elements...');
            clouds = [];
            for (let i = 0; i < MAX_CLOUDS_BG; i++) {
                clouds.push(new CloudBG());
            }
            birds = [];
            spawnFlock();
            // console.log(`[CANVAS DEBUG] Clouds: ${clouds.length}, Birds: ${birds.length}`);
        }

        function drawLightModeCanvasBackground() {
            const skyStart = getComputedStyle(document.documentElement).getPropertyValue('--canvas-sky-gradient-start').trim() || '#87CEEB';
            const skyEnd = getComputedStyle(document.documentElement).getPropertyValue('--canvas-sky-gradient-end').trim() || '#ADD8E6';

            const skyGradient = dynamicBgCtx.createLinearGradient(0, 0, 0, dynamicBgCanvas.height);
            skyGradient.addColorStop(0, skyStart);
            skyGradient.addColorStop(1, skyEnd);
            dynamicBgCtx.fillStyle = skyGradient;
            dynamicBgCtx.fillRect(0, 0, dynamicBgCanvas.width, dynamicBgCanvas.height);

            clouds.forEach(cloud => {
                cloud.update();
                cloud.draw();
            });

            let activeBirdsCount = 0;
            birds.forEach(bird => {
                bird.update();
                bird.draw();
                if (!bird.isOffscreen()) {
                    activeBirdsCount++;
                }
            });
            birds = birds.filter(bird => !bird.isOffscreen());

            if (performance.now() - lastFlockSpawnTime > FLOCK_SPAWN_INTERVAL && activeBirdsCount < BIRD_FLOCK_SIZE_MIN && birds.length < MAX_BIRDS_ON_SCREEN) {
                spawnFlock();
            }
        }

        // --- Dark Mode: Stars & Comets ---
        let stars = [];
        let comets = [];
        const MAX_STARS_BG = 150;
        const COMET_INTERVAL_BG = 2500;
        let lastCometTimeBG = 0;
        let blinkingStarIndex = -1;
        let blinkStartTime = 0;
        const BLINK_DURATION = 1200;
        const INTER_BLINK_DELAY = 150;
        const STAR_DIM_OPACITY_FACTOR = 0.3;

        class StarBG {
            constructor() {
                this.x = canvasRandom(0, dynamicBgCanvas.width);
                this.y = canvasRandom(0, dynamicBgCanvas.height * 0.85);
                this.radius = canvasRandom(0.6, 2.0);
                this.baseOpacity = canvasRandom(0.7, 1.0);
                this.currentOpacity = this.baseOpacity * STAR_DIM_OPACITY_FACTOR;
            }
            draw() {
                let starColorCSS = getComputedStyle(document.documentElement).getPropertyValue('--canvas-star-color').trim();
                 if (!starColorCSS || starColorCSS === "''" || starColorCSS === "none") starColorCSS = 'rgba(255, 255, 224, 0.9)';

                if ((starColorCSS.startsWith("'") && starColorCSS.endsWith("'")) || (starColorCSS.startsWith('"') && starColorCSS.endsWith('"'))) {
                    starColorCSS = starColorCSS.substring(1, starColorCSS.length - 1);
                }

                dynamicBgCtx.beginPath();
                dynamicBgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                const finalOpacity = Math.max(0, Math.min(1, this.currentOpacity));
                let finalColor = starColorCSS;
                if (starColorCSS.startsWith('rgba')) {
                    finalColor = starColorCSS.replace(/,\s*[\d.]+\)$/, `, ${finalOpacity})`);
                } else if (starColorCSS.startsWith('rgb')) {
                    finalColor = starColorCSS.replace('rgb', 'rgba').replace(')', `, ${finalOpacity})`);
                } else if (starColorCSS.startsWith('#')) { // Basic hex to rgba for opacity
                    let r = 0, g = 0, b = 0;
                    if (finalColor.length === 4) { // #RGB
                        r = parseInt(finalColor[1] + finalColor[1], 16);
                        g = parseInt(finalColor[2] + finalColor[2], 16);
                        b = parseInt(finalColor[3] + finalColor[3], 16);
                    } else if (finalColor.length === 7) { // #RRGGBB
                        r = parseInt(finalColor.substring(1, 3), 16);
                        g = parseInt(finalColor.substring(3, 5), 16);
                        b = parseInt(finalColor.substring(5, 7), 16);
                    }
                    finalColor = `rgba(${r},${g},${b},${finalOpacity})`;
                }
                dynamicBgCtx.fillStyle = finalColor;
                dynamicBgCtx.fill();
            }
        }

        class CometBG {
            constructor() {
                this.x = canvasRandom(0, dynamicBgCanvas.width);
                this.y = canvasRandom(-30, -5);
                this.length = canvasRandom(80, 150);
                this.speed = canvasRandom(1.5, 4);
                this.angle = canvasRandom(Math.PI * 0.3, Math.PI * 0.7);
                this.dx = Math.cos(this.angle) * this.speed;
                this.dy = Math.sin(this.angle) * this.speed;
                this.brightness = canvasRandom(0.7, 1);
            }
            update() { this.x += this.dx; this.y += this.dy; }
            draw() {
                const headColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-comet-head-color').trim() || `rgba(255, 255, 224, ${this.brightness})`;
                const tailMidColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-comet-tail-mid-color').trim() || `rgba(255, 255, 224, ${this.brightness * 0.5})`;
                const tailEndColor = `rgba(255, 255, 224, 0)`;

                dynamicBgCtx.beginPath();
                const tailX = this.x - this.dx * (this.length / this.speed);
                const tailY = this.y - this.dy * (this.length / this.speed);
                const gradient = dynamicBgCtx.createLinearGradient(this.x, this.y, tailX, tailY);
                gradient.addColorStop(0, headColor);
                gradient.addColorStop(0.3, tailMidColor);
                gradient.addColorStop(1, tailEndColor);
                dynamicBgCtx.strokeStyle = gradient;
                dynamicBgCtx.lineWidth = canvasRandom(0.5, 2.5);
                dynamicBgCtx.moveTo(this.x, this.y);
                dynamicBgCtx.lineTo(tailX, tailY);
                dynamicBgCtx.stroke();
            }
            isOffscreen() { return this.y > dynamicBgCanvas.height + this.length || this.x < -this.length || this.x > dynamicBgCanvas.width + this.length; }
        }

        function initDarkModeCanvas() {
            stars = [];
            for (let i = 0; i < MAX_STARS_BG; i++) {
                stars.push(new StarBG());
            }
            stars.forEach(star => {
                if (star) star.currentOpacity = star.baseOpacity * STAR_DIM_OPACITY_FACTOR;
            });
            comets = [];
            lastCometTimeBG = performance.now();
            blinkingStarIndex = -1;
            blinkStartTime = performance.now();
        }

        function updateStarBlinkingLogic(timestamp) {
            if (!stars || stars.length === 0) return;

            if (blinkingStarIndex !== -1 && stars[blinkingStarIndex]) {
                const activeStar = stars[blinkingStarIndex];
                const elapsed = timestamp - blinkStartTime;
                let progress = elapsed / BLINK_DURATION;

                if (progress < 1) {
                    const amplitude = activeStar.baseOpacity * (1 - STAR_DIM_OPACITY_FACTOR);
                    const dimLevel = activeStar.baseOpacity * STAR_DIM_OPACITY_FACTOR;
                    activeStar.currentOpacity = dimLevel + amplitude * Math.sin(progress * Math.PI) * 2; 
                } else {
                    activeStar.currentOpacity = activeStar.baseOpacity * STAR_DIM_OPACITY_FACTOR;
                    blinkingStarIndex = -1;
                    blinkStartTime = timestamp;
                }
            } else {
                if (timestamp - blinkStartTime > INTER_BLINK_DELAY) {
                    stars.forEach(star => {
                        if (star) star.currentOpacity = star.baseOpacity * STAR_DIM_OPACITY_FACTOR;
                    });
                    if (stars.length > 0) {
                        blinkingStarIndex = Math.floor(canvasRandom(0, stars.length));
                        blinkStartTime = timestamp;
                    }
                }
            }
        }

        function drawDarkModeCanvasBackground(timestamp) {
            const skyStart = getComputedStyle(document.documentElement).getPropertyValue('--canvas-night-sky-gradient-start').trim() || '#000030';
            const skyMid = getComputedStyle(document.documentElement).getPropertyValue('--canvas-night-sky-gradient-mid').trim() || '#101045';
            const skyEnd = getComputedStyle(document.documentElement).getPropertyValue('--canvas-night-sky-gradient-end').trim() || '#202055';

            const skyGradient = dynamicBgCtx.createLinearGradient(0, 0, 0, dynamicBgCanvas.height);
            skyGradient.addColorStop(0, skyStart);
            skyGradient.addColorStop(0.7, skyMid);
            skyGradient.addColorStop(1, skyEnd);
            dynamicBgCtx.fillStyle = skyGradient;
            dynamicBgCtx.fillRect(0, 0, dynamicBgCanvas.width, dynamicBgCanvas.height);

            updateStarBlinkingLogic(timestamp);
            stars.forEach(star => { if (star) star.draw(); });

            if (timestamp - lastCometTimeBG > COMET_INTERVAL_BG && comets.length < 4) {
                comets.push(new CometBG());
                lastCometTimeBG = timestamp;
            }
            comets = comets.filter(comet => {
                comet.update(); comet.draw(); return !comet.isOffscreen();
            });
        }

        function animationLoopDynamicBg(timestamp) {
            if (!dynamicBgCtx) {
                // console.error("[CANVAS DEBUG] Context lost or not initialized in animation loop.");
                return;
            }
            dynamicBgCtx.clearRect(0, 0, dynamicBgCanvas.width, dynamicBgCanvas.height);
            if (currentCanvasThemeInternal === 'light') {
                drawLightModeCanvasBackground();
            } else {
                drawDarkModeCanvasBackground(timestamp);
            }
            dynamicBgAnimationFrameId = requestAnimationFrame(animationLoopDynamicBg);
        }

        function setCanvasTheme(themeName) {
            // console.log(`[CANVAS DEBUG] setCanvasTheme called with: ${themeName}`);
            const newInternalTheme = (themeName === 'theme-deep') ? 'dark' : 'light';
            let themeChanged = currentCanvasThemeInternal !== newInternalTheme;
            currentCanvasThemeInternal = newInternalTheme;
            // console.log(`[CANVAS DEBUG] Internal canvas theme set to: ${currentCanvasThemeInternal}, Changed: ${themeChanged}`);

            if (themeChanged) {
                if (currentCanvasThemeInternal === 'light') {
                    initLightModeCanvas();
                } else {
                    initDarkModeCanvas();
                }
            }
            if (!dynamicBgAnimationFrameId) {
                if (dynamicBgCanvas.width > 0 && dynamicBgCanvas.height > 0) {
                    // console.log('[CANVAS DEBUG] Starting animation loop.');
                    animationLoopDynamicBg(performance.now());
                } else {
                    // console.warn('[CANVAS DEBUG] Canvas has no dimensions, not starting animation loop.');
                }
            }
        }

        setupDynamicBackgroundCanvasDimensions();

        window.addEventListener('resize', () => {
            // console.log('[CANVAS DEBUG] Window resize detected.');
            setupDynamicBackgroundCanvasDimensions();
            if (currentCanvasThemeInternal === 'light') {
                // console.log('[CANVAS DEBUG] Re-initializing light mode elements on resize.');
                initLightModeCanvas();
            } else {
                // console.log('[CANVAS DEBUG] Re-initializing dark mode elements on resize.');
                initDarkModeCanvas();
            }
        });

        window.updateDynamicBackgroundTheme = setCanvasTheme;

    } else {
        // console.warn("[CANVAS DEBUG] Canvas element with ID 'dynamicBackgroundCanvas' not found.");
    }
    // ==================================================
    // END: DYNAMIC ANIMATED BACKGROUND SCRIPT
    // ==================================================

    const setInitialPromptSmithTheme = () => {
        let savedTheme = localStorage.getItem('modernTheme') || 'theme-sky';
        if (!localStorage.getItem('modernTheme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            savedTheme = 'theme-deep';
        }
        // console.log(`[PROMPTSMITH THEME] Initial theme from storage/system: ${savedTheme}`);
        body.className = savedTheme;
        themeToggleBtn.innerHTML = savedTheme === 'theme-deep' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggleBtn.setAttribute('aria-label', savedTheme === 'theme-deep' ? 'Switch to Sky Theme' : 'Switch to Deep Theme');

        if (window.updateDynamicBackgroundTheme) {
            // console.log('[PROMPTSMITH THEME] Calling window.updateDynamicBackgroundTheme for initial theme.');
            window.updateDynamicBackgroundTheme(savedTheme);
        } else if (dynamicBgCanvas && typeof setCanvasTheme === "function") {
             // console.warn('[PROMPTSMITH THEME] window.updateDynamicBackgroundTheme not found, calling setCanvasTheme directly.');
            setCanvasTheme(savedTheme);
        } else {
            // console.warn('[PROMPTSMITH THEME] Canvas theme update function not available.');
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        let newTheme;
        if (body.classList.contains('theme-sky')) {
            newTheme = 'theme-deep';
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            newTheme = 'theme-sky';
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        // console.log(`[PROMPTSMITH THEME] Theme toggled to: ${newTheme}`);
        body.className = newTheme;
        localStorage.setItem('modernTheme', newTheme);
        themeToggleBtn.setAttribute('aria-label', newTheme === 'theme-deep' ? 'Switch to Sky Theme' : 'Switch to Deep Theme');

        if (window.updateDynamicBackgroundTheme) {
            window.updateDynamicBackgroundTheme(newTheme);
        }
    });

    setInitialPromptSmithTheme();

}); // End DOMContentLoaded
