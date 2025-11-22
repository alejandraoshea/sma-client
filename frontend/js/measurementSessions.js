document.addEventListener("DOMContentLoaded", () => {
  const patientId = 1;
  let currentSessionId = null;

  const startSessionBtn = document.getElementById("start-session-btn");
  const logSymptomsBtn = document.getElementById("log-symptoms-btn");
  const logSignalsBtn = document.getElementById("log-signals-btn");

  const checkboxesContainer = document.getElementById("symptoms-checkboxes");
  const symptomsContainer = document.getElementById("symptoms-container");
  const symptomsForm = document.getElementById("symptoms-form");

  const signalsContainer = document.getElementById("signals-container");

  logSymptomsBtn.style.display = "none";
  logSignalsBtn.style.display = "none";

  startSessionBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `http://localhost:8080/api/sessions/start/${patientId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to start session");
        return;
      }

      alert("Session started! ID: " + data.sessionId);
      currentSessionId = data.sessionId;

      startSessionBtn.style.display = "none";
      logSymptomsBtn.style.display = "flex";
      logSignalsBtn.style.display = "flex";
    } catch (err) {
      alert("Network or server error");
    }
  });

  logSymptomsBtn.addEventListener("click", () => {
    symptomsContainer.classList.toggle("hidden");
    signalsContainer.classList.add("hidden");

    if (!symptomsContainer.classList.contains("hidden")) {
      loadSymptomsCheckboxes();
    }
  });

  logSignalsBtn.addEventListener("click", () => {
    signalsContainer.classList.toggle("hidden");
    symptomsContainer.classList.add("hidden");
  });

  async function loadSymptomsCheckboxes() {
    checkboxesContainer.innerHTML = "";

    try {
      const res = await fetch("http://localhost:8080/api/sessions/enum");

      if (!res.ok) {
        throw new Error("Server returned an error while loading enum");
      }

      const symptomsEnum = await res.json();

      symptomsEnum.forEach((symptom) => {
        const label = symptom.replaceAll("_", " ");
        const div = document.createElement("div");
        div.classList.add("symptom-item");

        div.innerHTML = `
          <label>
            <input type="checkbox" name="symptoms" value="${symptom}">
            ${label}
          </label>
        `;

        checkboxesContainer.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      alert("Could not load symptoms from the server.");
    }
  }

  symptomsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentSessionId) {
      alert("Please start a session first.");
      return;
    }

    const selectedSymptoms = [
      ...document.querySelectorAll("input[name='symptoms']:checked"),
    ].map((cb) => cb.value);

    if (selectedSymptoms.length === 0) {
      alert("Please select at least one symptom.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/sessions/${currentSessionId}/symptoms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptomsSet: selectedSymptoms }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save symptoms.");
        return;
      }

      alert("Symptoms saved!");
      symptomsContainer.classList.add("hidden");
    } catch (err) {
      console.error("Error submitting symptoms:", err);
      alert("Network/server error.");
    }
  });
});
