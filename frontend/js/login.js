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


const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value,
  };

  try {
    const res = await fetch("https://127.0.0.1:8443/api/authentication/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorData = {};
      try {
        errorData = await res.json();
      } catch {}
      showToast(errorData.error || `Login failed (status ${res.status})`, "error");
      return;
    }

    const data = await res.json().catch(() => ({}));

    console.log("Login response data:", data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      console.log("Stored token:", data.token);
      localStorage.setItem("role", data.role);
      console.log("Stored role:", data.role);

      if (data.patientId) {
        localStorage.setItem("patientId", data.patientId);
        console.log("Stored patientId:", data.patientId);
      } else if (data.doctorId) {
        localStorage.setItem("doctorId", data.doctorId);
        console.log("Stored doctorId:", data.doctorId);
      }
    }

    if (data.role) {
      showToast("✓ Login successful!", "success");
      setTimeout(() => {
        window.location.href = `frontend/pages/${data.role.toLowerCase()}Dashboard.html`;
      }, 400); 
    } else {
      showToast("✓ Login successful, but role unknown", "warning");
    }
  } catch (err) {
    console.error(err);
    showToast("Network or server error", "error");
  }
});
