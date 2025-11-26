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
      alert(errorData.error || `Login failed (status ${res.status})`);
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
      window.location.href = `frontend/pages/${data.role.toLowerCase()}Dashboard.html`;
    } else {
      alert("Login successful, but role unknown");
    }
  } catch (err) {
    console.error(err);
    alert("Network or server error");
  }
});
