md static
md templates
move 1-admin.css static
move 1-admin.js static
move 3-login.css static
move 3-login.js static
move 1-admin.html templates
move 2-home.html templates
move 3-login.html templates
curl https://user-images.githubusercontent.com/11156244/281229681-7bd13b16-c07d-4909-a9d6-ef23e2ce1207.png --ssl-no-revoke --output static/pic.png
virtualenv venv
call venv\Scripts\activate
pip install flask pyjwt bcrypt
python 4-server.py