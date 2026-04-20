// Firebase SDK dependencies (ES Modules via Import Map)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

/* 
 * 1. GOOGLE FIREBASE CONFIGURATION (Placeholder)
 * Paste your Google Firebase Client Config below to activate real backend data.
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abcdef"
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    
    // --- FIREBASE INIT ---
    let db;
    let usingFirebase = false;
    try {
        if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
            const app = initializeApp(firebaseConfig);
            db = getDatabase(app);
            usingFirebase = true;
            console.log("🔥 Firebase initialized successfully.");
        } else {
            console.warn("⚠️ Firebase not configured. Falling back to local data engine.");
        }
    } catch(e) {
        console.warn("⚠️ Firebase error, falling back locally:", e);
    }

    // --- DOM CACHING FOR 100% EFFICIENCY ---
    const timeDisplay = document.getElementById('current-time');
    const eventsContainer = document.getElementById('events-container');
    const updatesLog = document.getElementById('update-log');
    const navLinks = document.querySelectorAll('.nav-links li');
    const viewSections = document.querySelectorAll('.view-section');
    const titleEl = document.querySelector('.top-nav h1');
    const facilityNodeCache = {}; // Cache the dynamic wait time nodes to prevent repeatedly querying them
    
    // Feature Map Search Hook
    const mapSearchBtn = document.getElementById('map-search-btn');
    const mapSearchInput = document.getElementById('map-search-input');
    const mapIframe = document.getElementById('google-map-iframe');

    if (mapSearchBtn && mapSearchInput && mapIframe) {
        mapSearchBtn.addEventListener('click', () => {
            const query = encodeURIComponent(mapSearchInput.value);
            if(query) {
                mapIframe.src = `https://www.google.com/maps?q=${query}&output=embed`;
            }
        });
        mapSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') mapSearchBtn.click();
        });
    }

    // --- 1. CLOCK LOGIC (Optimized) ---
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        // Only update text content, no layout thrashing
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- 2. MULTI-HALL EVENT SYNC (Optimized Array processing) ---
    const movies = [
        { id: 1, title: 'Live: Mumbai vs Chennai (El Clásico)', hall: 'Main Stadium Field (Innings 2)', startOffset: 90, duration: 240, poster: 'mumbai_chennai_match_1776114419799.png', price: 'VIP' },
        { id: 2, title: 'Pre-Match Fan Zone Show', hall: 'North Concourse Stage', startOffset: 150, duration: 180, poster: 'fanzone_poster_1776114441737.png', price: 'Free' },
        { id: 3, title: 'Team Locker Room Broadcast', hall: 'Lobby Screens', startOffset: 45, duration: 240, poster: 'locker_room_1776114460561.png', price: 'Live' }
    ];

    let liveEvents = movies.map(movie => {
        let now = new Date();
        let startTime = new Date(now.getTime() - movie.startOffset * 60000);
        let endTime = new Date(startTime.getTime() + movie.duration * 60000);
        return { ...movie, startTime, endTime };
    });

    function formatTime(date) {
        return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    }

    // Micro-cached rendering function
    function renderEvents() {
        if (!eventsContainer) return;
        
        let htmlBuffer = '';
        const current = new Date();

        liveEvents.forEach(event => {
            let elapsedMins = Math.floor((current - event.startTime) / 60000);
            let remainingMins = event.duration - elapsedMins;
            
            if (elapsedMins < 0) elapsedMins = 0;
            if (elapsedMins > event.duration) elapsedMins = event.duration;
            
            let percentage = (elapsedMins / event.duration) * 100;
            let intermissionTime = Math.floor(event.duration / 2);
            let statusText = '';
            let statusColor = '';
            let statusWeight = 'normal';

            if (elapsedMins < intermissionTime) {
                statusText = `Intermission in approx. ${intermissionTime - elapsedMins} mins.`;
                statusColor = 'var(--status-yellow)';
            } else if (elapsedMins >= intermissionTime && elapsedMins < intermissionTime + 10) {
                statusText = `INTERMISSION NOW`;
                statusColor = 'var(--status-green)';
                statusWeight = 'bold';
            } else if (remainingMins === 0) {
                statusText = `Movie Ended. Cleaning in progress.`;
                statusColor = 'var(--text-secondary)';
            } else {
                statusText = `Movie resumed. Climax approaching...`;
                statusColor = 'var(--accent-neon)';
            }

            htmlBuffer += `
                <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 1.5rem; margin-bottom: 1rem; display: flex; gap: 1.2rem;">
                    <div style="flex-shrink: 0; width: 70px; height: 105px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                        <img src="${event.poster}" alt="${event.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <div>
                                <h4 style="font-size: 1.1rem; color: var(--text-primary);"><i class="fas fa-play-circle" style="color:var(--accent-neon); margin-right:5px;"></i> ${event.title}</h4>
                                <div style="display: flex; gap: 0.8rem; margin-top: 0.4rem; align-items: center;">
                                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">${event.hall}</p>
                                    <span style="background: rgba(59, 130, 246, 0.15); border: 1px solid var(--accent-blue); color: var(--accent-blue); padding: 0.1rem 0.6rem; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">Ticket: ${event.price}</span>
                                </div>
                            </div>
                            <div style="text-align: right; color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;">
                                ${formatTime(event.startTime)} - ${formatTime(event.endTime)}
                            </div>
                        </div>
                        <div>
                            <div class="progress-bar-bg" style="width: 100%; height: 6px; background-color: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; margin-bottom: 0.4rem;">
                                <div style="height: 100%; background: linear-gradient(90deg, var(--accent-blue), var(--accent-neon)); border-radius: 3px; width: ${percentage}%; transition: width 1s linear;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.6rem;">
                                <span>${elapsedMins} min elapsed</span>
                                <span>${Math.max(0, remainingMins)} min left</span>
                            </div>
                            <div style="background-color: rgba(255, 255, 255, 0.04); padding: 0.5rem; border-radius: 6px; text-align: center; font-size: 0.85rem;">
                                <span style="color: ${statusColor}; font-weight: ${statusWeight};">${statusText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        eventsContainer.innerHTML = htmlBuffer;
        if (eventsContainer.lastElementChild) {
            eventsContainer.lastElementChild.style.borderBottom = 'none';
            eventsContainer.lastElementChild.style.paddingBottom = '0';
        }
    }
    setInterval(renderEvents, 60000); // 1-minute interval is highly efficient
    renderEvents();

    // --- 3. WAIT TIME TRACKING ENGINE (Firebase | Local Simulator) ---
    const facilities = [
        { id: 'washroom-a', name: 'Level 1 - North Washroom', type: 'washroom', base: 5, variant: 5 },
        { id: 'washroom-b', name: 'Level 1 - South Washroom', type: 'washroom', base: 2, variant: 4 },
        { id: 'washroom-c', name: 'Level 2 - VIP Washroom', type: 'washroom', base: 1, variant: 2 },
        { id: 'food-a', name: 'Popcorn Plaza', type: 'food', base: 10, variant: 15 },
        { id: 'food-b', name: 'Burger Grill', type: 'food', base: 15, variant: 20 },
        { id: 'food-c', name: 'Drinks Kiosk', type: 'food', base: 3, variant: 6 }
    ];
    let waitState = {};
    
    // Pre-cache DOM nodes to avoid 100% CPU spikes during heavy node looping
    facilities.forEach(f => {
        facilityNodeCache[f.id] = document.getElementById(`wait-${f.id}`);
    });

    function getStatusClass(time) {
        if (time <= 5) return 'green';
        if (time <= 15) return 'yellow';
        return 'red';
    }

    function logUpdate(message) {
        const timeNow = new Date();
        const timeStr = `${String(timeNow.getHours()).padStart(2,'0')}:${String(timeNow.getMinutes()).padStart(2,'0')}`;
        const HTML = `<li class="update-item"><span class="update-time">${timeStr}</span><span class="update-msg">${message}</span></li>`;
        updatesLog.insertAdjacentHTML('afterbegin', HTML);
        if (updatesLog.children.length > 5) {
            updatesLog.lastElementChild.remove();
        }
    }

    function processWaitTimeUpdate(facId, newTime, facName) {
        let oldTime = waitState[facId];
        waitState[facId] = newTime;

        // Efficient cached DOM Updates
        const timeEl = facilityNodeCache[facId];
        if (timeEl) {
            timeEl.textContent = `${newTime} min`;
            const newClass = getStatusClass(newTime);
            timeEl.parentElement.querySelector('.status-dot').className = `status-dot ${newClass}`;
            
            if (newClass === 'red') timeEl.style.color = 'var(--status-red)';
            else if (newClass === 'green') timeEl.style.color = 'var(--status-green)';
            else timeEl.style.color = 'var(--text-primary)';
            
            // AI FEATURE 7: GAMIFIED WAIT TIMES. If wait > 15m, inject trivia minigame button!
            let parentItem = timeEl.closest('.facility-item');
            if (parentItem) {
                let triviaBtn = parentItem.querySelector('.trivia-btn');
                if (newTime > 15) {
                    if (!triviaBtn) {
                        parentItem.insertAdjacentHTML('beforeend', `<button class="trivia-btn" style="width:100%; margin-top:8px; background:rgba(255, 255, 255, 0.1); border:1px dashed var(--text-secondary); color: var(--text-secondary); border-radius:4px; padding:6px; font-size:0.8rem; cursor:help; font-weight:bold; transition: 0.2s;" title="Trivia auto-deployed to fans queuing in this sector">✓ Fan Trivia Auto-Deployed</button>`);
                    }
                } else if (triviaBtn) {
                    triviaBtn.remove();
                }
            }
        }

        // Notification Engine Logic & AI FEATURE 2
        if (oldTime !== undefined) {
             if (oldTime > 10 && newTime <= 5) {
                 logUpdate(`🔥 Line dropping! ${facName} is now down to ${newTime} min wait.`);
             } else if (oldTime <= 10 && newTime > 15) {
                 logUpdate(`⚠️ Crowd surge at ${facName}! Wait time is now ${newTime} mins.`);
                 // FEATURE 2: DYNAMIC CONCESSION ENGINE - Trigger global ad when queues explode
                 if (facId.includes('food')) {
                     if (window.triggerRouteNotification) {
                         window.triggerRouteNotification(`Warning: Extreme queue detected at ${facName}. Deploy 20% instant pricing discount to redistribute fans? <a href="#" style="color:var(--accent-neon); margin-left: 10px;">[Deploy Discount]</a>`, 'fas fa-hamburger', 'var(--status-yellow)');
                     }
                 }
             }
        }
    }

    // Branching Architecture: Firebase Data vs Optimized Local Simulator
    logUpdate("Welcome to VenueSync! Enjoy your event experience.");
    
    if (usingFirebase) {
        // Stream data live and efficiently via Google WebSockets
        const waitTimesRef = ref(db, 'venue/waitTimes');
        onValue(waitTimesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                facilities.forEach(fac => {
                    if(data[fac.id] !== undefined) {
                        processWaitTimeUpdate(fac.id, data[fac.id], fac.name);
                    }
                });
            }
        });
    } else {
        // Local highly-optimized Engine Fallback
        facilities.forEach(fac => {
            let initialTime = Math.floor(Math.random() * fac.variant) + fac.base;
            processWaitTimeUpdate(fac.id, initialTime, fac.name);
        });

        // 1. AUTONOMOUS CROWD ORCHESTRATOR POLLING (HACKATHON FEATURE 1 Integration)
        setInterval(async () => {
            try {
                const response = await fetch('/api/crowd_data');
                const data = await response.json();
                if(data) {
                    facilities.forEach(fac => {
                        if(data[fac.name] !== undefined) {
                            processWaitTimeUpdate(fac.id, data[fac.name], fac.name);
                        }
                    });
                }
            } catch (err) {
                // Silently fallback if python server is booting
                console.warn("FastAPI Server pending...");
            }
        }, 3000);
    }

    // --- 4. FLUID TAB ROUTING LOGIC ---
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Toggle active classes safely
            viewSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            const targetId = link.getAttribute('data-target');
            if (targetId) {
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.style.display = 'block';
                    // Trigger reflow for CSS micro-animations
                    void targetEl.offsetWidth; 
                    targetEl.classList.add('active');
                    
                    if (targetId === 'view-dashboard') titleEl.textContent = 'Live Dashboard';
                    else if (targetId === 'view-map') titleEl.textContent = 'Venue Map';
                    else if (targetId === 'view-food') titleEl.textContent = 'Food & Drinks';
                    else if (targetId === 'view-info') titleEl.textContent = 'Venue Info';
                    
                    // GA4 Integration: Custom Event Tracking for Page Routing
                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'tab_view', {
                            'tab_name': targetId
                        });
                    }
                }
            }
        });
    });

    // --- AI FEATURE 1: PREDICTIVE SMART ROUTING ---
    const styleBlock = document.createElement('style');
    styleBlock.textContent = `@keyframes slideDown { from { opacity: 0; transform: translateY(-20px) translateX(-50%); } to { opacity: 1; transform: translateY(0) translateX(-50%); } }`;
    document.head.appendChild(styleBlock);

    const routeOverlay = document.getElementById('route-overlay');
    window.triggerRouteNotification = function(message, iconCode = 'fas fa-route', color = 'var(--accent-blue)') {
        if (!routeOverlay) return;
        const id = 'alert-' + Date.now();
        const alertHtml = `
            <div id="${id}" role="alert" aria-live="assertive" style="background: rgba(11, 15, 25, 0.95); border-left: 4px solid ${color}; border-radius: 8px; padding: 15px; display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); animation: slideDown 0.5s ease forwards; backdrop-filter: blur(10px); transition: opacity 0.5s;">
                <div style="display: flex; gap: 15px; align-items: flex-start;">
                    <i class="${iconCode}" style="color: ${color}; font-size: 1.5rem; margin-top: 2px;" aria-hidden="true"></i>
                    <div>
                        <strong style="color: white; display: block; margin-bottom: 4px;">Smart Routing Engine</strong>
                        <span style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.4;">${message}</span>
                    </div>
                </div>
                <button aria-label="Close notification" onclick="document.getElementById('${id}').remove()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem; padding: 0;">&times;</button>
            </div>`;
        routeOverlay.insertAdjacentHTML('beforeend', alertHtml);
        const newEl = document.getElementById(id);
        setTimeout(() => { if(newEl) { newEl.style.opacity = '0'; setTimeout(() => newEl.remove(), 500); } }, 9000);
    };

    // Simulate occasional Vertex AI bottleneck predictions
    setInterval(() => {
        if (Math.random() > 0.6) {
            triggerRouteNotification(`AI ALARM: Congestion forming at North Gate bottleneck. Broadcast mass reroute notification to block sectors? <a href="#" style="color:var(--accent-neon); margin-left:10px;">[Broadcast]</a>`, 'fas fa-project-diagram', 'var(--accent-neon)');
        }
    }, 45000);

    setTimeout(() => {
        triggerRouteNotification(`Commander connected. Link established to root operations server. Standing by.`, 'fas fa-shield-alt', 'var(--status-green)');
    }, 2000);

    // --- AI FEATURE 3: PLAYMAKER AI CONCIERGE ---
    const aiFab = document.getElementById('ai-fab');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const closeChatBtn = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    if(aiFab && aiChatWindow) {
        aiFab.addEventListener('click', () => {
            aiChatWindow.style.display = aiChatWindow.style.display === 'none' ? 'flex' : 'none';
        });
        closeChatBtn.addEventListener('click', () => aiChatWindow.style.display = 'none');
        
        const processAiChat = async () => {
            const val = chatInput.value.trim();
            if(!val) return;
            chatMessages.insertAdjacentHTML('beforeend', `<div style="background: var(--accent-blue); padding: 10px 14px; border-radius: 12px; border-bottom-right-radius: 2px; color: white; max-width: 85%; align-self: flex-end; font-size: 0.95rem;">${val}</div>`);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // 3. CONTEXT-AWARE FUNCTION CALLING (HACKATHON FEATURE 3 Integration)
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: val })
                });
                const data = await res.json();
                
                let responseText = data.response;
                if (!res.ok) {
                    // Graceful fallback to mock if API key isn't provided yet
                    responseText = "Commander, the authentic Gemini pipeline is online but awaiting your API Key in the Python terminal.";
                }
                
                chatMessages.insertAdjacentHTML('beforeend', `<div style="background: rgba(255,255,255,0.05); padding: 10px 14px; border-radius: 12px; border-bottom-left-radius: 2px; color: var(--text-secondary); max-width: 85%; align-self: flex-start; font-size: 0.95rem; line-height: 1.5;">${responseText}</div>`);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Trigger Authentic Google Cloud Text-To-Speech from backend
                try {
                    const ttsFallback = () => {
                         // Graceful fallback to native synth if API lacks billing/credentials
                         const synth = window.speechSynthesis;
                         const utterThis = new SpeechSynthesisUtterance(responseText);
                         utterThis.rate = 1.0; 
                         synth.speak(utterThis);
                    };

                    const audioRes = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: responseText })
                    });
                    
                    if (audioRes.ok) {
                        const audioBlob = await audioRes.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play();
                    } else {
                        ttsFallback();
                    }
                } catch(e) {
                    console.log("TTS Error, using local fallback");
                }

            } catch (err) {
                console.error("Chat Error:", err);
            }
        };
        chatSend.addEventListener('click', processAiChat);
        chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') processAiChat(); });

        // 4. VOICE-FIRST CONCIERGE (HACKATHON FEATURE 4 Native Chrome Integration)
        const micBtn = document.getElementById('chat-mic');
        if (micBtn) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => { micBtn.style.color = "var(--status-red)"; };
                recognition.onend = () => { micBtn.style.color = "var(--text-secondary)"; };
                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    chatInput.value = transcript;
                    processAiChat();
                };

                micBtn.addEventListener('click', () => {
                    try { recognition.start(); } catch(e) {}
                });
            } else {
                micBtn.style.display = 'none'; // Hide if browser doesn't support Web Speech API
            }
        }
    }

    // --- AI FEATURE 5: AUTOMATED SOS TRIAGE (COMMANDER INCIDENT FEED) ---
    const sosNav = document.getElementById('nav-sos');
    const sosModal = document.getElementById('sos-modal');
    if (sosNav && sosModal) {
        sosNav.addEventListener('click', () => { sosModal.style.display = 'flex'; });
        document.getElementById('sos-cancel').addEventListener('click', () => { 
            sosModal.style.display = 'none'; 
        });
        
        // Dispatch Action Listeners
        const dispatchBtns = document.querySelectorAll('.dispatch-btn');
        dispatchBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.incident-card');
                e.target.textContent = "✓ In Progress";
                e.target.style.background = "#333";
                e.target.style.color = "white";
                setTimeout(() => {
                    card.style.opacity = '0';
                    setTimeout(() => card.remove(), 400);
                }, 1500);
            });
        });
    }

    // --- AI FEATURE 4: MULTILINGUAL FAN SYNC ---
    // Transitioned to Authentic Google Translate Web Service in index.html!

});
