# (A) INIT
# (A1) LOAD REQUIRED PACKAGES
from flask import Flask, render_template, make_response, request, redirect, url_for, jsonify, flash
from werkzeug.datastructures import ImmutableMultiDict
import bcrypt, jwt, time, random, json, os
from datetime import datetime, timedelta
import calendar
from functools import wraps

# (A2) FLASK INIT
app = Flask(__name__)
app.secret_key = "YOUR_SECRET_KEY"
# app.debug = True

# (A3) SETTINGS
HOST_NAME = "localhost"
HOST_PORT = 80
JWT_KEY = "YOUR-SECRET-KEY"
JWT_ISS = "YOUR-NAME"
JWT_ALGO = "HS512"
BANDS_FILE = "bands.json"
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# (B) USERS DATA
USERS_FILE = "users.json"
EVENTS_FILE = "events.json"

# Load users from JSON file
try:
    with open(USERS_FILE, "r") as file:
        USERS = json.load(file)
except FileNotFoundError:
    USERS = []

# Load bands from JSON file
try:
    with open(BANDS_FILE, "r") as file:
        BANDS = json.load(file)
except FileNotFoundError:
    BANDS = {"bands": []}

# Load events from JSON file
try:
    with open(EVENTS_FILE, "r") as file:
        EVENTS = json.load(file)
except FileNotFoundError:
    EVENTS = {}

# Helper function to save users to JSON file
def save_users():
    with open(USERS_FILE, "w") as file:
        json.dump(USERS, file, indent=2)

# Helper function to save bands to JSON file
def save_bands():
    with open(BANDS_FILE, "w") as file:
        json.dump(BANDS, file, indent=2)

# Helper function to save events to JSON file
def save_events():
    with open(EVENTS_FILE, "w") as file:
        json.dump(EVENTS, file, indent=2)

# (C) JSON WEB TOKEN
# (C1) GENERATE JWT
def jwtSign(email, role):
    rnd = "".join(random.choice("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^_-") for i in range(24))
    now = int(time.time())
    return jwt.encode({
        "iat": now,  # ISSUED AT - TIME WHEN TOKEN IS GENERATED
        "nbf": now,  # NOT BEFORE - WHEN THIS TOKEN IS CONSIDERED VALID
        "exp": now + 3600,  # EXPIRY - 1 HR (3600 SECS) FROM NOW IN THIS EXAMPLE
        "jti": rnd,  # RANDOM JSON TOKEN ID
        "iss": JWT_ISS,  # ISSUER
        "data": {"email": email, "role": role}
    }, JWT_KEY, algorithm=JWT_ALGO)

# (C2) VERIFY JWT
def jwtVerify(cookies):
    try:
        user = jwt.decode(cookies.get("JWT"), JWT_KEY, algorithms=[JWT_ALGO])
        return user["data"]
    except:
        return False

# (C3) GET USER DATA BY EMAIL
def getUserByEmail(email):
    for user in USERS:
        if user["email"] == email:
            return user
    return None

# (C4) ROLE-BASED ACCESS DECORATOR
def role_required(required_roles):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            user = jwtVerify(request.cookies)
            if not user or user.get("role") not in required_roles:
                return redirect(url_for("login"))
            return fn(*args, **kwargs)
        return decorated_view
    return wrapper

# (D) ROUTES
# (D1) ADMIN PAGE
@app.route('/')
@role_required(["admin", "vorstand", "manager", "user"])
def schichtplan():
    user = jwtVerify(request.cookies)
    user_info = getUserByEmail(user["email"])

    # Convert all event dates to "YYYY-MM-DD" strings for consistent display
    for event in calendar_data['events']:
        if isinstance(event['date'], datetime):
            event['date'] = event['date'].strftime('%Y-%m-%d')

    return render_template(
        "schichtplan.html",
        title="Home Page",
        user=user_info,
        active_page="Schichtplan",
        calendar_data=calendar_data,
        month_data=month_data,
        month_name=month_name
    )


# (D2) LOGIN PAGE
@app.route("/login")
def login():
    if jwtVerify(request.cookies):
        return redirect(url_for("index"))
    else:
        return render_template("3-login.html")

