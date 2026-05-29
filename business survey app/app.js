document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyA8qJRMss8RbpCXB86yb4Fa1_RfMk_elU8",
        authDomain: "bmia-cfe26.firebaseapp.com",
        projectId: "bmia-cfe26",
        storageBucket: "bmia-cfe26.firebasestorage.app",
        messagingSenderId: "896865410144",
        appId: "1:896865410144:web:0688857b8fc47344f0f705",
        measurementId: "G-1QCHEP29Y7"
    };

    // Firebase Initialization & Feature Detection
    let db = null;
    let isFirebaseActive = false;

    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            isFirebaseActive = true;
            console.log("⚡ Firebase Cloud Firestore initialized successfully! Online sync active.");
        } catch (error) {
            console.error("❌ Firebase initialization failed:", error);
        }
    } else {
        console.warn("⚠️ Firebase is not configured yet. App running in offline/localStorage fallback mode.");
    }

    // --- Application State ---
    let currentStepId = 'step-welcome';
    let isAdminAuthenticated = false; // Admin auth state
    const surveyState = {
        age: '',
        gamer: '',
        drinks: [],
        redbull_source: [],
        redbull_source_other: '',
        frequency: '',
        wants_lottery: false,
        name: '',
        email: '',
        ticketCode: '',
        timestamp: ''
    };

    // --- DOM Elements ---
    const logo = document.getElementById('appLogo');
    const headerAdminBtn = document.getElementById('headerAdminBtn');
    const progressContainer = document.getElementById('surveyProgressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');

    // Forms
    const formStep1 = document.getElementById('form-step-1');
    const formStep2 = document.getElementById('form-step-2');
    const formStep3 = document.getElementById('form-step-3');
    const formStep4 = document.getElementById('form-step-4');

    // Raffle elements
    const wantsRaffleCheck = document.getElementById('wants-raffle');
    const raffleFields = document.getElementById('raffle-fields');
    const raffleNameInput = document.getElementById('raffle-name');
    const raffleEmailInput = document.getElementById('raffle-email');
    const btnSubmitSurvey = document.getElementById('btn-submit-survey');

    // Admin Auth Modal Elements
    const adminAuthModal = document.getElementById('adminAuthModal');
    const adminPasswordInput = document.getElementById('admin-password');
    const authErrorMessage = document.getElementById('auth-error-message');
    const btnCancelAuth = document.getElementById('btn-cancel-auth');
    const btnSubmitAuth = document.getElementById('btn-submit-auth');

    // Conditional controls
    const rbCheckOther = document.getElementById('redbull-source-other-check');
    const rbTextOther = document.getElementById('redbull-source-other-text');
    const checkboxRedBull = document.getElementById('checkbox-redbull');
    const btnPrevStep4 = document.getElementById('btn-prev-step-4');

    // Buttons
    const btnStart = document.getElementById('btn-start');
    const btnRestartSurvey = document.getElementById('btn-restart-survey');
    const btnRevealTicket = document.getElementById('btn-reveal-ticket');
    const btnCopyCode = document.getElementById('btn-copy-code');

    // Lottery/Result panels
    const scratchPanel = document.getElementById('scratchPanel');
    const reel1 = document.getElementById('reel-1');
    const reel2 = document.getElementById('reel-2');
    const reel3 = document.getElementById('reel-3');
    const slotStatusText = document.getElementById('slot-status-text');
    const ticketSerialCode = document.getElementById('ticketSerialCode');
    const ticketBarcodeText = document.getElementById('ticketBarcodeText');

    // Admin Panel Elements
    const adminPanel = document.getElementById('admin-panel');
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    const btnMockData = document.getElementById('btn-mock-data');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnClearData = document.getElementById('btn-clear-data');
    const adminStatTotal = document.getElementById('admin-stat-total');
    const adminStatGamer = document.getElementById('admin-stat-gamer');
    const adminStatRedbull = document.getElementById('admin-stat-redbull');
    const adminStatTickets = document.getElementById('admin-stat-tickets');
    const adminTableBody = document.getElementById('admin-table-body');

    // --- Navigation Logic ---
    const totalSurveySteps = 4;

    function getStepNumber(stepId) {
        switch (stepId) {
            case 'step-1': return 1;
            case 'step-2': return 2;
            case 'step-3-redbull': return 3; // Note: Step 3 is conditional
            case 'step-4': return 4;
            default: return 0;
        }
    }

    function updateProgress(stepId) {
        const stepNum = getStepNumber(stepId);

        if (stepNum === 0) {
            progressContainer.style.display = 'none';
            return;
        }

        progressContainer.style.display = 'flex';

        // Calculate fill percentage
        // Red Bull is conditional, so let's adjust progress mapping visually
        let fillPercent = 0;
        let displayStepText = `Step ${stepNum} of ${totalSurveySteps}`;

        if (stepId === 'step-1') {
            fillPercent = 25;
        } else if (stepId === 'step-2') {
            fillPercent = 50;
        } else if (stepId === 'step-3-redbull') {
            fillPercent = 75;
            displayStepText = `Step 3 of 4 (レッドブル特別質問)`;
        } else if (stepId === 'step-4') {
            fillPercent = 100;
        }

        progressBarFill.style.width = `${fillPercent}%`;
        progressText.textContent = displayStepText;
    }

    function switchStep(targetStepId) {
        // Remove active class from current card
        const currentCard = document.getElementById(currentStepId);
        if (currentCard) {
            currentCard.classList.remove('active');
            // Hide dashboard if visible when starting survey
            if (targetStepId !== 'admin-panel') {
                adminPanel.style.display = 'none';
            }
        }

        // Set new step active
        const targetCard = document.getElementById(targetStepId);
        if (targetCard) {
            // Apply delay or show immediately
            if (targetStepId === 'admin-panel') {
                targetCard.style.display = 'block';
                targetCard.classList.add('active');
            } else {
                targetCard.style.display = 'block';
                targetCard.classList.add('active');
            }

            // Clean up old card display states if switching standard survey steps
            if (currentStepId && currentStepId !== targetStepId && currentStepId !== 'admin-panel') {
                document.getElementById(currentStepId).style.display = 'none';
            }

            currentStepId = targetStepId;
            updateProgress(targetStepId);
        }

        // Scroll to top of viewport smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Connect prev buttons
    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = btn.getAttribute('data-target');
            switchStep(target);
        });
    });

    // --- Audio Synthesis Effects (For Wow Experience) ---
    let audioCtx = null;
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSynthTone(freq, type, duration, delay = 0) {
        try {
            initAudio();
            if (!audioCtx) return;

            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                // Smooth release
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            }, delay * 1000);
        } catch (e) {
            console.log("Audio play error", e);
        }
    }

    function playWinningSound() {
        // High-end retro electronic win sound chord
        playSynthTone(261.63, 'triangle', 0.8, 0); // C4
        playSynthTone(329.63, 'triangle', 0.8, 0.1); // E4
        playSynthTone(392.00, 'triangle', 0.8, 0.2); // G4
        playSynthTone(523.25, 'sine', 1.5, 0.3); // C5
        playSynthTone(659.25, 'sine', 1.5, 0.4); // E5
        playSynthTone(783.99, 'sine', 2.0, 0.5); // G5
    }

    function playSpinSound() {
        playSynthTone(150, 'sawtooth', 0.05);
    }

    // --- Event Listeners & Survey Flows ---

    // Welcome start button
    btnStart.addEventListener('click', () => {
        initAudio();
        switchStep('step-1');
    });

    // Step 1: Age & Gamer submitted
    formStep1.addEventListener('submit', (e) => {
        e.preventDefault();
        const ageVal = formStep1.querySelector('input[name="age"]:checked').value;
        const gamerVal = formStep1.querySelector('input[name="gamer"]:checked').value;

        surveyState.age = ageVal;
        surveyState.gamer = gamerVal;

        switchStep('step-2');
    });

    // Step 2: Drinks selection submitted
    formStep2.addEventListener('submit', (e) => {
        e.preventDefault();
        const checkedBoxes = formStep2.querySelectorAll('input[name="drinks"]:checked');
        const selectedDrinks = Array.from(checkedBoxes).map(cb => cb.value);

        surveyState.drinks = selectedDrinks;

        // Conditional Check: Did they check Red Bull?
        const knowsRedBull = selectedDrinks.includes('Red Bull');
        if (knowsRedBull) {
            switchStep('step-3-redbull');
        } else {
            // Adjust step-4 back target dynamically
            btnPrevStep4.setAttribute('data-target', 'step-2');
            switchStep('step-4');
        }
    });

    // Step 3 (Conditional): Red Bull source details submitted
    rbCheckOther.addEventListener('change', () => {
        rbTextOther.style.display = rbCheckOther.checked ? 'block' : 'none';
        if (rbCheckOther.checked) {
            rbTextOther.focus();
        }
    });

    formStep3.addEventListener('submit', (e) => {
        e.preventDefault();
        const checkedSources = formStep3.querySelectorAll('input[name="redbull_source"]:checked');
        const selectedSources = Array.from(checkedSources).map(cb => cb.value);

        surveyState.redbull_source = selectedSources;
        if (selectedSources.includes('other')) {
            surveyState.redbull_source_other = rbTextOther.value.trim();
        } else {
            surveyState.redbull_source_other = '';
        }

        // Adjust step-4 back target dynamically
        btnPrevStep4.setAttribute('data-target', 'step-3-redbull');
        switchStep('step-4');
    });

    // Step-4 back button logic override is handled dynamically when entering step-4
    btnPrevStep4.addEventListener('click', () => {
        const target = btnPrevStep4.getAttribute('data-target');
        switchStep(target);
    });

    // wants-raffle check toggle logic
    if (wantsRaffleCheck) {
        wantsRaffleCheck.addEventListener('change', () => {
            if (wantsRaffleCheck.checked) {
                raffleFields.classList.add('show');
                raffleNameInput.required = true;
                raffleEmailInput.required = true;
                btnSubmitSurvey.textContent = '回答を送信して抽選に応募 ⚡';
            } else {
                raffleFields.classList.remove('show');
                raffleNameInput.required = false;
                raffleEmailInput.required = false;
                raffleNameInput.value = '';
                raffleEmailInput.value = '';
                btnSubmitSurvey.textContent = '回答を送信する ⚡';
            }
        });
    }

    // Step 4: Consumption Frequency submitted -> Save data and start Lottery
    formStep4.addEventListener('submit', (e) => {
        e.preventDefault();
        const frequencyVal = formStep4.querySelector('input[name="frequency"]:checked').value;
        surveyState.frequency = frequencyVal;

        const wantsRaffle = wantsRaffleCheck.checked;
        surveyState.wants_lottery = wantsRaffle;

        if (wantsRaffle) {
            const nameVal = raffleNameInput.value.trim();
            const emailVal = raffleEmailInput.value.trim();

            if (!nameVal || !emailVal) {
                alert('お名前とメールアドレスをご記入ください。');
                return;
            }
            surveyState.name = nameVal;
            surveyState.email = emailVal;
        } else {
            surveyState.name = '';
            surveyState.email = '';
        }

        // Perform Submission & Lottery Animation
        triggerLotterySubmission();
    });

    // --- Starbucks Ticket Generation & Lottery Animation ---

    function generateStarbucksCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codePart1 = '';
        let codePart2 = '';
        for (let i = 0; i < 4; i++) {
            codePart1 += chars.charAt(Math.floor(Math.random() * chars.length));
            codePart2 += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `ENTRY-${codePart1}-${codePart2}`;
    }

    function triggerLotterySubmission() {
        switchStep('step-lottery');

        // Hide scratch panel initially
        scratchPanel.style.display = 'none';

        if (surveyState.wants_lottery) {
            slotStatusText.textContent = 'エントリーデータを送信中...';
            surveyState.ticketCode = generateStarbucksCode();
        } else {
            slotStatusText.textContent = 'アンケートデータを送信中...';
            surveyState.ticketCode = ''; // No code
        }

        surveyState.timestamp = new Date().toISOString();

        // Save immediately to local storage
        saveResponseToLocal(surveyState);

        // Visual slot machine spin
        let spins = 0;
        const maxSpins = 15;
        const reels = ['🎟️', '⚡', '⭐', '🔥', '🎮', '🎯'];

        reel1.classList.add('spinning');
        reel2.classList.add('spinning');
        reel3.classList.add('spinning');

        const interval = setInterval(() => {
            spins++;

            // Randomize reel text while spinning
            reel1.textContent = reels[Math.floor(Math.random() * reels.length)];
            reel2.textContent = reels[Math.floor(Math.random() * reels.length)];
            reel3.textContent = reels[Math.floor(Math.random() * reels.length)];

            playSpinSound();

            if (spins >= maxSpins) {
                clearInterval(interval);

                // Finalize winning slots (3 of a kind!)
                reel1.classList.remove('spinning');
                reel2.classList.remove('spinning');
                reel3.classList.remove('spinning');

                if (surveyState.wants_lottery) {
                    reel1.textContent = '🎟️';
                    reel2.textContent = '🎟️';
                    reel3.textContent = '🎟️';
                    slotStatusText.innerHTML = '<span style="color: var(--color-monster-green); font-weight: 800;">✨ ENTRY COMPLETED! ✨</span>';
                } else {
                    reel1.textContent = '👍';
                    reel2.textContent = '👍';
                    reel3.textContent = '👍';
                    slotStatusText.innerHTML = '<span style="color: var(--color-monster-green); font-weight: 800;">✨ THANK YOU! ✨</span>';
                }

                // Play chord
                playWinningSound();

                // Show action panel
                setTimeout(() => {
                    if (surveyState.wants_lottery) {
                        scratchPanel.querySelector('.scratch-title').textContent = '応募完了';
                        scratchPanel.querySelector('.scratch-desc').textContent = 'エントリーコードが安全に発給されました！';
                        btnRevealTicket.textContent = '🎫 エントリーカードを表示する';
                    } else {
                        scratchPanel.querySelector('.scratch-title').textContent = '送信完了';
                        scratchPanel.querySelector('.scratch-desc').textContent = 'ご協力ありがとうございました！';
                        btnRevealTicket.textContent = '🏁 完了画面を表示する';
                    }
                    scratchPanel.style.display = 'block';
                }, 400);
            }
        }, 120);
    }

    // Reveal ticket button
    btnRevealTicket.addEventListener('click', () => {
        const ticketSection = document.getElementById('step-result');
        const successBanner = ticketSection.querySelector('.success-banner');
        const resultTitle = ticketSection.querySelector('.result-title');
        const resultSubtitle = ticketSection.querySelector('.result-subtitle');
        const sbuxTicket = document.getElementById('sbuxTicket');

        if (surveyState.wants_lottery) {
            successBanner.style.display = 'block';
            successBanner.textContent = '🎟️ ENTRY CONFIRMED 🎟️';
            resultTitle.textContent = '抽選エントリーが完了しました！';
            resultSubtitle.style.display = 'block';
            resultSubtitle.innerHTML = `
                アンケートへのご回答ありがとうございました。スターバックス ドリンクチケット（500円相当）の抽選応募が正常に受け付けられました。<br>
                アンケート期間終了後、主催者側で厳正な抽選を行います。以下の<strong>「応募エントリーコード」</strong>は当選確認および賞品の受け取り時に必要となりますので、大切に保管してください。
            `;
            sbuxTicket.style.display = 'block';
            ticketSerialCode.textContent = surveyState.ticketCode;
            ticketBarcodeText.textContent = surveyState.ticketCode;
        } else {
            successBanner.style.display = 'block';
            successBanner.textContent = '✨ SUBMITTED ✨';
            resultTitle.textContent = 'ご回答ありがとうございました！';
            resultSubtitle.style.display = 'block';
            resultSubtitle.textContent = 'ご入力いただいた回答内容は正常に送信されました。エナジードリンク認知度および飲用実態調査にご協力いただき、心より感謝申し上げます。';
            sbuxTicket.style.display = 'none';
        }

        switchStep('step-result');
    });

    // Copy ticket code utility
    btnCopyCode.addEventListener('click', () => {
        const textToCopy = surveyState.ticketCode;
        navigator.clipboard.writeText(textToCopy).then(() => {
            btnCopyCode.textContent = 'Copied!';
            btnCopyCode.classList.add('copied');

            playSynthTone(600, 'sine', 0.2); // Nice feedback beep

            setTimeout(() => {
                btnCopyCode.textContent = 'Copy';
                btnCopyCode.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code: ', err);
        });
    });

    // Restart Survey Action
    btnRestartSurvey.addEventListener('click', () => {
        // Reset forms
        formStep1.reset();
        formStep2.reset();
        formStep3.reset();
        formStep4.reset();

        // Hide other text box
        rbTextOther.style.display = 'none';

        // Clear choices state
        surveyState.age = '';
        surveyState.gamer = '';
        surveyState.drinks = [];
        surveyState.redbull_source = [];
        surveyState.redbull_source_other = '';
        surveyState.frequency = '';
        surveyState.wants_lottery = false;
        surveyState.name = '';
        surveyState.email = '';
        surveyState.ticketCode = '';
        surveyState.timestamp = '';

        if (raffleFields) raffleFields.classList.remove('show');
        if (btnSubmitSurvey) btnSubmitSurvey.textContent = '回答を送信する ⚡';

        switchStep('step-welcome');
    });

    // --- Local Storage Integration ---

    const LOCAL_STORAGE_KEY = 'energy_survey_responses';

    function getLocalResponses() {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveResponseToLocal(record) {
        const localRecord = JSON.parse(JSON.stringify(record));

        // 1. Save to local storage as fallback/backup
        const responses = getLocalResponses();
        responses.push(localRecord);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(responses));

        // 2. If Firebase Firestore is active, push document to Cloud Firestore
        if (isFirebaseActive && db) {
            db.collection("responses").add(localRecord)
                .then((docRef) => {
                    console.log("☁️ Data successfully synced to Firestore with ID:", docRef.id);
                    // Live listeners will handle renderDashboardData automatically,
                    // but we call it here to be safe and responsive.
                    renderDashboardData();
                })
                .catch((error) => {
                    console.error("❌ Error syncing data to Cloud Firestore:", error);
                });
        } else {
            // Local fallback render
            renderDashboardData();
        }
    }


    // --- Hidden Admin Dashboard Dashboard panel activation & Password Protection ---

    // Double clicking the logo will toggle the Dashboard!
    logo.addEventListener('dblclick', () => {
        toggleAdminDashboard();
    });

    // Toggle button in header
    headerAdminBtn.addEventListener('click', () => {
        toggleAdminDashboard();
    });

    function toggleAdminDashboard() {
        if (adminPanel.style.display === 'none') {
            if (isAdminAuthenticated) {
                renderDashboardData();
                switchStep('admin-panel');
            } else {
                // Show login modal
                adminAuthModal.classList.add('show');
                adminPasswordInput.value = '';
                authErrorMessage.style.display = 'none';
                setTimeout(() => adminPasswordInput.focus(), 100);
            }
        } else {
            switchStep('step-welcome');
        }
    }

    btnCloseAdmin.addEventListener('click', () => {
        switchStep('step-welcome');
    });

    // Authentication modal buttons
    if (btnCancelAuth) {
        btnCancelAuth.addEventListener('click', () => {
            adminAuthModal.classList.remove('show');
        });
    }

    if (btnSubmitAuth) {
        btnSubmitAuth.addEventListener('click', () => {
            handleAdminLogin();
        });
    }

    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAdminLogin();
            }
        });
    }

    function handleAdminLogin() {
        const password = adminPasswordInput.value;
        if (password === 'admin2026') {
            isAdminAuthenticated = true;
            adminAuthModal.classList.remove('show');
            renderDashboardData();
            switchStep('admin-panel');
        } else {
            authErrorMessage.style.display = 'block';
            playSynthTone(150, 'sawtooth', 0.25); // buzz fail tone
        }
    }


    // --- Dashboard Math & Dynamic Render Graphics ---

    let firestoreUnsubscribe = null;

    function renderDashboardData() {
        if (isFirebaseActive && db) {
            if (firestoreUnsubscribe) return; // Already listening

            console.log("☁️ Subscribed to Cloud Firestore real-time dashboard snapshot updates.");
            firestoreUnsubscribe = db.collection("responses").onSnapshot((snapshot) => {
                const cloudResponses = [];
                snapshot.forEach((doc) => {
                    cloudResponses.push(doc.data());
                });
                console.log(`☁️ Firestore Sync: Retrieved ${cloudResponses.length} total responses.`);
                renderChartsAndTable(cloudResponses);
            }, (error) => {
                console.error("❌ Firestore real-time listen failed:", error);
                renderChartsAndTable(getLocalResponses());
            });
        } else {
            renderChartsAndTable(getLocalResponses());
        }
    }

    function renderChartsAndTable(responses) {

        // Metrics Summary calculations
        const totalCount = responses.length;
        adminStatTotal.textContent = totalCount;

        if (totalCount === 0) {
            adminStatGamer.textContent = '0%';
            adminStatRedbull.textContent = '0%';
            adminStatTickets.textContent = 0;
            adminTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--color-text-muted);">回答データはまだありません。</td></tr>`;

            // Empty charts
            document.getElementById('chart-age').innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; padding: 2rem; text-align: center;">回答データを待機中...</div>';
            document.getElementById('chart-brands').innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; padding: 2rem; text-align: center;">回答データを待機中...</div>';
            document.getElementById('chart-redbull-sources').innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; padding: 2rem; text-align: center;">回答データを待機中...</div>';
            document.getElementById('chart-frequency').innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; padding: 2rem; text-align: center;">回答データを待機中...</div>';
            return;
        }

        // 1. Gamer Rate
        const gamerCount = responses.filter(r => r.gamer === 'yes').length;
        const gamerRate = Math.round((gamerCount / totalCount) * 100);
        adminStatGamer.textContent = `${gamerRate}%`;

        // 2. Red Bull Recognition Rate
        const redbullCount = responses.filter(r => r.drinks.includes('Red Bull')).length;
        const redbullRate = Math.round((redbullCount / totalCount) * 100);
        adminStatRedbull.textContent = `${redbullRate}%`;

        // 3. Total Starbucks Coupons generated
        adminStatTickets.textContent = responses.filter(r => r.wants_lottery && r.ticketCode).length;

        // 4. Render Table
        let tableRowsHtml = '';
        // Sort newest first
        const sortedResponses = [...responses].reverse();
        const winners = JSON.parse(localStorage.getItem('energy_survey_winners') || '[]');

        sortedResponses.forEach(r => {
            const formattedDate = new Date(r.timestamp).toLocaleString('ja-JP', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const gamerBadge = r.gamer === 'yes'
                ? '<span class="table-badge gamer-yes">ゲーマー</span>'
                : '<span class="table-badge gamer-no">一般</span>';

            const drinksBadges = r.drinks.map(d => `<span class="table-badge" style="border: 1px solid rgba(255,255,255,0.1)">${d}</span>`).join(' ');

            // Map keys of red bull sources to human friendly labels
            const sourceMap = { combini: 'コンビニ', esports: 'eスポーツ', sns: 'SNS広告', other: 'その他' };
            const mappedSources = r.redbull_source ? r.redbull_source.map(s => {
                if (s === 'other' && r.redbull_source_other) return `その他 (${r.redbull_source_other})`;
                return sourceMap[s] || s;
            }).join(', ') : 'なし';

            // Map frequency key to text
            const freqMap = {
                never: '全く飲まない',
                less_than_once_month: '月1未満',
                once_month: '月1回',
                few_times_week: '週に数回',
                once_week: '週1回',
                once_day: '日1回',
                more_than_once_day: '日2回以上'
            };
            const friendlyFreq = freqMap[r.frequency] || r.frequency;

            const ageLabels = {
                '12-': '12歳以下', '13': '13歳', '14': '14歳', '15': '15歳', '16': '16歳', '17': '17歳',
                '18': '18歳', '19': '19歳', '20': '20歳', '21': '21歳', '22': '22歳', '23+': '23歳以上'
            };
            const friendlyAge = ageLabels[r.age] || r.age;

            const isWinner = r.ticketCode && winners.includes(r.ticketCode);
            const winnerClassAttr = isWinner ? ' class="winner-row"' : '';
            const winnerBadge = isWinner ? '<span class="table-badge badge-winner">🏆 当選</span> ' : '';

            const wantsRaffleBadge = r.wants_lottery
                ? '<span class="table-badge gamer-yes">YES</span>'
                : '<span class="table-badge gamer-no">NO</span>';
            const raffleName = r.name ? r.name : '<span style="color:var(--color-text-muted)">-</span>';
            const raffleEmail = r.email ? r.email : '<span style="color:var(--color-text-muted)">-</span>';
            const ticketCell = r.wants_lottery && r.ticketCode
                ? `${winnerBadge}${r.ticketCode}`
                : '<span style="color:var(--color-text-muted)">非応募</span>';

            tableRowsHtml += `
                <tr${winnerClassAttr}>
                    <td>${formattedDate}</td>
                    <td style="font-family: var(--font-heading); font-weight:700;">${friendlyAge}</td>
                    <td>${gamerBadge}</td>
                    <td>${drinksBadges || '<span style="color:var(--color-text-muted)">なし</span>'}</td>
                    <td style="max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${mappedSources}</td>
                    <td>${friendlyFreq}</td>
                    <td style="text-align:center;">${wantsRaffleBadge}</td>
                    <td>${raffleName}</td>
                    <td style="max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${raffleEmail}</td>
                    <td class="table-code">${ticketCell}</td>
                </tr>
            `;
        });
        adminTableBody.innerHTML = tableRowsHtml;

        // 5. Age Distribution Custom Chart
        const ageGroups = {
            '12-': 0, '13': 0, '14': 0, '15': 0, '16': 0, '17': 0,
            '18': 0, '19': 0, '20': 0, '21': 0, '22': 0, '23+': 0
        };
        responses.forEach(r => {
            if (ageGroups[r.age] !== undefined) ageGroups[r.age]++;
        });

        const ageLabelsChart = {
            '12-': '12歳以下', '13': '13歳', '14': '14歳', '15': '15歳', '16': '16歳', '17': '17歳',
            '18': '18歳', '19': '19歳', '20': '20歳', '21': '21歳', '22': '22歳', '23+': '23歳以上'
        };

        let ageChartHtml = '';
        Object.keys(ageGroups).forEach(age => {
            const count = ageGroups[age];
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            ageChartHtml += `
                <div class="age-chart-bar-container">
                    <span class="age-label" style="font-size: 0.75rem;">${ageLabelsChart[age] || age}</span>
                    <div class="age-track">
                        <div class="age-fill" style="width: ${pct}%;"></div>
                    </div>
                    <span class="age-percent" style="font-size: 0.75rem;">${pct}%</span>
                </div>
            `;
        });
        document.getElementById('chart-age').innerHTML = ageChartHtml;

        // 6. Brand Recognition (Vertical Bars)
        const brandsCount = {
            'Monster': 0, 'Red Bull': 0, 'ZONe': 0, 'Nitro': 0, 'Real Gold': 0, 'C4 energy': 0, 'G FUEL': 0
        };
        responses.forEach(r => {
            if (r.drinks) {
                r.drinks.forEach(d => {
                    if (brandsCount[d] !== undefined) brandsCount[d]++;
                });
            }
        });

        let brandsChartHtml = '';
        Object.keys(brandsCount).forEach(brand => {
            const count = brandsCount[brand];
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            let fillClass = 'fill-monster';
            if (brand === 'Red Bull') fillClass = 'fill-redbull';
            if (brand === 'ZONe') fillClass = 'fill-zone';
            if (brand === 'Nitro') fillClass = 'fill-nitro';
            if (brand === 'Real Gold') fillClass = 'fill-realgold';
            if (brand === 'C4 energy') fillClass = 'fill-c4';
            if (brand === 'G FUEL') fillClass = 'fill-gfuel';

            brandsChartHtml += `
                <div class="brand-col">
                    <span class="brand-val">${pct}%</span>
                    <div class="brand-pillar-track">
                        <div class="brand-pillar-fill ${fillClass}" style="height: ${pct}%;"></div>
                    </div>
                    <span class="brand-lbl" title="${brand}">${brand}</span>
                </div>
            `;
        });
        document.getElementById('chart-brands').innerHTML = brandsChartHtml;

        // 7. Red Bull Acquisition Sources (Horizontal Progress Cards)
        const sourceCounts = { combini: 0, esports: 0, sns: 0, other: 0 };
        let redbullRespondents = 0;

        responses.forEach(r => {
            if (r.drinks.includes('Red Bull')) {
                redbullRespondents++;
                if (r.redbull_source) {
                    r.redbull_source.forEach(s => {
                        if (sourceCounts[s] !== undefined) sourceCounts[s]++;
                    });
                }
            }
        });

        let sourceChartHtml = '';
        const sourceLabels = {
            combini: 'コンビニ・スーパー店頭',
            esports: 'eスポーツ大会・配信広告',
            sns: 'SNS広告・SNS口コミ',
            other: 'その他'
        };

        Object.keys(sourceCounts).forEach(src => {
            const count = sourceCounts[src];
            const pct = redbullRespondents > 0 ? Math.round((count / redbullRespondents) * 100) : 0;
            sourceChartHtml += `
                <div class="horiz-bar-container">
                    <div class="horiz-header">
                        <span class="horiz-title">${sourceLabels[src]}</span>
                        <span class="horiz-val">${count}票 (${pct}%)</span>
                    </div>
                    <div class="horiz-track">
                        <div class="horiz-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        });

        if (redbullRespondents === 0) {
            document.getElementById('chart-redbull-sources').innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; padding: 2rem; text-align: center;">回答データの中にレッドブル認知者はいません。</div>';
        } else {
            document.getElementById('chart-redbull-sources').innerHTML = sourceChartHtml;
        }

        // 8. Frequencies Chart
        const freqMap = {
            never: '全く飲まない',
            less_than_once_month: '月1回未満',
            once_month: '月に1回程度',
            few_times_week: '週に数回程度',
            once_week: '週に1回程度',
            once_day: '日に1回程度',
            more_than_once_day: '日に2回以上'
        };

        const freqCounts = {
            never: 0, less_than_once_month: 0, once_month: 0, few_times_week: 0, once_week: 0, once_day: 0, more_than_once_day: 0
        };

        responses.forEach(r => {
            if (freqCounts[r.frequency] !== undefined) freqCounts[r.frequency]++;
        });

        let freqChartHtml = '';
        Object.keys(freqCounts).forEach(fKey => {
            const count = freqCounts[fKey];
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            freqChartHtml += `
                <div class="freq-chart-row">
                    <span class="freq-label" title="${freqMap[fKey]}">${freqMap[fKey]}</span>
                    <div class="freq-track">
                        <div class="freq-fill" style="width: ${pct}%;"></div>
                    </div>
                    <span class="freq-count">${count}件</span>
                </div>
            `;
        });
        document.getElementById('chart-frequency').innerHTML = freqChartHtml;
    }

    // --- Mock Data Generator (For beautiful charts presentation) ---

    btnMockData.addEventListener('click', () => {
        const mockResponses = [];
        const ages = ['12-', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23+'];
        const gamers = ['yes', 'no'];
        const drinksPool = ['Monster', 'Red Bull', 'ZONe', 'Nitro', 'Real Gold', 'C4 energy', 'G FUEL'];
        const sourcesPool = ['combini', 'esports', 'sns', 'other'];
        const otherSourcesPool = ['テレビCM', '友達からの紹介', '自動販売機', 'フェスイベント'];
        const frequencies = ['never', 'less_than_once_month', 'once_month', 'few_times_week', 'once_week', 'once_day', 'more_than_once_day'];
        const namesPool = ['田中 健一', '佐藤 美咲', '鈴木 翔太', '高橋 莉奈', '渡辺 陸', '伊藤 結衣', '中村 拓海', '小林 葵', '加藤 大輝', '吉田 凛'];

        // Generate 10 records
        for (let i = 0; i < 10; i++) {
            // Demographics
            const age = ages[Math.floor(Math.random() * ages.length)];
            const gamer = gamers[Math.random() > 0.4 ? 0 : 1]; // Gamer-biased

            // Drinks chosen
            const numDrinks = Math.floor(Math.random() * 4) + 1; // 1 to 4 drinks
            const shuffledDrinks = [...drinksPool].sort(() => 0.5 - Math.random());
            const drinks = shuffledDrinks.slice(0, numDrinks);

            // Conditional sources for red bull
            let redbull_source = [];
            let redbull_source_other = '';
            if (drinks.includes('Red Bull')) {
                const numSources = Math.floor(Math.random() * 2) + 1;
                const shuffledSources = [...sourcesPool].sort(() => 0.5 - Math.random());
                redbull_source = shuffledSources.slice(0, numSources);
                if (redbull_source.includes('other')) {
                    redbull_source_other = otherSourcesPool[Math.floor(Math.random() * otherSourcesPool.length)];
                }
            }

            // Frequency
            const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];

            // Wants Starbucks ticket lottery (60% chance)
            const wants_lottery = Math.random() > 0.4;
            let name = '';
            let email = '';
            let ticketCode = '';

            if (wants_lottery) {
                name = namesPool[Math.floor(Math.random() * namesPool.length)];
                email = `mock_${Math.floor(Math.random() * 9000) + 1000}@example.com`;
                ticketCode = generateStarbucksCode();
            }

            // Random timestamp in the last 2 days
            const timeOffset = Math.random() * 172800000; // up to 48 hours in ms
            const timestamp = new Date(Date.now() - timeOffset).toISOString();

            mockResponses.push({
                age, gamer, drinks, redbull_source, redbull_source_other, frequency, wants_lottery, name, email, ticketCode, timestamp
            });
        }

        // Save mock data
        const currentData = getLocalResponses();
        const combined = [...currentData, ...mockResponses];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));

        // Feedback tone & update display
        playSynthTone(800, 'sine', 0.2);
        renderDashboardData();
    });

    // Clear local storage survey data
    btnClearData.addEventListener('click', () => {
        if (confirm('すべての回答データと当選コード情報を完全に削除してもよろしいですか？\n(この操作は元に戻せません)')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem('energy_survey_winners');
            playSynthTone(300, 'sawtooth', 0.5);
            renderDashboardData();
            renderRaffleWinners();
        }
    });

    // --- Excel-Compatible CSV Export with UTF-8 BOM ---
    btnExportCsv.addEventListener('click', () => {
        const responses = getLocalResponses();
        if (responses.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }

        // Build CSV Content
        // Headers
        let csvContent = '\ufeff'; // UTF-8 BOM for Japanese characters rendering correctly in Microsoft Excel!
        csvContent += '日時,年代,ゲーマー属性,認知しているブランド,レッドブル認知経路,エナジー飲用頻度,スタバ抽選応募,お名前,メールアドレス,抽選コード\r\n';

        const sourceMap = { combini: 'コンビニ・スーパー', esports: 'eスポーツ広告', sns: 'SNS広告', other: 'その他' };
        const freqMap = {
            never: '全く飲まない',
            less_than_once_month: '月に1回未満',
            once_month: '月に1回程度',
            few_times_week: '週に数回程度',
            once_week: '週に1回程度',
            once_day: '日に1回程度',
            more_than_once_day: '日に2回以上'
        };

        responses.forEach(r => {
            const formattedDate = new Date(r.timestamp).toLocaleString('ja-JP');
            const gamerText = r.gamer === 'yes' ? 'ゲーマー' : '非ゲーマー';
            const drinksText = r.drinks.join('|');

            const sourcesList = r.redbull_source ? r.redbull_source.map(s => {
                if (s === 'other' && r.redbull_source_other) return `その他 (${r.redbull_source_other})`;
                return sourceMap[s] || s;
            }).join('|') : '該当なし';

            const frequencyText = freqMap[r.frequency] || r.frequency;
            const wantsRaffleText = r.wants_lottery ? '希望する' : '希望しない';
            const nameText = r.name || '';
            const emailText = r.email || '';
            const ticket = r.ticketCode || '';

            // Clean values to avoid CSV breakage
            const cleanDate = `"${formattedDate.replace(/"/g, '""')}"`;
            const cleanAge = `"${r.age.replace(/"/g, '""')}"`;
            const cleanGamer = `"${gamerText.replace(/"/g, '""')}"`;
            const cleanDrinks = `"${drinksText.replace(/"/g, '""')}"`;
            const cleanSources = `"${sourcesList.replace(/"/g, '""')}"`;
            const cleanFreq = `"${frequencyText.replace(/"/g, '""')}"`;
            const cleanWants = `"${wantsRaffleText.replace(/"/g, '""')}"`;
            const cleanName = `"${nameText.replace(/"/g, '""')}"`;
            const cleanEmail = `"${emailText.replace(/"/g, '""')}"`;
            const cleanTicket = `"${ticket.replace(/"/g, '""')}"`;

            csvContent += `${cleanDate},${cleanAge},${cleanGamer},${cleanDrinks},${cleanSources},${cleanFreq},${cleanWants},${cleanName},${cleanEmail},${cleanTicket}\r\n`;
        });

        // Create virtual download element
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `energy_survey_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        playSynthTone(700, 'sine', 0.25);
    });

    // --- Interactive Raffle Drawing Module (NEW) ---

    const btnRunDraw = document.getElementById('btn-run-draw');
    const btnResetDraw = document.getElementById('btn-reset-draw');
    const drawWinnerCount = document.getElementById('draw-winner-count');
    const drawResultsDisplay = document.getElementById('draw-results-display');
    const drawResultsList = document.getElementById('draw-results-list');

    let winnersUnsubscribe = null;

    function renderRaffleWinners() {
        if (isFirebaseActive && db) {
            if (winnersUnsubscribe) return; // Already listening

            winnersUnsubscribe = db.collection("config").doc("winners").onSnapshot((doc) => {
                const data = doc.data();
                const cloudWinners = data ? (data.list || []) : [];
                localStorage.setItem('energy_survey_winners', JSON.stringify(cloudWinners));
                updateWinnersUI(cloudWinners);
            }, (error) => {
                console.error("❌ Firestore winners listen failed:", error);
                updateWinnersUI(getOfflineWinners());
            });
        } else {
            updateWinnersUI(getOfflineWinners());
        }
    }

    function getOfflineWinners() {
        return JSON.parse(localStorage.getItem('energy_survey_winners') || '[]');
    }

    function updateWinnersUI(winners) {
        if (winners.length > 0) {
            drawResultsDisplay.style.display = 'block';
            btnResetDraw.style.display = 'inline-flex';
            drawResultsList.innerHTML = winners.map((code, idx) => `
                <div class="winner-ticket-card">
                    <span>🏆 当選 #${idx + 1}</span>
                    <span style="letter-spacing: 1px;">${code}</span>
                </div>
            `).join('');
        } else {
            drawResultsDisplay.style.display = 'none';
            btnResetDraw.style.display = 'none';
            drawResultsList.innerHTML = '';
        }

        // Dynamically highlight winner rows in the existing table
        const rows = document.querySelectorAll('#admin-table-body tr');
        rows.forEach(row => {
            const codeCell = row.querySelector('.table-code');
            if (codeCell) {
                // Strip existing badge to find raw code
                const rawCode = codeCell.textContent.replace('🏆 当選', '').trim();
                const isWinner = winners.includes(rawCode);
                if (isWinner) {
                    row.classList.add('winner-row');
                    if (!codeCell.querySelector('.badge-winner')) {
                        codeCell.innerHTML = `<span class="table-badge badge-winner">🏆 当選</span> ${rawCode}`;
                    }
                } else {
                    row.classList.remove('winner-row');
                    const badge = codeCell.querySelector('.badge-winner');
                    if (badge) {
                        codeCell.innerHTML = rawCode;
                    }
                }
            }
        });
    }

    if (btnRunDraw) {
        btnRunDraw.addEventListener('click', () => {
            // Fetch newest responses depending on mode
            const responses = getLocalResponses();
            const eligibleResponses = responses.filter(r => r.wants_lottery && r.ticketCode);

            if (eligibleResponses.length === 0) {
                alert('スタバ抽選にエントリーした応募データがまだありません。\n回答を入力するか、モックデータを生成してから実行してください。');
                return;
            }

            let count = parseInt(drawWinnerCount.value) || 3;
            if (count < 1) count = 1;
            if (count > eligibleResponses.length) {
                count = eligibleResponses.length;
                drawWinnerCount.value = count;
            }

            // suspense audio & visual ticking animation
            btnRunDraw.disabled = true;
            btnResetDraw.style.display = 'none';
            drawResultsDisplay.style.display = 'block';

            let frame = 0;
            const maxFrames = 15;

            const tickInterval = setInterval(() => {
                frame++;

                // Play futuristic synthetic ticking sounds
                playSynthTone(300 + Math.random() * 300, 'sawtooth', 0.05);

                // Suspense flicker list
                const tempWinners = [];
                const shuffledTemp = [...eligibleResponses].sort(() => 0.5 - Math.random());
                for (let k = 0; k < count; k++) {
                    if (shuffledTemp[k]) tempWinners.push(shuffledTemp[k].ticketCode);
                }

                drawResultsList.innerHTML = tempWinners.map(code => `
                    <div class="winner-ticket-card" style="opacity: 0.6; border-color: var(--color-monster-green); color: var(--color-monster-green);">
                        <span>🎲 抽選中...</span>
                        <span>${code}</span>
                    </div>
                `).join('');

                if (frame >= maxFrames) {
                    clearInterval(tickInterval);

                    // Settle winners
                    const shuffledFinal = [...eligibleResponses].sort(() => 0.5 - Math.random());
                    const selectedWinners = shuffledFinal.slice(0, count).map(r => r.ticketCode);

                    // 1. Save to local storage for backup
                    localStorage.setItem('energy_survey_winners', JSON.stringify(selectedWinners));

                    // 2. Sync to Firebase Firestore online
                    if (isFirebaseActive && db) {
                        db.collection("config").doc("winners").set({ list: selectedWinners })
                            .then(() => console.log("☁️ Winner draw synced to Firestore config."))
                            .catch(err => console.error("❌ Error syncing winners to Firestore:", err));
                    }

                    // Play glorious winning melody
                    playWinningSound();

                    // Render locally as fallback (will also trigger automatically from Firestore snap)
                    updateWinnersUI(selectedWinners);

                    btnRunDraw.disabled = false;
                    btnResetDraw.style.display = 'inline-flex';
                }
            }, 100);
        });
    }

    if (btnResetDraw) {
        btnResetDraw.addEventListener('click', () => {
            if (confirm('現在の当選者決定データをクリアして、再抽選を実行できるようにしますか？\n(回答データ自体は消去されません)')) {
                localStorage.removeItem('energy_survey_winners');

                if (isFirebaseActive && db) {
                    db.collection("config").doc("winners").delete()
                        .then(() => console.log("☁️ Winners reset in Cloud Firestore."))
                        .catch(err => console.error("❌ Error resetting Firestore winners:", err));
                }

                playSynthTone(250, 'sine', 0.3);
                updateWinnersUI([]);
            }
        });
    }

    // Check if there's any data previously, render if yes
    renderDashboardData();
    renderRaffleWinners();
});
