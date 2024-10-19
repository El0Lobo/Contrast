mkdir -m 777 static
mkdir -m 777 templates
mv ./1-admin.css ./static
mv ./1-admin.js ./static
mv ./3-login.css ./static
mv ./3-login.js ./static
mv ./1-admin.html ./templates
mv ./2-home.html ./templates
mv ./3-login.html ./templates
curl https://user-images.githubusercontent.com/11156244/281229681-7bd13b16-c07d-4909-a9d6-ef23e2ce1207.png --ssl-no-revoke --output static/pic.png
virtualenv venv
source "venv/bin/activate"
pip install flask pyjwt bcrypt
python 4-server.py