# (D3) LOGIN ENDPOINT
@app.route("/in", methods=["POST"])
def lin():
    data = dict(request.form)
    user = getUserByEmail(data["email"])
    valid = user is not None and bcrypt.checkpw(data["password"].encode("utf-8"), user["password"].encode("utf-8"))
    msg = "OK" if valid else "Invalid email/password"
    res = make_response(msg, 200)
    if valid:
        res.set_cookie("JWT", jwtSign(data["email"], user["role"]))
    return res

# (D4) LOGOUT ENDPOINT
@app.route("/out", methods=["POST"])
def lout():
    res = make_response("OK", 200)
    res.delete_cookie("JWT")
    return res

# (D5) ADD USER PAGE
@app.route("/mitglieder")
@role_required(["admin","user"])
def add_user_page():
    user = jwtVerify(request.cookies)
    user_info = getUserByEmail(user["email"])
    return render_template("mitglieder.html", user=user_info, members=USERS)

# (D6) ADD USER ENDPOINT
@app.route("/add_user", methods=["POST"])
@role_required(["admin"])
def add_user():
    data = dict(request.form)
    new_user = {
        "name": data.get("name", ""),
        "email": data.get("email"),
        "password": bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
        "role": data.get("role", "user"),
        "phonenumber": data.get("phonenumber", None),
        "show_email": data.get("show_email", "off") == "on",
        "show_phonenumber": data.get("show_phonenumber", "off") == "on",
        "description": data.get("description", "")
    }
    USERS.append(new_user)
    save_users()
    return redirect(url_for("index"))

# (D7) BOOKING PAGE
@app.route("/booking")
@role_required(["admin", "vorstand", "manager","user"])
def booking_page():
    user = jwtVerify(request.cookies)
    user_info = getUserByEmail(user["email"])
    return render_template("booking.html", user=user_info, bands_data=BANDS)

# (D8) ADD BAND ENDPOINT
@app.route("/add_band", methods=["POST"])
@role_required(["admin", "vorstand", "manager"])
def add_band():
    data = request.form
    logo = request.files["logo"]
    logo_path = None
    if logo:
        logo_filename = f"{time.time()}_{logo.filename}"
        logo_path = os.path.join(app.config["UPLOAD_FOLDER"], logo_filename)
        logo.save(logo_path)
        logo_path = f"/{logo_path}"
    new_band = {
        "name": data.get("band_name"),
        "logo": logo_path,
        "genre": data.get("genre"),
        "contact": data.get("contact"),
        "doordeal": data.get("doordeal") == "on",
        "door_price": float(data.get("door_price", 0) or 0),
        "fixed_price": float(data.get("fixed_price", 0) or 0),
        "last_booked": data.get("last_booked"),
        "comment": data.get("comment", "")
    }
    BANDS["bands"].append(new_band)
    save_bands()
    return redirect(url_for("booking_page"))

# Load calendar data from JSON file
if os.path.exists('calendar_data.json'):
    with open('calendar_data.json', 'r') as f:
        calendar_data = json.load(f)
else:
    calendar_data = {'events': []}

# Set up month data to correctly represent the month's first day and days
current_date = datetime.now().date()  # Only use the date part
month_data = {
    'month': current_date.month,
    'year': current_date.year,
    'first_day': datetime(current_date.year, current_date.month, 1).weekday(),  # Start on the actual weekday without +1
    'days': [
        {
            'day': i + 1,
            'date': datetime(current_date.year, current_date.month, i + 1).date(),  # Strip time here too
            'is_past': datetime(current_date.year, current_date.month, i + 1).date() < current_date,
            'is_today': datetime(current_date.year, current_date.month, i + 1).date() == current_date
        } for i in range(calendar.monthrange(current_date.year, current_date.month)[1])
    ]
}

def month_name(month):
    months = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ]
    return months[month - 1]


