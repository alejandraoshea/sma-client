document.addEventListener("DOMContentLoaded", () => {
  const patientId = 1; // replace with logged-in patient id
  let currentSessionId = null;
  let currentSignalType = null;

  const startBtn = document.getElementById("start-session-btn");
  const logSymptomsBtn = document.getElementById("log-symptoms-btn");
  const logSignalsBtn = document.getElementById("log-signals-btn");

  const symptomsContainer = document.getElementById("symptoms-container");
  const symptomsCheckboxes = document.getElementById("symptoms-checkboxes");
  const symptomsForm = document.getElementById("symptoms-form");

  const signalsContainer = document.getElementById("signals-container");
  const recordArea = document.getElementById("record-area");
  const recordBtn = document.getElementById("record-btn");
  const stopBtn = document.getElementById("stop-btn");
  const recordingLabel = document.getElementById("recording-label");

  logSymptomsBtn.classList.add("hidden");
  logSignalsBtn.classList.add("hidden");

  startBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `https://127.0.0.1:8443/api/patients/sessions/start/${patientId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to start session");
        return;
      }
      const data = await res.json();
      currentSessionId = data.sessionId || data.sessionId || data.sessionId;
      if (
        !currentSessionId &&
        data.sessionId === undefined &&
        data.sessionId === null
      ) {
        currentSessionId = data.sessionId || data.session_id || data.sessionId;
      }

      if (!currentSessionId && data) {
        if (data.sessionId) currentSessionId = data.sessionId;
        else if (data.session_id) currentSessionId = data.session_id;
        else if (data.sessionId === 0) currentSessionId = data.sessionId;
      }

      if (!currentSessionId) {
        const keys = Object.keys(data || {});
        for (const k of keys) {
          if (k.toLowerCase().includes("session")) {
            currentSessionId = data[k];
            break;
          }
        }
      }

      alert(
        "Session started! ID: " + (currentSessionId ?? JSON.stringify(data))
      );
      startBtn.classList.add("hidden");
      logSymptomsBtn.classList.remove("hidden");
      logSignalsBtn.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      alert("Network or server error starting session.");
    }
  });

  logSymptomsBtn.addEventListener("click", async () => {
    signalsContainer.classList.add("hidden");
    symptomsContainer.classList.toggle("hidden");
    if (!symptomsContainer.classList.contains("hidden")) {
      await loadSymptomsEnum();
    }
  });

  logSignalsBtn.addEventListener("click", () => {
    symptomsContainer.classList.add("hidden");
    signalsContainer.classList.toggle("hidden");
  });

  async function loadSymptomsEnum() {
    symptomsCheckboxes.innerHTML = "";
    try {
      const res = await fetch("https://127.0.0.1:8443/api/patients/sessions/enum");
      if (!res.ok) throw new Error("enum fetch failed");
      const list = await res.json();
      list.forEach((sym) => {
        const labelText = sym.replaceAll("_", " ");
        const wrapper = document.createElement("label");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "0.6rem";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = sym;
        cb.name = "symptom";

        wrapper.appendChild(cb);
        const txt = document.createElement("span");
        txt.textContent = labelText;
        wrapper.appendChild(txt);

        const cell = document.createElement("div");
        cell.appendChild(wrapper);
        symptomsCheckboxes.appendChild(cell);
      });
    } catch (err) {
      console.error(err);
      symptomsCheckboxes.innerHTML =
        "<div style='color:#811'>Could not load symptoms</div>";
    }
  }

  symptomsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentSessionId) {
      alert("Please start a session first.");
      return;
    }
    const selected = [
      ...document.querySelectorAll("input[name='symptom']:checked"),
    ].map((n) => n.value);
    if (selected.length === 0) {
      alert("Select at least one symptom");
      return;
    }

    try {
      const res = await fetch(
        `https://127.0.0.1:8443/api/patients/sessions/${currentSessionId}/symptoms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptomsSet: selected }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save symptoms.");
        return;
      }
      alert("Symptoms saved");
      symptomsContainer.classList.add("hidden");
    } catch (err) {
      console.error(err);
      alert("Network/server error saving symptoms");
    }
  });

  document.querySelectorAll(".signal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSignalType = btn.getAttribute("data-signal");
      recordingLabel.textContent = `Selected: ${currentSignalType}`;
      recordArea.classList.remove("hidden");
      recordBtn.disabled = false;
      stopBtn.disabled = true;
    });
  });

  recordBtn.addEventListener("click", async () => {
    if (!currentSessionId) {
      alert("Start a session first");
      return;
    }
    if (!currentSignalType) {
      alert("Choose a signal first");
      return;
    }

    try {
      const res = await fetch(
        `https://127.0.0.1:8443/api/patients/sessions/${currentSessionId}/signals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signalType: currentSignalType,
            action: "start",
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || "Failed to start recording");
        return;
      }
      recordingLabel.textContent = `${currentSignalType} recording...`;
      recordBtn.disabled = true;
      stopBtn.disabled = false;
    } catch (err) {
      console.error(err);
      alert("Network/server error starting record");
    }
  });

  stopBtn.addEventListener("click", async () => {
    if (!currentSessionId) {
      alert("Start a session first");
      return;
    }
    if (!currentSignalType) {
      alert("Choose a signal first");
      return;
    }

    try {
      const res = await fetch(
        `https://127.0.0.1:8443/api/patients/sessions/${currentSessionId}/signals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signalType: currentSignalType,
            action: "stop",
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || "Failed to stop recording");
        return;
      }
      recordingLabel.textContent = `Stopped ${currentSignalType}`;
      recordBtn.disabled = false;
      stopBtn.disabled = true;
    } catch (err) {
      console.error(err);
      alert("Network/server error stopping record");
    }
  });
});

//TODO: when backend for request, add notification when accepted/declined request
