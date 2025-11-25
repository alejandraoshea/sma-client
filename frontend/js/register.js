const registerForm = document.getElementById("register");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = document.getElementById("reg-role").value;
  if (!role) {
    alert("Please select a role.");
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
      const text = await res.text();
      console.error("Non-JSON response:", text);
      alert("Registration failed: invalid response from server");
      return;
    }

    if (!res.ok) {
      alert(data.error || "Registration failed");
    } else {
      alert("Registration successful!");
    }
  } catch (err) {
    console.error(err);
    alert("Network or server error");
  }
});
