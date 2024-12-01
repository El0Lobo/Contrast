function login () {
  // (A) GET EMAIL + PASSWORD
  var data = new FormData(document.getElementById("login"));

  // (B) AJAX REQUEST
  fetch("/in", { method:"POST", body:data })
  .then(res => res.text())
  .then(txt => {
    if (txt=="OK") { location.href = "../"; }
    else { alert(txt); }
  })
  .catch(err => {
    console.error(err);
    alert("Error - " + err.message);
  });
  return false;
}