@app.route('/create_event', methods=['POST'])
def create_event():
    event_name = request.form.get('event_name')
    event_description = request.form.get('event_description')
    event_date = request.form.get('event_date')
    event_type = request.form.get('event_type')
    entry_time = request.form.get('entry_time')
    price = request.form.get('price')
    tur_schicht = 'tur_schicht' in request.form
    doppel_schicht = 'doppel_schicht' in request.form
    weekly = 'weekly' in request.form
    replace = 'replace' in request.form

    # Handle Konzert-specific fields
    acts = request.form.get('acts') if event_type == 'Konzert' else None
    genre = request.form.get('genre') if event_type == 'Konzert' else None
    
    # Handle Pause-specific fields
    event_date_from = request.form.get('event_date_from') if event_type == 'Pause' else None
    event_date_to = request.form.get('event_date_to') if event_type == 'Pause' else None

    # Create the event dictionary
    if event_type == 'Putzschicht':
        shifts = {
            'putz_1': None,
            'putz_2': None
        }
    else:
        shifts = {
            'theke_1_1': None,
            'theke_1_2': None,
            'door_1_1': None,
            'door_1_2': None,
            'theke_2_1': None,
            'theke_2_2': None,
            'door_2_1': None,
            'door_2_2': None
        }

    event = {
        'name': event_name,
        'description': event_description,
        'date': event_date,
        'type': event_type,
        'entry_time': entry_time,
        'price': price,
        'needs_door_shift': tur_schicht,
        'has_double_shifts': doppel_schicht,
        'shifts': shifts,
        'acts': acts,
        'genre': genre,
        'date_range': {'from': event_date_from, 'to': event_date_to}
    }

    if weekly:
        # Handle weekly events
        current_date = datetime.strptime(event_date, '%Y-%m-%d')
        while current_date.year < datetime.now().year + 1:  # Limit to adding weekly events for the next year
            if replace:
                # Remove any existing event on this date
                calendar_data['events'] = [e for e in calendar_data['events'] if e['date'] != current_date.strftime('%Y-%m-%d')]
            event_copy = event.copy()
            event_copy['date'] = current_date.strftime('%Y-%m-%d')
            calendar_data['events'].append(event_copy)
            current_date += timedelta(weeks=1)
    else:
        # Add single event or add to existing weekly event
        if replace:
            calendar_data['events'] = [e for e in calendar_data['events'] if e['date'] != event_date]
        calendar_data['events'].append(event)

    save_calendar_data()
    flash('Event successfully created!')
    return redirect(url_for('schichtplan'))

@app.route('/assign_shift', methods=['POST'])
def assign_shift():
    event_date = request.form.get('event_date')
    shift_number = request.form.get('shift_number')
    
    # Get the username from the verified JWT user
    user = jwtVerify(request.cookies)
    if not user:
        return "Unauthorized", 401
    username = getUserByEmail(user["email"])["name"]  # Actual username

    for event in calendar_data['events']:
        if event['date'] == event_date:
            if event['shifts'][shift_number] is None:
                event['shifts'][shift_number] = username  # Save the username
                save_calendar_data()
                flash('Shift successfully claimed!')
            else:
                return 'Shift already taken', 400

    return '', 200

@app.route('/unassign_shift', methods=['POST'])
def unassign_shift():
    event_date = request.form.get('event_date')
    
    # Get the username from the verified JWT user
    user = jwtVerify(request.cookies)
    if not user:
        return "Unauthorized", 401
    username = getUserByEmail(user["email"])["name"]  # Actual username

    for event in calendar_data['events']:
        if event['date'] == event_date:
            for shift, assigned_user in event['shifts'].items():
                if assigned_user == username:
                    event['shifts'][shift] = None
                    save_calendar_data()
                    flash('Shift successfully unclaimed!')
                    break  # Exit loop once shift is unassigned

    return '', 200


@app.route('/change_month', methods=['POST'])
def change_month():
    direction = request.form.get('direction')
    if direction == 'prev':
        if month_data['month'] == 1:
            month_data['month'] = 12
            month_data['year'] -= 1
        else:
            month_data['month'] -= 1
    elif direction == 'next':
        if month_data['month'] == 12:
            month_data['month'] = 1
            month_data['year'] += 1
        else:
            month_data['month'] += 1
    # Update first day and days for the new month
    month_data['first_day'] = (datetime(month_data['year'], month_data['month'], 1).weekday() + 1) % 7
    month_data['days'] = [{'day': i + 1, 'date': datetime(month_data['year'], month_data['month'], i + 1),
                           'is_past': datetime(month_data['year'], month_data['month'], i + 1) < datetime.now(),
                           'is_today': datetime(month_data['year'], month_data['month'], i + 1).date() == datetime.now().date()} for i in range(calendar.monthrange(month_data['year'], month_data['month'])[1])]
    return redirect(url_for('schichtplan'))

