from flask import Flask, render_template, make_response, request, redirect, url_for, jsonify
import bcrypt, jwt, time, random, calendar, os, json
from datetime import datetime

app = Flask(__name__)

# Settings
HOST_NAME = "localhost"
HOST_PORT = 80
JWT_KEY = "YOUR-SECRET-KEY"
JWT_ISS = "YOUR-NAME"
JWT_ALGO = "HS512"
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Data structure to store calendar events and shifts
calendar_data = {
    "events": [],
}

# List of admin users by username
ADMIN_USERS = ["admin"]

# Predefined weekly events
predefined_events = {
    0: {"name": "Queer-Kneipe", "needs_door_shift": False, "has_double_shifts": False},
    1: {"name": "Das Labor", "needs_door_shift": True, "has_double_shifts": True},
    3: {"name": "Punk-Kneipe", "needs_door_shift": False, "has_double_shifts": False},
    4: {"name": "Kneipe", "needs_door_shift": False, "has_double_shifts": False},
    5: {"name": "Kneipe", "needs_door_shift": False, "has_double_shifts": False},
}
def month_name(month_number):
    # List of German month names
    german_months = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ]
    return german_months[month_number - 1]

@app.context_processor
def utility_processor():
    return dict(month_name=month_name)
# JWT Verification using username
def jwtVerify(cookies):
    try:
        user = jwt.decode(cookies.get("JWT"), JWT_KEY, algorithms=[JWT_ALGO])
        return user["data"]
    except:
        return False

# Helper function to get month data
current_month = datetime.now().month
current_year = datetime.now().year

def get_month_data(month, year):
    first_day, num_days = calendar.monthrange(year, month)
    first_day = (first_day) % 7  # Adjust to start on Monday
    today = datetime.now().date()

    days = []
    for i in range(1, num_days + 1):
        day_date = datetime(year, month, i).date()
        days.append({
            'day': i,
            'date': day_date,
            'is_today': day_date == today,
            'is_past': day_date < today
        })

    return {
        "year": year,
        "month": month,
        "days": days,
        "first_day": first_day
    }
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

BANDS_DATA_FILE = 'bands_data.json'

# Load or initialize bands data
def load_bands_data():
    if os.path.exists(BANDS_DATA_FILE) and os.path.getsize(BANDS_DATA_FILE) > 0:
        with open(BANDS_DATA_FILE, 'r') as f:
            return json.load(f)
    else:
        return {"bands": []}

def save_bands_data(bands_data):
    with open(BANDS_DATA_FILE, 'w') as f:
        json.dump(bands_data, f)

@app.route('/booking')
def booking():
    user = jwtVerify(request.cookies)
    if not user:
        return redirect(url_for("login"))

    bands_data = load_bands_data()
    return render_template('4-booking.html', bands_data=bands_data)


@app.route('/add_band', methods=['POST'])
def add_band():
    user = jwtVerify(request.cookies)
    if not user or user['username'] not in ADMIN_USERS:
        return redirect(url_for("login"))

    band_name = request.form.get('band_name')
    genre = request.form.get('genre')
    contact = request.form.get('contact')
    doordeal = request.form.get('doordeal') == 'on'
    door_price = request.form.get('door_price')
    fixed_price = request.form.get('fixed_price')
    last_booked = request.form.get('last_booked')
    comment = request.form.get('comment')
    logo = request.files.get('logo')

    logo_filename = None
    if logo:
        logo_filename = os.path.join(UPLOAD_FOLDER, logo.filename)
        logo.save(logo_filename)

    bands_data = load_bands_data()
    new_band = {
        "name": band_name,
        "logo": logo_filename,
        "genre": genre,
        "contact": contact,
        "doordeal": doordeal,
        "door_price": door_price,
        "fixed_price": fixed_price,
        "last_booked": last_booked,
        "comment": comment
    }
    bands_data['bands'].append(new_band)
    save_bands_data(bands_data)

    return redirect(url_for('booking'))


# Function to add predefined weekly events to the calendar
def add_predefined_events(month, year):
    for day in range(1, calendar.monthrange(year, month)[1] + 1):
        date = datetime(year, month, day)
        date_str = date.strftime("%Y-%m-%d")
        weekday = date.weekday()

        existing_event = next((event for event in calendar_data['events'] if event['date'] == date_str), None)
        if existing_event:
            continue

        if weekday in predefined_events:
            event_details = {
                "name": predefined_events[weekday]["name"],
                "date": date_str,
                "needs_door_shift": predefined_events[weekday]["needs_door_shift"],
                "has_double_shifts": predefined_events[weekday]["has_double_shifts"],
                "entry_time": "20:00",
                "price": None,
                "acts": [],
                "image": None,
                "is_predefined": True,
                "shifts": {
                    "theke_1_1": None,
                    "theke_1_2": None,
                    "door_1_1": None if predefined_events[weekday]["needs_door_shift"] else "Not Applicable",
                    "door_1_2": None if predefined_events[weekday]["needs_door_shift"] else "Not Applicable",
                }
            }

            if predefined_events[weekday]["has_double_shifts"]:
                event_details["shifts"].update({
                    "theke_2_1": None,
                    "theke_2_2": None,
                    "door_2_1": None if predefined_events[weekday]["needs_door_shift"] else "Not Applicable",
                    "door_2_2": None if predefined_events[weekday]["needs_door_shift"] else "Not Applicable",
                })

            calendar_data['events'].append(event_details)

