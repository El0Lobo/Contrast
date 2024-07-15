const usualDays = {
    0: { name: 'Queer-Kneipe', className: 'queerkneipe', sectionId: 'queerkneipe_kn' }, // Montag 
    1: { name: 'Das Labor', className: 'das-labor', sectionId: 'labor_kn' }, // Dienstag
    2: { name: 'Mixed Music', className: 'mixed-music' }, // Mittwoch
    3: { name: 'Punk Kneipe', className: 'punkkneipe', sectionId: 'punk_kneipe' }, // Donnerstag 
    4: { name: 'Kneipe', className: 'kneipe' }, // Freitag    
    5: { name: 'Kneipe', className: 'kneipe' }, // Samstag
    6: { name: 'Geschlossen', className: 'geschlossen' } // Sonntag
};

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Show the selected section
    const section = document.getElementById(sectionId);
    section.classList.add('active');

    // Update the navigation links
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => link.classList.remove('active'));

    // Add active class to the clicked link
    const activeLink = document.querySelector(`nav ul li a[onclick="showSection('${sectionId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}
document.addEventListener('DOMContentLoaded', function() {
    // Show section by default
    showSection('home');

    // Add event listener to the Impressum link
    var impressumLink = document.getElementById('impressum-link');
    var impressumModal = document.getElementById('impressum-modal');
    var closeModal = document.querySelector('.modal .close');

    impressumLink.addEventListener('click', function(event) {
        event.preventDefault();
        impressumModal.style.display = 'block';
    });

    closeModal.addEventListener('click', function() {
        impressumModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == impressumModal) {
            impressumModal.style.display = 'none';
        }
    });

    // Other existing code...
});

function showImagePopup(imgSrc, altText) {
    const popup = document.createElement('div');
    popup.className = 'image-popup';
    
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.onclick = function() {
        document.body.removeChild(popup);
    };

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = altText;
    img.className = 'popup-img';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = function() {
        document.body.removeChild(popup);
    };
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.zIndex = '1002';

    popup.appendChild(overlay);
    popup.appendChild(img);
    popup.appendChild(closeBtn);
    document.body.appendChild(popup);
}

function loadAdditionalEvents(callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'events.xml', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            const events = [];
            const xml = xhr.responseXML;
            const eventNodes = xml.getElementsByTagName('event');
            for (let i = 0; i < eventNodes.length; i++) {
                const date = eventNodes[i].getElementsByTagName('date')[0]?.textContent;
                const startDate = eventNodes[i].getElementsByTagName('start-date')[0]?.textContent;
                const endDate = eventNodes[i].getElementsByTagName('end-date')[0]?.textContent;
                const name = eventNodes[i].getElementsByTagName('name')[0].textContent;
                const className = eventNodes[i].getElementsByTagName('class')[0].textContent;
                const img = eventNodes[i].getElementsByTagName('img')[0]?.textContent || 'pics/logo.png';
                const description = eventNodes[i].getElementsByTagName('description')[0].textContent;
                const sectionId = className === 'concert' ? 'concerts' : 'events';
                if (date) {
                    events.push({ date: new Date(date), name: name, className: className, img: img, description: description, sectionId: sectionId });
                } else if (startDate && endDate) {
                    events.push({ startDate: new Date(startDate), endDate: new Date(endDate), name: name, className: className, img: img, description: description });
                }
            }

            // Sort events by date
            events.sort((a, b) => a.date - b.date);

            callback(events);
        }
    };
    xhr.send();
}

function createEventEntry(event) {
    const entry = document.createElement('div');
    entry.className = 'event-entry';

    if (event.img) {
        const img = document.createElement('img');
        img.src = event.img;
        img.alt = event.name;
        img.className = 'event-img';
        img.addEventListener('click', function() {
            showImagePopup(event.img, event.name);
        });
        entry.appendChild(img);
    }

    const info = document.createElement('div');
    info.className = 'event-info';

    if (event.date) {
        const date = document.createElement('p');
        date.className = 'event-date';
        date.textContent = event.date.toLocaleDateString('de-DE');
        info.appendChild(date);
    }

    const name = document.createElement('h3');
    name.className = 'event-name';
    name.textContent = event.name;
    info.appendChild(name);

    const description = document.createElement('p');
    description.className = 'event-description';
    description.textContent = event.description;
    info.appendChild(description);

    entry.appendChild(info);

    // Add condition to check if the event is a break
    if (event.className === 'break') {
        entry.onclick = function() {
            showImagePopup(event.img, event.name);
        };
    } else {
        entry.onclick = () => showSection(event.sectionId);
    }

    return entry;
}

function renderEventEntries(events) {
    const concertsContainer = document.getElementById('next-concerts');
    const eventsContainer = document.getElementById('next-events');
    const pastConcertsContainer = document.getElementById('past-concerts-container');
    const pastEventsContainer = document.getElementById('past-events-container');
    
    concertsContainer.innerHTML = '';
    eventsContainer.innerHTML = '';
    pastConcertsContainer.innerHTML = '';
    pastEventsContainer.innerHTML = '';
    
    const today = new Date();
    events.forEach(event => {
        const entry = createEventEntry(event);
        const eventDate = new Date(event.date);
    
        if (event.className === 'concert') {
            if (event.date && eventDate < today) {
                pastConcertsContainer.appendChild(entry);
            } else {
                concertsContainer.appendChild(entry);
            }
        } else {
            if (event.date && eventDate < today) {
                pastEventsContainer.appendChild(entry);
            } else {
                eventsContainer.appendChild(entry);
            }
        }
    });
}

function createCalendar(weekStart, additionalEvents) {
    const calendar = document.createElement('table');
    const header = document.createElement('tr');
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    daysOfWeek.forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        header.appendChild(th);
    });
    calendar.appendChild(header);
    
    const row = document.createElement('tr');
    for (let i = 0; i < 7; i++) {
        const cell = document.createElement('td');
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const day = date.getDate();
        cell.textContent = day;

        // Check for multi-day events first
        const multiDayEvent = additionalEvents.find(event => 
            event.startDate && event.endDate &&
            date >= event.startDate && date <= event.endDate
        );
        if (multiDayEvent) {
            cell.className = multiDayEvent.className;
            cell.innerHTML += `<br>${multiDayEvent.name}`;
        } else {
            // Apply additional single-day event styles and names
            const singleDayEvent = additionalEvents.find(event => 
                event.date &&
                event.date.getDate() === date.getDate() && 
                event.date.getMonth() === date.getMonth() && 
                event.date.getFullYear() === date.getFullYear()
            );
            if (singleDayEvent) {
                cell.className = singleDayEvent.className;
                cell.innerHTML += `<br><span class="clickable" onclick="showSection('${singleDayEvent.sectionId}')">${singleDayEvent.name}</span>`;
            } else {
                // Apply usual day styles and names
                const dayOfWeek = (date.getDay() + 6) % 7; // Adjust for Monday start
                if (usualDays[dayOfWeek]) {
                    cell.className = usualDays[dayOfWeek].className;
                    if (usualDays[dayOfWeek].sectionId) {
                        cell.innerHTML += `<br><span class="clickable" onclick="showSection('${usualDays[dayOfWeek].sectionId}')">${usualDays[dayOfWeek].name}</span>`;
                    } else {
                        cell.innerHTML += `<br>${usualDays[dayOfWeek].name}`;
                    }
                }
            }
        }

        row.appendChild(cell);
    }
    calendar.appendChild(row);
    return calendar;
}

function updateTitle(startOfWeek) {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const options = { month: 'short', day: 'numeric' };
    document.getElementById('calendar-title').textContent = 
        `${startOfWeek.toLocaleDateString('de-DE', options)} - ${endOfWeek.toLocaleDateString('de-DE', options)}`;
}

const calendarDiv = document.getElementById('calendar');
let startOfWeek = new Date();
startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // Start of the current week (Monday)

function renderCalendar() {
    calendarDiv.innerHTML = ''; // Clear previous calendar
    loadAdditionalEvents(function(events) {
        const calendar = createCalendar(startOfWeek, events);
        calendarDiv.appendChild(calendar);
        updateTitle(startOfWeek);
        renderEventEntries(events);
    });
}

document.getElementById('prev-week').addEventListener('click', function() {
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    renderCalendar();
});

document.getElementById('next-week').addEventListener('click', function() {
    startOfWeek.setDate(startOfWeek.getDate() + 7);
    renderCalendar();
});

renderCalendar(); // Initial render

// Event listeners for navigation
document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();
        const sectionId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
        showSection(sectionId);
    });
});

function isWithinTimeRange(startTime, endTime, currentTime) {
    if (startTime > endTime) { // Handles cases where endTime is past midnight
        return currentTime >= startTime || currentTime <= endTime;
    }
    return currentTime >= startTime && currentTime <= endTime;
}

function updateNeonSign() {
    const today = new Date();
    const currentDay = today.getDay(); // Sunday - Saturday : 0 - 6
    const currentTime = today.getHours() + today.getMinutes() / 60;

    const openTimes = [
        { start: 21, end: 1 }, // Montag bis Donnerstag
        { start: 22, end: 3 }, // Freitag bis Samstag
    ];

    const statusText = document.getElementById('status-text');
    const openText = document.getElementById('open-text');
    const breakName = document.getElementById('break-name');

    loadAdditionalEvents((events) => {
        let onBreak = false;

        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const startDate = event.startDate;
            const endDate = event.endDate;

            if (startDate && endDate) {
                if (today >= startDate && today <= endDate) {
                    statusText.style.display = 'none';
                    openText.style.display = 'none';
                    breakName.style.display = 'block';
                    breakName.innerHTML = `${event.name}<br>Reopening: ${new Date(endDate).toLocaleDateString()}`;
                    onBreak = true;
                    break;
                }
            }
        }

        if (!onBreak) {
            let openTime;
            if (currentDay >= 1 && currentDay <= 4) { // Montag bis Donnerstag
                openTime = openTimes[0];
            } else if (currentDay === 5 || currentDay === 6) { // Freitag bis Samstag
                openTime = openTimes[1];
            } else { // Sunday
                statusText.textContent = 'We are';
                openText.textContent = 'CLOSED';
                return;
            }

            const isOpen = isWithinTimeRange(openTime.start, openTime.end, currentTime);
            statusText.style.display = 'block';
            breakName.style.display = 'none';
            if (isOpen) {
                statusText.textContent = 'We are';
                openText.textContent = 'OPEN';
            } else {
                statusText.textContent = 'Opening at';
                openText.innerHTML = `${openTime.start}:00`;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    updateNeonSign();
    setInterval(updateNeonSign, 60000); // Update every minute
});

function toggleMenu() {
    const nav = document.querySelector('nav ul');
    const toggle = document.getElementById('menu-toggle');

    if (nav.classList.contains('active')) {
        nav.classList.remove('active');
        toggle.innerHTML = '▼';
    } else {
        nav.classList.add('active');
        toggle.innerHTML = '▲';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Show menu on load for mobile
    if (window.innerWidth <= 768) {
        document.querySelector('nav ul').classList.add('active');
        document.getElementById('menu-toggle').innerHTML = '▲';
    }
});