# Helper function to save calendar data to JSON
def save_calendar_data():
    with open('calendar_data.json', 'w') as f:
        json.dump(calendar_data, f, indent=4)

# (D9) EDIT EVENT ENDPOINT
@app.route('/edit_event/<event_date>', methods=['GET', 'POST'])
@role_required(["admin", "vorstand"])
def edit_event(event_date):
    user = jwtVerify(request.cookies)
    if request.method == 'POST':
        for event in calendar_data['events']:
            if event['date'] == event_date:
                event['name'] = request.form.get('event_name')
                event['description'] = request.form.get('event_description')
                event['entry_time'] = request.form.get('entry_time')
                event['price'] = request.form.get('price')
                event['acts'] = request.form.get('acts') if event['type'] == 'Konzert' else None
                event['genre'] = request.form.get('genre') if event['type'] == 'Konzert' else None
                save_calendar_data()
                flash('Event successfully updated!')
                break
        return redirect(url_for('schichtplan'))
    event_data = next((event for event in calendar_data['events'] if event['date'] == event_date), None)
    return render_template('edit_event.html', event=event_data)

# (D10) DELETE EVENT ENDPOINT
@app.route('/delete_event/<event_date>', methods=['POST'])
@role_required(["admin", "vorstand"])
def delete_event(event_date):
    calendar_data['events'] = [e for e in calendar_data['events'] if e['date'] != event_date]
    save_calendar_data()
    flash('Event successfully deleted!')
    return redirect(url_for('schichtplan'))

# (D11) ROUTE FOR ADD NEWS
NEWS_JSON_PATH = "news_data.json"  # Define the path for your JSON file

@app.route("/news")
@role_required(["admin", "user"])
def view_news():
    # Retrieve the user from JWT
    user = jwtVerify(request.cookies)
    user_info = getUserByEmail(user["email"]) if user else None

    # Load news data from JSON file or initialize an empty list if the file doesn’t exist
    if os.path.exists(NEWS_JSON_PATH):
        with open(NEWS_JSON_PATH, "r", encoding="utf-8") as json_file:
            news_data = json.load(json_file)
    else:
        news_data = []

    # Render the template with news data and user info
    return render_template("news.html", news_data=news_data, user=user_info)


@app.route("/add-news", methods=["POST"])
@role_required(["admin"])
def add_news():
    title = request.form.get("title")
    description = request.form.get("description")
    date = datetime.now().strftime('%Y-%m-%d')  # Store date in YYYY-MM-DD format internally
    image_path = None

    # Handle file upload
    if "image" in request.files:
        image = request.files["image"]
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            image.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
            image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    # Load existing news entries
    if os.path.exists(NEWS_JSON_PATH):
        with open(NEWS_JSON_PATH, "r", encoding="utf-8") as json_file:
            news_data = json.load(json_file)
    else:
        news_data = []

    # Create a new news entry
    new_entry = {
        "id": len(news_data) + 1,
        "title": title,
        "date": date,  # Stored in standard format, displayed in German format
        "description": description,
        "image_path": image_path
    }

    # Add the new entry to the list and save to JSON
    news_data.insert(0, new_entry)  # Insert at the beginning for newest on top
    with open(NEWS_JSON_PATH, "w", encoding="utf-8") as json_file:
        json.dump(news_data, json_file, ensure_ascii=False, indent=4)

    flash("News entry added successfully!")
    return redirect(url_for("view_news"))

@app.template_filter("dateformat")
def dateformat(value, format="%d.%m.%Y"):
    if isinstance(value, str):
        value = datetime.strptime(value, '%Y-%m-%d')  # Parse string if needed
    return value.strftime(format)

# (E) START!
if __name__ == "__main__":
    app.run(HOST_NAME, HOST_PORT)