# Create a new event and purge any predefined event for the same date
@app.route('/create_event', methods=['POST'])
def create_event():
    user = jwtVerify(request.cookies)
    if user == False or user['username'] not in ADMIN_USERS:
        return redirect(url_for("index"))

    event_name = request.form.get('event_name')
    event_description = request.form.get('event_description')
    event_date_from = request.form.get('event_date_from')
    event_date_to = request.form.get('event_date_to')
    event_type = request.form.get('event_type')
    start_time = request.form.get('start_time')
    acts = request.form.get('acts')
    genre = request.form.get('genre')
    entry_time = request.form.get('entry_time')
    price = request.form.get('price')
    needs_door_shift = request.form.get('tur_schicht') == 'on'
    has_double_shifts = request.form.get('doppel_schicht') == 'on'
    event_image = request.files.get('event_image')

    # Save the image file if uploaded
    image_filename = None
    if event_image:
        image_filename = os.path.join(UPLOAD_FOLDER, event_image.filename)
        event_image.save(image_filename)

    # Parse the list fields if needed
    acts_list = [act.strip() for act in acts.split(',')] if acts else []
    genre_list = [genre.strip() for genre in genre.split(',')] if genre else []

    shifts = {
        "theke_1_1": None,
        "theke_1_2": None,
        "door_1_1": None if needs_door_shift else "Not Applicable",
        "door_1_2": None if needs_door_shift else "Not Applicable",
    }

    if has_double_shifts:
        shifts.update({
            "theke_2_1": None,
            "theke_2_2": None,
            "door_2_1": None if needs_door_shift else "Not Applicable",
            "door_2_2": None if needs_door_shift else "Not Applicable",
        })

    # Remove any predefined events for the selected date range
    calendar_data['events'] = [
        event for event in calendar_data['events']
        if not (event_date_from <= event['date'] <= event_date_to)
    ]

    event_details = {
        "name": event_name,
        "description": event_description,
        "date_from": event_date_from,
        "date_to": event_date_to,
        "type": event_type,
        "start_time": start_time,
        "acts": acts_list,
        "genre": genre_list,
        "entry_time": entry_time,
        "price": price,
        "needs_door_shift": needs_door_shift,
        "has_double_shifts": has_double_shifts,
        "image": image_filename,
        "is_predefined": False,
        "shifts": shifts
    }

    calendar_data['events'].append(event_details)

    with open('calendar_data.json', 'w') as f:
        json.dump(calendar_data, f)

    return redirect(url_for('index'))

USERS_FILE = 'users.json'

def load_users():
    if os.path.exists(USERS_FILE) and os.path.getsize(USERS_FILE) > 0:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    else:
        return {"users": []}

def save_users(users_data):
    with open(USERS_FILE, 'w') as f:
        json.dump(users_data, f)

@app.route('/create_user', methods=['POST'])
def create_user():
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    role = request.form['role']  # Get the role from the form

    # Load existing users
    users_data = load_users()

    # Validate user input
    if not username or not email or not password or not role:
        return jsonify({'error': 'Please fill in all fields'}), 400

    # Check if username is unique
    if any(user['username'] == username for user in users_data['users']):
        return jsonify({'error': 'Username already exists'}), 400

    # Hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Create new user dictionary
    new_user = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": role  # Store the role
    }

    # Add new user to the list and save
    users_data['users'].append(new_user)
    save_users(users_data)

    return jsonify({'success': 'User created successfully'}), 201


# Display the calendar
@app.route("/")
def index():
    if os.path.exists('calendar_data.json') and os.path.getsize('calendar_data.json') > 0:
        with open('calendar_data.json', 'r') as f:
            global calendar_data
            calendar_data = json.load(f)

    user = jwtVerify(request.cookies)
    if user == False:
        return redirect(url_for("login"))
    else:
        month_data = get_month_data(current_month, current_year)
        add_predefined_events(current_month, current_year)  # Add predefined events before rendering

        is_admin = user["username"] in ADMIN_USERS

        # Set the image path based on whether the user is admin or not
        img_src = "static/pic3.png" if is_admin else "static/pic2.png"

        # Render different templates based on user role
        if is_admin:
            return render_template(
                "2-home.html", 
                title="Home Page", 
                user=user["username"], 
                calendar_data=calendar_data, 
                month_data=month_data, 
                predefined_events=predefined_events, 
                is_admin=is_admin, 
                allow_create_event=is_admin, 
                img_src=img_src  # Pass the image source to the template
            )
        else:
            return render_template(
                "2-home-1.html", 
                title="Home Page", 
                user=user["username"], 
                calendar_data=calendar_data, 
                month_data=month_data, 
                predefined_events=predefined_events, 
                is_admin=is_admin, 
                allow_create_event=is_admin, 
                img_src=img_src  # Pass the image source to the template
            )

