document.addEventListener('DOMContentLoaded', function () {
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
    
    // Example: Call showSection to show the home section by default
    document.addEventListener('DOMContentLoaded', () => {
        showSection('home');
    });
    

    const usualDays = {
        0: {name: 'Queer-Kneipe', className: 'queerkneipe'}, // Sunday
        1: {name: 'Das Labor', className: 'das-labor'}, // Monday
        2: {name: 'Mixed Music', className: 'mixed-music'}, // Tuesday
        3: {name: 'Punk-Kneipe', className: 'punkkneipe'}, // Wednesday
        4: {name: 'Kneipe', className: 'kneipe'}, // Thursday
        5: {name: 'Kneipe', className: 'kneipe'}, // Friday
        6: {name: 'Geschlossen', className: 'geschlossen'} // Saturday
    };

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
                    if (date) {
                        events.push({ date: new Date(date), name: name, className: className });
                    } else if (startDate && endDate) {
                        events.push({ startDate: new Date(startDate), endDate: new Date(endDate), name: name, className: className });
                    }
                }
                callback(events);
            }
        };
        xhr.send();
    }

    function createCalendar(weekStart, additionalEvents) {
        const calendar = document.createElement('table');
        const header = document.createElement('tr');
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat','Sun' ];
        
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
                // Apply usual day styles and names
                const dayOfWeek = date.getDay();
                if (usualDays[dayOfWeek]) {
                    cell.className = usualDays[dayOfWeek].className;
                    cell.innerHTML += `<br>${usualDays[dayOfWeek].name}`;
                }
                
                // Apply additional event styles and names
                const event = additionalEvents.find(event => 
                    event.date &&
                    event.date.getDate() === date.getDate() && 
                    event.date.getMonth() === date.getMonth() && 
                    event.date.getFullYear() === date.getFullYear()
                );
                if (event) {
                    cell.className = event.className;
                    cell.innerHTML += `<br>${event.name}`;
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
            `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`;
    }

    const calendarDiv = document.getElementById('calendar');
    let startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of the current week

    function renderCalendar() {
        calendarDiv.innerHTML = ''; // Clear previous calendar
        loadAdditionalEvents(function(events) {
            const calendar = createCalendar(startOfWeek, events);
            calendarDiv.appendChild(calendar);
            updateTitle(startOfWeek);
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
});
