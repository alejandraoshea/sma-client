document.addEventListener("DOMContentLoaded", () => {
  const doctorId = 4; 

  const seePatientsBtn = document.getElementById("see-patients-btn");
  const requestsBox = document.getElementById("requests-box");
  const patientsBox = document.getElementById("patients-box");
  const requestsList = document.getElementById("requests-list");
  const requestsTitle = document.getElementById("requests-title");
  const patientsBody = document.getElementById("patients-body");

  let sessionsContainer = null; 

  const modal = document.getElementById('confirm-modal');
  const modalMessage = document.getElementById('modal-message');
  const btnApprove = document.getElementById('modal-approve-btn');
  const btnReject = document.getElementById('modal-reject-btn');
  const btnCancel = document.getElementById('modal-cancel-btn');

  seePatientsBtn.addEventListener("click", async () => {
    requestsBox.classList.toggle("hidden");
    patientsBox.classList.toggle("hidden");

    await loadRequests();
    await loadPatients();
  });

  async function loadRequests() {
    requestsList.innerHTML = "Loading requests...";
    try {
      const res = await fetch(`https://localhost:8443/api/doctors/${doctorId}/requests`);
      if (!res.ok) {
        requestsList.innerHTML = `<div style="color:#811">No separate 'requests' endpoint found or none pending.</div>`;
        requestsTitle.textContent = `Requests (0)`;
        return;
      }
      const list = await res.json();
      requestsTitle.textContent = `Requests (${list.length})`;
      requestsList.innerHTML = "";

      list.forEach(req => {
        const row = document.createElement("div");
        row.className = "request-row";

        const left = document.createElement("div");
        left.className = "request-left";
        left.innerHTML = `
          <strong>${req.name} ${req.surname}</strong><br>
          Gender: ${req.gender}<br>
          Birthdate: ${req.birthDate}<br>
          Height: ${req.height} cm<br>
          Weight: ${req.weight} kg
        `;

        const actions = document.createElement("div");
        actions.className = "request-actions";

        const acc = document.createElement("button");
        acc.className = "accept-btn";
        acc.textContent = "Approve";
        acc.onclick = () => handleApprove(req.patientId);

        const dec = document.createElement("button");
        dec.className = "decline-btn";
        dec.textContent = "Reject";
        dec.onclick = () => handleReject(req.patientId);

        actions.appendChild(acc);
        actions.appendChild(dec);

        row.appendChild(left);
        row.appendChild(actions);

        requestsList.appendChild(row);
      });

    } catch (err) {
      console.error(err);
      requestsList.innerHTML = `<div>Error loading requests.</div>`;
    }
  }

  async function loadPatients() {
    patientsBody.innerHTML = "<tr><td colspan='7'>Loading...</td></tr>";
    try {
      const res = await fetch(`https://127.0.0.1:8443/api/doctors/${doctorId}/patients`);
      if (!res.ok) {
        patientsBody.innerHTML = "<tr><td colspan='7'>Could not load patients</td></tr>";
        return;
      }
      const list = await res.json();
      patientsBody.innerHTML = "";
      if (!Array.isArray(list) || list.length === 0) {
        patientsBody.innerHTML = "<tr><td colspan='7'>No patients yet</td></tr>";
        return;
      }

      list.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="padding:.6rem;border:1px solid #eee">${p.name}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.surname}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.gender}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.birthDate}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.height}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.weight}</td>
          <td style="padding:.6rem;border:1px solid #eee; text-align:center;">
            <button class="view-sessions-btn" data-patient-id="${p.patientId}" 
              style="background:#6c63ff; color:white; border:none; padding:0.4rem 0.8rem; border-radius: 12px; cursor:pointer;">
              View Sessions
            </button>
          </td>
        `;
        patientsBody.appendChild(tr);
      });
        document.querySelectorAll(".view-sessions-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const patientId = btn.getAttribute("data-patient-id");
          await toggleSessionsForPatient(patientId, btn);
        });
      });
    } catch (err) {
      console.error(err);
      patientsBody.innerHTML = "<tr><td colspan='7'>Error loading patients</td></tr>";
    }
  }

  function showConfirmModal({ message, type = 'approve' }) {
    return new Promise((resolve) => {
      modalMessage.textContent = message;

      if (type === 'approve') {
        btnApprove.style.display = 'inline-block';
        btnReject.style.display = 'none';
      } else if (type === 'reject') {
        btnApprove.style.display = 'none';
        btnReject.style.display = 'inline-block';
      }

      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');

      function cleanup() {
        btnApprove.removeEventListener('click', onApprove);
        btnReject.removeEventListener('click', onReject);
        btnCancel.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdropClick);
      }

      function onApprove() {
        cleanup();
        closeModal();
        resolve(true);
      }

      function onReject() {
        cleanup();
        closeModal();
        resolve(true);
      }

      function onCancel() {
        cleanup();
        closeModal();
        resolve(false);
      }

      function onBackdropClick(e) {
        if (e.target === modal) {
          onCancel();
        }
      }

      btnApprove.addEventListener('click', onApprove);
      btnReject.addEventListener('click', onReject);
      btnCancel.addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdropClick);
    });
  }

  async function toggleSessionsForPatient(patientId, button) {
    // If sessionsContainer exists and belongs to this patient, toggle visibility and return
    if (sessionsContainer && sessionsContainer.dataset.patientId === patientId) {
      if (sessionsContainer.style.display === "none") {
        sessionsContainer.style.display = "block";
        button.textContent = "Hide Sessions";
      } else {
        sessionsContainer.style.display = "none";
        button.textContent = "View Sessions";
      }
      return;
    }

    // Otherwise, remove old container and create new one
    if (sessionsContainer) {
      sessionsContainer.remove();
    }

    // Create new container
    sessionsContainer = document.createElement("div");
    sessionsContainer.style.background = "#f0f0ff";
    sessionsContainer.style.padding = "1rem";
    sessionsContainer.style.borderRadius = "15px";
    sessionsContainer.style.margin = "1rem auto";
    sessionsContainer.style.maxWidth = "95%";
    sessionsContainer.dataset.patientId = patientId;

    // Insert sessionsContainer right below patientsBox
    patientsBox.appendChild(sessionsContainer);

    button.textContent = "Loading sessions...";

    try {
      const res = await fetch(`https://localhost:8443/api/patients/${patientId}/sessions`);
      if (!res.ok) {
        sessionsContainer.textContent = "Failed to load sessions";
        button.textContent = "View Sessions";
        return;
      }
      const sessions = await res.json();

      if (!sessions.length) {
        sessionsContainer.textContent = "No sessions found for this patient.";
        button.textContent = "Hide Sessions";
        return;
      }

      button.textContent = "Hide Sessions";

      // Build sessions list
      sessionsContainer.innerHTML = "";
      sessions.forEach(session => {
        const sessionDiv = document.createElement("div");
        sessionDiv.style.border = "1px solid #ccc";
        sessionDiv.style.marginBottom = "1rem";
        sessionDiv.style.borderRadius = "10px";
        sessionDiv.style.background = "#fff";

        const header = document.createElement("div");
        header.style.cursor = "pointer";
        header.style.padding = "0.8rem 1rem";
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.gap = "0.6rem";
        header.style.userSelect = "none";

        const arrow = document.createElement("span");
        arrow.textContent = "▶"; // right arrow
        arrow.style.transition = "transform 0.3s ease";
        arrow.style.display = "inline-block";

        const dateSpan = document.createElement("span");
        dateSpan.textContent = new Date(session.timeStamp).toLocaleString();

        header.appendChild(arrow);
        header.appendChild(dateSpan);
        sessionDiv.appendChild(header);

        // Details container hidden by default
        const details = document.createElement("div");
        details.style.padding = "0 1rem 1rem 2rem";
        details.style.display = "none";

        sessionDiv.appendChild(details);

        // Expand/collapse on click
        header.addEventListener("click", async () => {
          if (details.style.display === "block") {
            details.style.display = "none";
            arrow.style.transform = "rotate(0deg)";
          } else {
            details.style.display = "block";
            arrow.style.transform = "rotate(90deg)";
            // If empty, load details
            if (!details.hasChildNodes()) {
              details.textContent = "Loading session details...";
              try {
                const [symptoms, signals] = await Promise.all([
                  fetch(`https://localhost:8443/api/patients/session/${session.sessionId}/symptoms`).then(r => r.json()),
                  fetch(`https://localhost:8443/api/patients/session/${session.sessionId}/signals`).then(r => r.json()),
                ]);

                details.innerHTML = "";

                // Symptoms list
                const symptomsTitle = document.createElement("h4");
                symptomsTitle.textContent = "Symptoms:";
                symptomsTitle.style.marginBottom = "0.4rem";
                details.appendChild(symptomsTitle);

                if (symptoms.length === 0) {
                  const noSymptoms = document.createElement("p");
                  noSymptoms.textContent = "No symptoms recorded.";
                  details.appendChild(noSymptoms);
                } else {
                  const ul = document.createElement("ul");
                  symptoms.forEach(sym => {
                    // sym.symptomSet assumed to be array or set of strings
                    const symptomItems = Array.isArray(sym.symptomSet) ? sym.symptomSet : Array.from(sym.symptomSet);
                    symptomItems.forEach(s => {
                      const li = document.createElement("li");
                      li.textContent = s;
                      ul.appendChild(li);
                    });
                  });
                  details.appendChild(ul);
                }

                // Signals
                const signalsTitle = document.createElement("h4");
                signalsTitle.textContent = "Signals:";
                signalsTitle.style.margin = "1rem 0 0.4rem 0";
                details.appendChild(signalsTitle);

                if (signals.length === 0) {
                  const noSignals = document.createElement("p");
                  noSignals.textContent = "No signals recorded.";
                  details.appendChild(noSignals);
                } else {
                  // Render each signal
                  signals.forEach(signal => {
                    const signalDiv = document.createElement("div");
                    signalDiv.style.border = "1px solid #aaa";
                    signalDiv.style.marginBottom = "0.8rem";
                    signalDiv.style.borderRadius = "10px";
                    signalDiv.style.padding = "0.5rem";
                    signalDiv.style.background = "#eef";

                    const signalHeader = document.createElement("div");
                    signalHeader.textContent = signal.signalType + " Signal";
                    signalHeader.style.fontWeight = "600";
                    signalHeader.style.marginBottom = "0.5rem";

                    signalDiv.appendChild(signalHeader);

                    // Simple canvas chart for signal data
                    const canvas = document.createElement("canvas");
                    canvas.width = 400;
                    canvas.height = 100;
                    signalDiv.appendChild(canvas);

                    renderSignalChart(canvas, signal.patientSignalData);

                    details.appendChild(signalDiv);
                  });
                }

              } catch (e) {
                details.textContent = "Failed to load session details.";
                console.error(e);
              }
            }
          }
        });

        sessionsContainer.appendChild(sessionDiv);
      });
    } catch (err) {
      console.error(err);
      sessionsContainer.textContent = "Error loading sessions";
      button.textContent = "View Sessions";
    }
  }

    function renderSignalChart(canvas, dataStr) {
    if (!dataStr) {
      const ctx = canvas.getContext("2d");
      ctx.font = "16px Arial";
      ctx.fillText("No data", 10, 50);
      return;
    }

    const ctx = canvas.getContext("2d");
    const data = dataStr.split(",").map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
    if (!data.length) {
      ctx.font = "16px Arial";
      ctx.fillText("No valid data", 10, 50);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find min/max for scaling
    const min = Math.min(...data);
    const max = Math.max(...data);

    // Scale data to canvas height
    const scaleY = (max - min) === 0 ? 1 : canvas.height / (max - min);
    const stepX = canvas.width / (data.length - 1);

    ctx.strokeStyle = "#6c63ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * stepX;
      const y = canvas.height - (val - min) * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === "success" ? "✔️" : "❌"}</span> 
      <span><br>${message}</span>
    `;
    document.body.appendChild(toast);

    toast.addEventListener("click", () => {
      toast.remove();
    });

    setTimeout(() => {
      toast.style.animation = "fadeout 0.5s ease forwards";
      toast.addEventListener("animationend", () => {
        toast.remove();
      });
    }, 2500);
  }

  async function handleApprove(patientId) {
    const confirmed = await showConfirmModal({
      message: "Approve patient?",
      type: "approve",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`https://127.0.0.1:8443/api/doctors/${doctorId}/approve/${patientId}`, {
        method: "POST",
      });
      if (!res.ok) {
        showToast("Failed to approve", "error");
        return;
      }
      showToast("Patient approved successfully!", "success");
      await loadRequests();
      await loadPatients();
    } catch (err) {
      console.error(err);
      showToast("Network error, please try again.", "error");
    }
  }

  async function handleReject(patientId) {
    const confirmed = await showConfirmModal({
      message: "Reject patient?",
      type: "reject",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`https://127.0.0.1:8443/api/doctors/${doctorId}/reject/${patientId}`, {
        method: "POST",
      });
      if (!res.ok) {
        showToast("Failed to reject", "error");
        return;
      }
      showToast("Patient rejected successfully!", "success");
      await loadRequests();
      await loadPatients();
    } catch (err) {
      console.error(err);
      showToast("Network error, please try again.", "error");
    }
  }
});

