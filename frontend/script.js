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

        console.log("User Goal:", goal);
        console.log("Generation Type:", selectedGenerationType);
        console.log("Model Type:", selectedModelType);

        errorDisplay.style.display = 'none';
        resultsSection.style.display = 'none';
        loadingIndicator.classList.add('visible');
        generateButton.disabled = true;
        generateButton.classList.add('loading');

        try {
            const response = await fetch('http://127.0.0.1:8000/generate-prompts/', {
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
            console.error('Fetch error:', error);
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
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        let dynamicBgAnimationFrameId;
        let currentCanvasThemeInternal = 'light';

        function canvasRandom(min, max) {
            return Math.random() * (max - min) + min;
        }

        function setupDynamicBackgroundCanvasDimensions() {
            dynamicBgCanvas.width = window.innerWidth;
            dynamicBgCanvas.height = window.innerHeight;
        }

        let clouds = [];
        const MAX_CLOUDS_BG = 15;
        class CloudBG {
            constructor() {
                this.x = canvasRandom(-dynamicBgCanvas.width * 0.5, dynamicBgCanvas.width * 1.5);
                this.y = canvasRandom(dynamicBgCanvas.height * 0.05, dynamicBgCanvas.height * 0.5);
                this.speed = canvasRandom(0.05, 0.3);
                this.radiusBase = canvasRandom(40, 100);
                this.numPuffs = Math.floor(canvasRandom(3, 5));
                this.puffs = [];
                for (let i = 0; i < this.numPuffs; i++) {
                    this.puffs.push({
                        offsetX: canvasRandom(-this.radiusBase * 0.7, this.radiusBase * 0.7),
                        offsetY: canvasRandom(-this.radiusBase * 0.2, this.radiusBase * 0.2),
                        radius: canvasRandom(this.radiusBase * 0.4, this.radiusBase * 1.1)
                    });
                }
                this.opacity = canvasRandom(0.6, 0.9);
            }
            update() {
                this.x += this.speed;
                if (this.x - this.radiusBase * 2 > dynamicBgCanvas.width) {
                    this.x = -this.radiusBase * 3;
                    this.y = canvasRandom(dynamicBgCanvas.height * 0.05, dynamicBgCanvas.height * 0.5);
                }
            }
            draw() {
                const cloudColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-cloud-color').trim() || 'rgba(255, 255, 255, 0.85)';
                dynamicBgCtx.fillStyle = cloudColor.replace(/(\d(\.\d+)?)\)/, `${this.opacity})`);
                dynamicBgCtx.beginPath();
                this.puffs.forEach(puff => {
                    dynamicBgCtx.moveTo(this.x + puff.offsetX + puff.radius, this.y + puff.offsetY);
                    dynamicBgCtx.arc(this.x + puff.offsetX, this.y + puff.offsetY, puff.radius, 0, Math.PI * 2);
                });
                dynamicBgCtx.closePath();
                dynamicBgCtx.fill();
            }
        }

        function initLightModeCanvas() {
            clouds = [];
            for (let i = 0; i < MAX_CLOUDS_BG; i++) {
                clouds.push(new CloudBG());
            }
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
        }

        let stars = [];
        let comets = [];
        const MAX_STARS_BG = 150;
        const COMET_INTERVAL_BG = 2500;
        let lastCometTimeBG = 0;

        let blinkingStarIndex = -1;
        let blinkStartTime = 0;
        const BLINK_DURATION = 1200;
        const INTER_BLINK_DELAY = 150;
        const STAR_DIM_OPACITY_FACTOR = 0.1;

        class StarBG {
            constructor() {
                this.x = canvasRandom(0, dynamicBgCanvas.width);
                this.y = canvasRandom(0, dynamicBgCanvas.height * 0.85);
                this.radius = canvasRandom(0.6, 2.0);
                this.baseOpacity = canvasRandom(0.7, 1.0);
                this.currentOpacity = this.baseOpacity * STAR_DIM_OPACITY_FACTOR;
            }
            draw() {
                const starColorCSS = getComputedStyle(document.documentElement).getPropertyValue('--canvas-star-color').trim() || 'rgba(255, 255, 224, 0.9)';
                dynamicBgCtx.beginPath();
                dynamicBgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                const finalOpacity = Math.max(0, Math.min(1, this.currentOpacity));
                let finalColor = starColorCSS;
                if (starColorCSS.startsWith('rgba')) {
                    finalColor = starColorCSS.replace(/,\s*[\d.]+\)$/, `, ${finalOpacity})`);
                } else if (starColorCSS.startsWith('rgb')) {
                    finalColor = starColorCSS.replace('rgb', 'rgba').replace(')', `, ${finalOpacity})`);
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
                    activeStar.currentOpacity = dimLevel + amplitude * Math.sin(progress * Math.PI);
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
            dynamicBgCtx.clearRect(0, 0, dynamicBgCanvas.width, dynamicBgCanvas.height);
            if (currentCanvasThemeInternal === 'light') {
                drawLightModeCanvasBackground();
            } else {
                drawDarkModeCanvasBackground(timestamp);
            }
            dynamicBgAnimationFrameId = requestAnimationFrame(animationLoopDynamicBg);
        }

        function setCanvasTheme(themeName) {
            const newInternalTheme = (themeName === 'theme-deep') ? 'dark' : 'light';
            let themeChanged = currentCanvasThemeInternal !== newInternalTheme;
            currentCanvasThemeInternal = newInternalTheme;

            if (themeChanged) {
                if (currentCanvasThemeInternal === 'light') {
                    initLightModeCanvas();
                } else {
                    initDarkModeCanvas();
                }
            }
            if (!dynamicBgAnimationFrameId) {
                if (dynamicBgCanvas.width > 0 && dynamicBgCanvas.height > 0) {
                    animationLoopDynamicBg(performance.now());
                }
            }
        }

        setupDynamicBackgroundCanvasDimensions();

        window.addEventListener('resize', () => {
            setupDynamicBackgroundCanvasDimensions();
            if (currentCanvasThemeInternal === 'light') initLightModeCanvas();
            else initDarkModeCanvas();
        });

        window.updateDynamicBackgroundTheme = setCanvasTheme;

    } // End of if(dynamicBgCanvas)

    const setInitialPromptSmithTheme = () => {
        let savedTheme = localStorage.getItem('modernTheme') || 'theme-sky';
        if (!localStorage.getItem('modernTheme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            savedTheme = 'theme-deep';
        }
        body.className = savedTheme;
        themeToggleBtn.innerHTML = savedTheme === 'theme-deep' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggleBtn.setAttribute('aria-label', savedTheme === 'theme-deep' ? 'Switch to Sky Theme' : 'Switch to Deep Theme');

        if (window.updateDynamicBackgroundTheme) {
            window.updateDynamicBackgroundTheme(savedTheme);
        } else if (dynamicBgCanvas && typeof setCanvasTheme === "function") { // Check if setCanvasTheme is defined directly
            setCanvasTheme(savedTheme);
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
        body.className = newTheme;
        localStorage.setItem('modernTheme', newTheme);
        themeToggleBtn.setAttribute('aria-label', newTheme === 'theme-deep' ? 'Switch to Sky Theme' : 'Switch to Deep Theme');

        if (window.updateDynamicBackgroundTheme) {
            window.updateDynamicBackgroundTheme(newTheme);
        }
    });

    setInitialPromptSmithTheme();

}); // End DOMContentLoaded