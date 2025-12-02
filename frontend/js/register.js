function showToast(message, type = "info", duration = 4000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.classList.add("toast", `toast-${type}`);
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";

    toast.addEventListener("transitionend", () => {
      toast.remove();
    });
  }, duration);
}

const registerForm = document.getElementById("register");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = document.getElementById("reg-role").value;
  if (!role) {
    showToast("Please select a role.", "error");
    return;
  }

  const payload = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    role,
  };

  try {
    const res = await fetch(
      "https://127.0.0.1:8443/api/authentication/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    let data = {};
    if (res.headers.get("content-type")?.includes("application/json")) {
      data = await res.json();
    } else {
      showToast("Registration failed", "error");
      return;
    }

    if (!res.ok) {
      console.log("Server error response:", JSON.stringify(data, null, 2));
      showToast( "Registration failed", "error");
      return;
    } else {
      showToast("✓ Registration successful!", "success");
    }
  } catch (err) {
    console.error(err);
    showToast("Network or server error", "error");
  }
});
