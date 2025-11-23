function logout() {
  localStorage.clear();
  window.location.href = "../../index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});