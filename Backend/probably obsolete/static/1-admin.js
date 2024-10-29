function logout () {
  fetch("/out", { method:"post" })
  .then(res => res.text())
  .then(txt => {
    if (txt=="OK") { location.href = "../login"; }
    else { alert(txt); }
  })
  .catch(err => {
    console.error(err);
    alert("Error - " + err.message);
  });
  return false;
}