# Assign shift to user
@app.route('/assign_shift', methods=['POST'])
def assign_shift():
    user = jwtVerify(request.cookies)
    if not user:
        return jsonify({'error': 'User is not authenticated'}), 400

    event_date = request.form.get('event_date')
    shift_number = request.form.get('shift_number')

    if not event_date or not shift_number:
        return jsonify({'error': 'Missing event_date or shift_number in request'}), 400

    username = user['username']

    for event in calendar_data['events']:
        if event['date'] == event_date:
            # Check if the user already has a shift claimed
            if username in event['shifts'].values():
                return jsonify({'error': 'User already has a shift claimed for this day'}), 400

            # Assign the shift if it's available
            if shift_number in event['shifts']:
                current_shift = event['shifts'][shift_number]

                if current_shift is None:
                    event['shifts'][shift_number] = username
                elif isinstance(current_shift, str) and current_shift != username:
                    event['shifts'][shift_number] = [current_shift, username]
                elif isinstance(current_shift, list) and username not in current_shift and len(current_shift) < 2:
                    current_shift.append(username)

            break
    else:
        return jsonify({'error': 'Event not found for the given date'}), 400

    with open('calendar_data.json', 'w') as f:
        json.dump(calendar_data, f)

    return jsonify({'success': 'Shift assigned successfully'}), 200

# Unassign shift
@app.route('/unassign_shift', methods=['POST'])
def unassign_shift():
    user = jwtVerify(request.cookies)
    if not user:
        return jsonify({'error': 'User is not authenticated'}), 400

    event_date = request.form.get('event_date')

    username = user['username']

    for event in calendar_data['events']:
        if event['date'] == event_date:
            for shift_key, shift_value in event['shifts'].items():
                if shift_value == username:
                    event['shifts'][shift_key] = None
                    break

    with open('calendar_data.json', 'w') as f:
        json.dump(calendar_data, f)

    return jsonify({'success': 'Shift unassigned successfully'}), 200


# Shift missing endpoint
@app.route('/missing_shifts', methods=['GET'])
def missing_shifts():
    missing = []
    for event in calendar_data['events']:
        if not event['shifts']['theke_1_1'] or not event['shifts']['theke_1_2'] or (event['needs_door_shift'] and (not event['shifts']['door_1_1'] or not event['shifts']['door_1_2'])):
            missing.append(event)
    return jsonify(missing)

# Change month (previous/next)
@app.route('/change_month', methods=['POST'])
def change_month():
    global current_month, current_year
    direction = request.form.get('direction')
    if direction == 'next':
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
    elif direction == 'prev':
        current_month -= 1
        if current_month < 1:
            current_month = 12
            current_year -= 1
    return redirect(url_for('index'))

# Login page
@app.route("/login")
def login():
    if jwtVerify(request.cookies):
        return redirect(url_for("index"))
    else:
        return render_template("3-login.html")

# Login endpoint
@app.route("/in", methods=["POST"])
def lin():
    USERS = {
        "admin": b'$2b$12$po2e.kKOoXl.6RoGwbIyfeD7ZU04zC8ldtPdj/4XTK0HI91KjBwq6',  # Password: adminpassword
        "user1": b'$2b$12$sujqhPEYRTfHZX8PDM4dZuYr8.XS6VZK13ATqIr6FYEZnWcXxJGB6',  # Password: password1
        "user2": b'$2b$12$loerZmOk8Az30N3/J05EXeFqdsAFi6po/zAy/0z9PQ8U6h5chJX0W'   # Password: password2
    }
    data = dict(request.form)
    username = data.get("username")
    password = data.get("password")

    valid = username in USERS and bcrypt.checkpw(password.encode("utf-8"), USERS[username])
    
    if valid:
        # Set the JWT cookie and redirect to the homepage
        res = make_response(redirect(url_for("index")))
        res.set_cookie("JWT", jwtSign(username))  # JWT contains the username now
        return res
    else:
        # Return to login with an error message
        return make_response("Invalid username/password", 200)


# Logout endpoint
@app.route("/out", methods=["POST"])
def lout():
    res = make_response("OK", 200)
    res.delete_cookie("JWT")
    return res

# Generate JWT
def jwtSign(username):
    rnd = "".join(random.choice("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^_-") for i in range(24))
    now = int(time.time())
    return jwt.encode({
        "iat": now,
        "nbf": now,
        "exp": now + 3600,
        "jti": rnd,
        "iss": JWT_ISS,
        "data": {"username": username}  # Store the username in the JWT
    }, JWT_KEY, algorithm=JWT_ALGO)

# Start the app
if __name__ == "__main__":
    app.run(HOST_NAME, HOST_PORT)
