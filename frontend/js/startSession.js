const patientId = 1; // TODO: Replace with actual logged-in patient ID

document.addEventListener("DOMContentLoaded", () => {
  const startSessionBtn = document.getElementById("start-session-btn");
  const logSymptomsBtn = document.getElementById("log-symptoms-btn");
  const logSignalsBtn = document.getElementById("log-signals-btn");

  // Initially hide the other buttons
  if (logSymptomsBtn) logSymptomsBtn.style.display = "none";
  if (logSignalsBtn) logSignalsBtn.style.display = "none";

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

        // Hide Start Session button
        startSessionBtn.style.display = "none";

        // Show other buttons
        logSymptomsBtn.style.display = "flex";
        logSignalsBtn.style.display = "flex";

      } catch (err) {
        console.error(err);
        alert("Network or server error");
      }
    });
  }
});
