const patientId = 1; // TODO: replace with actual logged-in patient ID

document.addEventListener("DOMContentLoaded", () => {
  const startSessionBtn = document.getElementById("start-session-btn");

  if (startSessionBtn) {
    startSessionBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        const res = await fetch(`http://localhost:8080/api/sessions/start/${patientId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Failed to start session");
          return;
        }

        console.log("Session started:", data);
        alert("Measurement Session Started! Session ID: " + data.sessionId);
      } catch (err) {
        console.error(err);
        alert("Network or server error");
      }
    });
  }
});
