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

# List of admin users
ADMIN_USERS = ["admin@example.com"]

# Predefined weekly events
predefined_events = {
    0: {"name": "Queer-Kneipe", "needs_door_shift": False, "has_double_shifts": False},
    1: {"name": "Das Labor", "needs_door_shift": True, "has_double_shifts": True},
    3: {"name": "Punk-Kneipe", "needs_door_shift": False, "has_double_shifts": False},
    4: {"name": "Kneipe", "needs_door_shift": False, "has_double_shifts": False},
    5: {"name": "Kneipe", "needs_door_shift": False, "has_double_shifts": False},
}

# JWT Verification
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

# Function to add predefined weekly events to the calendar
def add_predefined_events(month, year):
    # Loop through each day in the month
    for day in range(1, calendar.monthrange(year, month)[1] + 1):
        date = datetime(year, month, day)
        date_str = date.strftime("%Y-%m-%d")
        weekday = date.weekday()

        # Skip if a user-created event exists for the date
        existing_event = next((event for event in calendar_data['events'] if event['date'] == date_str), None)
        if existing_event:
            continue  # Skip predefined event if a user event exists

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
                "is_predefined": True,  # Identifier for predefined event
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

            # Append the predefined event only if no user event exists
            calendar_data['events'].append(event_details)

# Create a new event and purge any predefined event for the same date
@app.route('/create_event', methods=['POST'])
def create_event():
    user = jwtVerify(request.cookies)
    if user == False or user['email'] not in ADMIN_USERS:
        return redirect(url_for("index"))

    event_name = request.form.get('event_name')
    event_date = request.form.get('event_date')
    needs_door_shift = request.form.get('tur_schicht') == 'on'
    has_double_shifts = request.form.get('doppel_schicht') == 'on'
    entry_time = request.form.get('entry_time')
    price = request.form.get('price')
    acts = request.form.getlist('acts')
    event_image = request.files.get('event_image')

    image_filename = None
    if event_image:
        image_filename = os.path.join(UPLOAD_FOLDER, event_image.filename)
        event_image.save(image_filename)

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

    # Remove any predefined events on this date
    calendar_data['events'] = [event for event in calendar_data['events'] if event['date'] != event_date]

    # Create the new user event
    event_details = {
        "name": event_name,
        "date": event_date,
        "needs_door_shift": needs_door_shift,
        "has_double_shifts": has_double_shifts,
        "entry_time": entry_time,
        "price": price,
        "acts": acts,
        "image": image_filename,
        "is_predefined": False,  # Mark this event as user-created
        "shifts": shifts
    }
    
    calendar_data['events'].append(event_details)

    with open('calendar_data.json', 'w') as f:
        json.dump(calendar_data, f)

    return redirect(url_for('index'))

# Display the calendar, removing predefined events if a user-created event exists for the same date
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
        return render_template("2-home.html", title="Home Page", user=user["email"], calendar_data=calendar_data, month_data=month_data, predefined_events=predefined_events, is_admin=(user["email"] in ADMIN_USERS), user_email=user["email"], allow_create_event=(user["email"] in ADMIN_USERS))

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

    user_name = user['email']

    # Loop through the events to find the correct date
    for event in calendar_data['events']:
        if event['date'] == event_date:
            # Check if the user already has any shift claimed
            for shift_key, shift_value in event['shifts'].items():
                if shift_value == user_name or (isinstance(shift_value, list) and user_name in shift_value):
                    return jsonify({'error': 'User already has a shift claimed for this day'}), 400

            # Assign the shift if the user doesn't already have one
            if shift_number in event['shifts']:
                current_shift = event['shifts'][shift_number]

                if current_shift is None:
                    event['shifts'][shift_number] = user_name
                elif isinstance(current_shift, str) and current_shift != user_name:
                    event['shifts'][shift_number] = [current_shift, user_name]
                elif isinstance(current_shift, list) and user_name not in current_shift and len(current_shift) < 2:
                    current_shift.append(user_name)
                elif current_shift == user_name:
                    event['shifts'][shift_number] = None  # Allow user to remove their own shift

            break
    else:
        return jsonify({'error': 'Event not found for the given date'}), 400

    # Save the updated calendar data
    with open('calendar_data.json', 'w') as f:
        json.dump(calendar_data, f)

    return jsonify({'success': 'Shift assigned successfully'}), 200

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
        "admin@example.com": b'$2b$12$po2e.kKOoXl.6RoGwbIyfeD7ZU04zC8ldtPdj/4XTK0HI91KjBwq6',  # Password: adminpassword
        "user1@example.com": b'$2b$12$Wo5Z8R6kOH6kS0TrJMAoT.S8qaB/ABpX0qZ17xlyPE4mAKU8awKLS',  # Password: password1
        "user2@example.com": b'$2b$12$loerZmOk8Az30N3/J05EXeFqdsAFi6po/zAy/0z9PQ8U6h5chJX0W'   # Password: password2
    }
    data = dict(request.form)
    valid = data["email"] in USERS
    if valid:
        valid = bcrypt.checkpw(data["password"].encode("utf-8"), USERS[data["email"]])
    msg = "OK" if valid else "Invalid email/password"
    res = make_response(msg, 200)
    if valid:
        res.set_cookie("JWT", jwtSign(data["email"]))
    return res

# Logout endpoint
@app.route("/out", methods=["POST"])
def lout():
    res = make_response("OK", 200)
    res.delete_cookie("JWT")
    return res

# Generate JWT
def jwtSign(email):
    rnd = "".join(random.choice("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@#$%^_-") for i in range(24))
    now = int(time.time())
    return jwt.encode({
        "iat": now,
        "nbf": now,
        "exp": now + 3600,
        "jti": rnd,
        "iss": JWT_ISS,
        "data": {"email": email}
    }, JWT_KEY, algorithm=JWT_ALGO)

# Start the app
if __name__ == "__main__":
    app.run(HOST_NAME, HOST_PORT)
