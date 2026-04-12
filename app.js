document.addEventListener('DOMContentLoaded', () => {
    // 1. Clock Logic
    const timeDisplay = document.getElementById('current-time');
    
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    setInterval(updateClock, 1000);
    updateClock();

    // 2. Event/Movie Sync Logic
    const eventsContainer = document.getElementById('events-container');

    const movies = [
        { id: 1, title: 'The Matrix', hall: 'Hall 1 - Standard', startOffset: 45, duration: 136 },
        { id: 2, title: 'Interstellar', hall: 'Hall 2 - IMAX', startOffset: 10, duration: 169 },
        { id: 3, title: 'Inception', hall: 'Hall 3 - Dolby Cinema', startOffset: 30, duration: 150 }
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

    function renderEvents() {
        if (!eventsContainer) return;
        eventsContainer.innerHTML = ''; // clear

        let current = new Date();

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
                let toIntermission = intermissionTime - elapsedMins;
                statusText = `Intermission in approx. ${toIntermission} mins.`;
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

            const eventHtml = `
                <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 1.5rem; margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.8rem;">
                        <div>
                            <h4 style="font-size: 1.1rem; color: var(--text-primary);"><i class="fas fa-play-circle" style="color:var(--accent-neon); margin-right:5px;"></i> ${event.title}</h4>
                            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.2rem;">${event.hall}</p>
                        </div>
                        <div style="text-align: right; color: var(--text-secondary); font-size: 0.9rem;">
                            ${formatTime(event.startTime)} - ${formatTime(event.endTime)}
                        </div>
                    </div>
                    <div class="progress-bar-bg" style="width: 100%; height: 6px; background-color: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem;">
                        <div style="height: 100%; background: linear-gradient(90deg, var(--accent-blue), var(--accent-neon)); border-radius: 3px; width: ${percentage}%; transition: width 1s linear;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.8rem;">
                        <span>${elapsedMins} min elapsed</span>
                        <span>${Math.max(0, remainingMins)} min left</span>
                    </div>
                    <div style="background-color: rgba(255, 255, 255, 0.03); padding: 0.6rem; border-radius: 6px; text-align: center; font-size: 0.9rem;">
                        <span style="color: ${statusColor}; font-weight: ${statusWeight};">${statusText}</span>
                    </div>
                </div>
            `;
            eventsContainer.insertAdjacentHTML('beforeend', eventHtml);
        });
        
        // Remove border from last item
        if (eventsContainer.lastElementChild) {
            eventsContainer.lastElementChild.style.borderBottom = 'none';
            eventsContainer.lastElementChild.style.paddingBottom = '0';
        }
    }

    setInterval(renderEvents, 60000); // update every minute
    renderEvents();

    // 3. Wait Time Simulator
    const facilities = [
        { id: 'washroom-a', name: 'Level 1 - North Washroom', type: 'washroom', base: 5, variant: 5 },
        { id: 'washroom-b', name: 'Level 1 - South Washroom', type: 'washroom', base: 2, variant: 4 },
        { id: 'washroom-c', name: 'Level 2 - VIP Washroom', type: 'washroom', base: 1, variant: 2 },
        { id: 'food-a', name: 'Popcorn Plaza', type: 'food', base: 10, variant: 15 },
        { id: 'food-b', name: 'Burger Grill', type: 'food', base: 15, variant: 20 },
        { id: 'food-c', name: 'Drinks Kiosk', type: 'food', base: 3, variant: 6 }
    ];

    let waitState = {}; // current wait times

    function getStatusClass(time) {
        if (time <= 5) return 'green';
        if (time <= 15) return 'yellow';
        return 'red';
    }

    const updatesLog = document.getElementById('update-log');

    function logUpdate(message) {
        const li = document.createElement('li');
        li.className = 'update-item';
        
        const timeNow = new Date();
        const timeStr = `${String(timeNow.getHours()).padStart(2,'0')}:${String(timeNow.getMinutes()).padStart(2,'0')}`;
        
        li.innerHTML = `
            <span class="update-time">${timeStr}</span>
            <span class="update-msg">${message}</span>
        `;
        
        updatesLog.prepend(li);
        
        // keep only latest 5
        if (updatesLog.children.length > 5) {
            updatesLog.lastElementChild.remove();
        }
    }

    function generateWaitTimes() {
        facilities.forEach(fac => {
            // Generate random wait time based on base and variance
            let newTime = Math.floor(Math.random() * fac.variant) + fac.base;
            let oldTime = waitState[fac.id];
            waitState[fac.id] = newTime;

            // DOM Updates
            const timeEl = document.getElementById(`wait-${fac.id}`);
            if (timeEl) {
                timeEl.textContent = `${newTime} min`;
                
                // Update status dot color
                const dot = timeEl.parentElement.querySelector('.status-dot');
                const newClass = getStatusClass(newTime);
                dot.className = `status-dot ${newClass}`;

                // Colorize text dynamically to add alert flavor on high lines
                if (newClass === 'red') {
                    timeEl.style.color = 'var(--status-red)';
                } else if (newClass === 'green') {
                    timeEl.style.color = 'var(--status-green)';
                } else {
                    timeEl.style.color = 'var(--text-primary)';
                }
            }

            // Notification Rule: If standard wait time dropped to <= 5 mins from something high
            if (oldTime > 7 && newTime <= 5) {
                let msg = `🔥 Line dropping! ${fac.name} is now only a ${newTime} min wait.`;
                logUpdate(msg);
            }
            // Notification Rule: Surge
            if (oldTime <= 10 && newTime > 15) {
                let msg = `⚠️ Crowd surge at ${fac.name}! Wait time is now ${newTime} mins.`;
                logUpdate(msg);
            }
        });
    }

    // Initial log
    logUpdate("Welcome to VenueSync! Enjoy your event experience.");
    
    // Initial generation
    generateWaitTimes();

    // Randomize slightly every 8 seconds for dynamic effect
    setInterval(() => {
        // change only 1 or 2 facilities to make it feel organic
        let randomFac = facilities[Math.floor(Math.random() * facilities.length)];
        let oldTime = waitState[randomFac.id];
        let newTime = Math.floor(Math.random() * randomFac.variant) + randomFac.base;
        
        // Prevent huge jumps
        newTime = Math.round((oldTime + newTime) / 2);
        waitState[randomFac.id] = newTime;

        const timeEl = document.getElementById(`wait-${randomFac.id}`);
        if(timeEl) {
            timeEl.textContent = `${newTime} min`;
            const dot = timeEl.parentElement.querySelector('.status-dot');
            const newClass = getStatusClass(newTime);
            dot.className = `status-dot ${newClass}`;
            
            if (newClass === 'red') timeEl.style.color = 'var(--status-red)';
            else if (newClass === 'green') timeEl.style.color = 'var(--status-green)';
            else timeEl.style.color = 'var(--text-primary)';
        }

        if (oldTime > 10 && newTime <= 5) {
             logUpdate(`🔥 Line dropping! ${randomFac.name} is now down to ${newTime} min wait.`);
        } else if (oldTime <= 10 && newTime > 15) {
             logUpdate(`⚠️ Crowd surge at ${randomFac.name}! Wait time is now ${newTime} mins.`);
        }

    }, 8000);

    // 4. Tab Switching Logic
    const navLinks = document.querySelectorAll('.nav-links li');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active classes
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked
            link.classList.add('active');

            // Hide all sections
            viewSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // Show target section
            const targetId = link.getAttribute('data-target');
            if (targetId) {
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.style.display = 'block';
                    targetEl.classList.add('active');
                    
                    // Update header title based on active tab
                    const titleEl = document.querySelector('.top-nav h1');
                    if (targetId === 'view-dashboard') titleEl.textContent = 'Live Dashboard';
                    else if (targetId === 'view-map') titleEl.textContent = 'Venue Map';
                    else if (targetId === 'view-food') titleEl.textContent = 'Food & Drinks';
                    else if (targetId === 'view-info') titleEl.textContent = 'Venue Info';
                }
            }
        });
    });
});
