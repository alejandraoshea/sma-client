document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "../../index.html";

  const claims = jwt_decode(token);
  if (claims.role !== "DOCTOR") window.location.href = "../../index.html";

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
    if (!res) return null;
    return res;
  }

  const requestsBox = document.getElementById("requests-box");
  const patientsBox = document.getElementById("patients-box");
  const requestsList = document.getElementById("requests-list");
  const requestsTitle = document.getElementById("requests-title");
  const patientsBody = document.getElementById("patients-body");

  let sessionsContainer = null;

  const modal = document.getElementById("confirm-modal");
  const modalMessage = document.getElementById("modal-message");
  const btnApprove = document.getElementById("modal-approve-btn");
  const btnReject = document.getElementById("modal-reject-btn");
  const btnCancel = document.getElementById("modal-cancel-btn");

  loadRequests();
  loadPatients();

  async function loadRequests() {
    requestsList.innerHTML = "Loading requests...";
    try {
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/doctors/me/requests`
      );

      if (!res.ok) {
        requestsList.innerHTML = `<div style="color:#811">No separate 'requests' endpoint found or none pending.</div>`;
        requestsTitle.textContent = `Patient Requests (0)`;
        return;
      }

      const list = await res.json();
      requestsTitle.textContent = `Patient Requests (${list.length})`;
      requestsList.innerHTML = "";

      list.forEach((req) => {
        const row = document.createElement("div");
        row.className = "request-row";

        const left = document.createElement("div");
        left.className = "request-left";
        left.innerHTML = `
          <strong>${req.name} ${req.surname}</strong><br>
          <div>
          Gender: ${req.gender}<br/>
          Birthdate: ${req.birthDate}<br/>
          </div>
          <div>
          Height: ${req.height} cm<br/>
          Weight: ${req.weight} kg
          </div>
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
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/doctors/me/patients`
      );

      if (!res.ok) {
        patientsBody.innerHTML =
          "<tr><td colspan='7'>Could not load patients</td></tr>";
        return;
      }

      const list = await res.json();
      patientsBody.innerHTML = "";

      if (!Array.isArray(list) || list.length === 0) {
        patientsBody.innerHTML =
          "<tr><td colspan='7'>No patients yet</td></tr>";
        return;
      }

      list.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="padding:.6rem;border:1px solid #eee">${p.patientId}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.name}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.surname}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.gender}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.birthDate}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.height}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.weight}</td>
          <td style="padding:.6rem;border:1px solid #eee; text-align:center;">
            <button class="view-sessions-btn" data-patient-id="${p.patientId}" 
              style="background:#f05454; color:white; border:none; padding:0.4rem 0.8rem; border-radius: 12px; cursor:pointer;">
              View Sessions
            </button>
            <button class="compare-sessions-btn" data-patient-id="${p.patientId}" 
              style="background:#4a90e2; color:white; border:none; padding:0.4rem 0.8rem; border-radius: 12px; margin-left: 0.5rem; cursor:pointer;">
              Compare 2 Sessions
            </button>
          </td>
        `;
        patientsBody.appendChild(tr);
      });

      document.querySelectorAll(".view-sessions-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const patientId = btn.getAttribute("data-patient-id");
          await toggleSessionsForPatient(patientId, btn);
        });

        document.querySelectorAll(".compare-sessions-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const patientId = btn.getAttribute("data-patient-id");
            await showCompareSessions(patientId);
          });
        });
      });
    } catch (err) {
      console.error(err);
      patientsBody.innerHTML =
        "<tr><td colspan='7'>Error loading patients</td></tr>";
    }
  }

  function showConfirmModal({ message, type = "approve" }) {
    return new Promise((resolve) => {
      modalMessage.textContent = message;

      if (type === "approve") {
        btnApprove.style.display = "inline-block";
        btnReject.style.display = "none";
      } else if (type === "reject") {
        btnApprove.style.display = "none";
        btnReject.style.display = "inline-block";
      }

      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      btnApprove.focus();

      function cleanup() {
        btnApprove.removeEventListener("click", onApprove);
        btnReject.removeEventListener("click", onReject);
        btnCancel.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdropClick);
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

      btnApprove.addEventListener("click", onApprove);
      btnReject.addEventListener("click", onReject);
      btnCancel.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdropClick);
    });
  }

  async function toggleSessionsForPatient(patientId, button) {
    if (
      sessionsContainer &&
      sessionsContainer.dataset.patientId === patientId
    ) {
      if (sessionsContainer.style.display === "none") {
        sessionsContainer.style.display = "block";
        button.textContent = "Hide Sessions";
      } else {
        sessionsContainer.style.display = "none";
        button.textContent = "View Sessions";
      }
      return;
    }

    if (sessionsContainer) {
      sessionsContainer.remove();
    }

    sessionsContainer = document.createElement("div");
    sessionsContainer.style.background = "#ffffff";
    sessionsContainer.style.padding = "1rem";
    sessionsContainer.style.borderRadius = "12px";
    sessionsContainer.style.margin = "1rem auto";
    sessionsContainer.style.width = "100%";
    sessionsContainer.style.color = "#3e4042";
    sessionsContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.08)";
    sessionsContainer.dataset.patientId = patientId;

    patientsBox.appendChild(sessionsContainer);

    button.textContent = "Loading sessions...";

    try {
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/patients/sessions/${patientId}`
      );
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

      sessionsContainer.innerHTML = "";
      sessions.forEach((session) => {
        const sessionDiv = document.createElement("div");
        sessionDiv.style.border = "1px solid #ccc";
        sessionDiv.style.marginBottom = "1rem";
        sessionDiv.style.borderRadius = "10px";
        sessionDiv.style.background = "#fff";
        sessionDiv.style.width = "100%";

        const header = document.createElement("div");
        header.style.cursor = "pointer";
        header.style.padding = "0.8rem 1rem";
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.gap = "0.6rem";
        header.style.userSelect = "none";

        const arrow = document.createElement("span");
        arrow.textContent = "▶";
        arrow.style.transition = "transform 0.3s ease";
        arrow.style.display = "inline-block";

        const dateSpan = document.createElement("span");
        dateSpan.textContent = new Date(session.timeStamp).toLocaleString();

        header.appendChild(arrow);
        header.appendChild(dateSpan);
        sessionDiv.appendChild(header);

        const details = document.createElement("div");
        details.style.padding = "0 1rem 1rem 2rem";
        details.style.display = "none";

        sessionDiv.appendChild(details);

        header.addEventListener("click", async () => {
          if (details.style.display === "block") {
            details.style.display = "none";
            arrow.style.transform = "rotate(0deg)";
          } else {
            details.style.display = "block";
            arrow.style.transform = "rotate(90deg)";

            if (!details.hasChildNodes()) {
              details.textContent = "Loading session details...";
              try {
                const [symptoms, signals] = await Promise.all([
                  apiFetch(
                    `https://127.0.0.1:8443/api/patients/sessions/${session.sessionId}/symptoms`
                  ).then((r) => r.json()),
                  apiFetch(
                    `https://127.0.0.1:8443/api/patients/sessions/${session.sessionId}/signals`
                  ).then((r) => r.json()),
                ]);

                details.innerHTML = "";

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
                  symptoms.forEach((s) => {
                    const li = document.createElement("li");
                    li.textContent = s;
                    ul.appendChild(li);
                  });
                  details.appendChild(ul);
                }
                const signalsTitle = document.createElement("h4");
                signalsTitle.textContent = "Signals:";
                signalsTitle.style.margin = "1rem 0 0.4rem 0";
                details.appendChild(signalsTitle);

                if (signals.length === 0) {
                  const noSignals = document.createElement("p");
                  noSignals.textContent = "No signals recorded.";
                  details.appendChild(noSignals);
                } else {
                  signals.forEach((signal) => {
                    const signalDiv = document.createElement("div");
                    signalDiv.style.border = "1px solid #aaa";
                    signalDiv.style.marginBottom = "0.8rem";
                    signalDiv.style.borderRadius = "10px";
                    signalDiv.style.padding = "0.5rem";
                    signalDiv.style.background = "#f1efefff";
                    signalDiv.style.width = "100%";
                    signalDiv.style.maxWidth = "550px";
                    signalDiv.style.boxSizing = "border-box";

                    const signalHeader = document.createElement("div");
                    signalHeader.textContent = signal.signalType + " Signal";
                    signalHeader.style.fontWeight = "600";
                    signalHeader.style.marginBottom = "0.5rem";

                    signalDiv.appendChild(signalHeader);

                    const canvas = document.createElement("canvas");
                    canvas.style.width = "100%";
                    canvas.style.height = "120px";
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

  async function showCompareSessions(patientId) {
    const existingCompare = document.getElementById(
      "compare-sessions-container"
    );
    if (existingCompare) existingCompare.remove();

    const container = document.createElement("div");
    container.id = "compare-sessions-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.background = "#ffffff";
    container.style.padding = "1rem";
    container.style.borderRadius = "12px";
    container.style.margin = "1rem auto";
    container.style.width = "100%";
    container.style.color = "#3e4042";
    container.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";

    patientsBox.appendChild(container);

    container.innerHTML = `
      <p>Select exactly two sessions to compare:</p>
      <div id="sessions-checkbox-list" style="max-height: 250px; overflow-y: auto; margin-bottom: 1rem;"></div>
      <button id="compare-btn" disabled style="padding: 0.5rem 1rem; cursor: pointer; background: #4a90e2; color: white; border: none; border-radius: 8px;">Compare</button>
      <div id="comparison-result" style="margin-top: 1rem;"></div>`;

    const listDiv = container.querySelector("#sessions-checkbox-list");
    const compareBtn = container.querySelector("#compare-btn");
    const comparisonResult = container.querySelector("#comparison-result");

    try {
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/patients/sessions/${patientId}`
      );
      if (!res.ok) {
        listDiv.textContent = "Failed to load sessions";
        return;
      }
      const sessions = await res.json();

      if (!sessions.length) {
        listDiv.textContent = "No sessions found for this patient.";
        return;
      }

      sessions.forEach((session) => {
        const label = document.createElement("label");
        label.style.display = "block";
        label.style.marginBottom = "0.3rem";
        label.style.cursor = "pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = session.sessionId;
        checkbox.style.marginRight = "0.5rem";

        label.appendChild(checkbox);
        label.append(
          `Session on ${new Date(session.timeStamp).toLocaleString()}`
        );

        listDiv.appendChild(label);
      });

      listDiv.addEventListener("change", () => {
        const checkedBoxes = listDiv.querySelectorAll(
          "input[type='checkbox']:checked"
        );
        if (checkedBoxes.length === 2) {
          compareBtn.disabled = false;
          listDiv.querySelectorAll("input[type='checkbox']").forEach((cb) => {
            if (!cb.checked) cb.disabled = true;
          });
        } else {
          compareBtn.disabled = true;
          listDiv.querySelectorAll("input[type='checkbox']").forEach((cb) => {
            cb.disabled = false;
          });
        }
      });

      compareBtn.addEventListener("click", async () => {
        const checkedBoxes = Array.from(
          listDiv.querySelectorAll("input[type='checkbox']:checked")
        );
        if (checkedBoxes.length !== 2) return;

        const sessionId1 = checkedBoxes[0].value;
        const sessionId2 = checkedBoxes[1].value;

        comparisonResult.innerHTML = "Loading comparison...";

        try {
          const [symptoms1, signals1, symptoms2, signals2] = await Promise.all([
            apiFetch(
              `https://127.0.0.1:8443/api/patients/sessions/${sessionId1}/symptoms`
            ).then((r) => r.json()),
            apiFetch(
              `https://127.0.0.1:8443/api/patients/sessions/${sessionId1}/signals`
            ).then((r) => r.json()),
            apiFetch(
              `https://127.0.0.1:8443/api/patients/sessions/${sessionId2}/symptoms`
            ).then((r) => r.json()),
            apiFetch(
              `https://127.0.0.1:8443/api/patients/sessions/${sessionId2}/signals`
            ).then((r) => r.json()),
          ]);

          comparisonResult.innerHTML = `
            <div style="display:flex; gap:2rem;">
              <div style="flex:1;">
                <h4>Session 1 Symptoms</h4>
                ${
                  symptoms1.length === 0
                    ? "<p>No symptoms recorded.</p>"
                    : "<ul>" +
                      symptoms1.map((s) => `<li>${s}</li>`).join("") +
                      "</ul>"
                }
              </div>
              <div style="flex:1;">
                <h4>Session 2 Symptoms</h4>
                ${
                  symptoms2.length === 0
                    ? "<p>No symptoms recorded.</p>"
                    : "<ul>" +
                      symptoms2.map((s) => `<li>${s}</li>`).join("") +
                      "</ul>"
                }
              </div>
            </div>
            <div style="margin-top:2rem;">
              <h4>Overlaid Signals Comparison</h4>
            </div>
          `;

          const allSignalTypes = new Set([
            ...signals1.map((s) => s.signalType),
            ...signals2.map((s) => s.signalType),
          ]);

          allSignalTypes.forEach((signalType) => {
            const sig1 = signals1.find((s) => s.signalType === signalType);
            const sig2 = signals2.find((s) => s.signalType === signalType);

            const signalContainer = document.createElement("div");
            signalContainer.style.border = "1px solid #aaa";
            signalContainer.style.marginBottom = "1.5rem";
            signalContainer.style.borderRadius = "10px";
            signalContainer.style.padding = "0.5rem";
            signalContainer.style.background = "#f1efefff";
            signalContainer.style.width = "100%";
            signalContainer.style.maxWidth = "700px";
            signalContainer.style.boxSizing = "border-box";

            const signalHeader = document.createElement("div");
            signalHeader.textContent = signalType + " Signal Comparison";
            signalHeader.style.fontWeight = "600";
            signalHeader.style.marginBottom = "0.5rem";

            signalContainer.appendChild(signalHeader);

            const canvas = document.createElement("canvas");
            canvas.style.width = "100%";
            canvas.style.height = "150px";
            signalContainer.appendChild(canvas);

            comparisonResult.appendChild(signalContainer);

            const dataStr1 = sig1 ? sig1.patientSignalData : null;
            const dataStr2 = sig2 ? sig2.patientSignalData : null;

            renderOverlaySignalChart(canvas, dataStr1, dataStr2);
          });
        } catch (e) {
          comparisonResult.textContent = "Failed to load session details.";
          console.error(e);
        }
      });
    } catch (err) {
      listDiv.textContent = "Error loading sessions";
      console.error(err);
    }
  }

  function renderSignalChart(canvas, dataStr) {
    const ctx = canvas.getContext("2d");

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;

    if (width === 0) width = 600;
    if (height === 0) height = 150;

    canvas.width = width;
    canvas.height = height;

    if (!dataStr) {
      ctx.font = "16px Arial";
      ctx.fillText("No data", 10, 50);
      return;
    }

    const data = dataStr
      .split(",")
      .map((x) => parseFloat(x.trim()))
      .filter((x) => !isNaN(x));

    if (data.length === 0) {
      ctx.font = "16px Arial";
      ctx.fillText("No valid data", 10, 50);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const maxPoints = width;
    let plotData;

    if (data.length > maxPoints) {
      const blockSize = Math.floor(data.length / maxPoints);
      plotData = [];

      for (let i = 0; i < data.length; i += blockSize) {
        const block = data.slice(i, i + blockSize);
        const avg = block.reduce((a, b) => a + b, 0) / block.length;
        plotData.push(avg);
      }
    } else {
      plotData = data;
    }

    const min = Math.min(...plotData);
    const max = Math.max(...plotData);
    const range = max - min || 1;

    const scaleY = height / range;
    const stepX = width / (plotData.length - 1);

    ctx.strokeStyle = "#c4c0c0ff";
    ctx.lineWidth = 0.5;

    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#f36666";
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    plotData.forEach((val, i) => {
      const x = i * stepX;
      const y = height - (val - min) * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, height - (0 - min) * scaleY);
    ctx.lineTo(width, height - (0 - min) * scaleY);
    ctx.stroke();
  }

  function closeModal() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    btnApprove.focus();
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

  function renderOverlaySignalChart(canvas, dataStr1, dataStr2) {
    const ctx = canvas.getContext("2d");

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;

    if (width === 0) width = 600;
    if (height === 0) height = 150;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    if (!dataStr1 && !dataStr2) {
      ctx.font = "16px Arial";
      ctx.fillText("No data", 10, 50);
      return;
    }

    const parseData = (str) =>
      str
        ? str
            .split(",")
            .map((x) => parseFloat(x.trim()))
            .filter((x) => !isNaN(x))
        : [];

    let data1 = parseData(dataStr1);
    let data2 = parseData(dataStr2);

    if (data1.length === 0 && data2.length === 0) {
      ctx.font = "16px Arial";
      ctx.fillText("No valid data", 10, 50);
      return;
    }

    const maxPoints = width;
    const reduceData = (data) => {
      if (data.length > maxPoints) {
        const blockSize = Math.floor(data.length / maxPoints);
        const reduced = [];
        for (let i = 0; i < data.length; i += blockSize) {
          const block = data.slice(i, i + blockSize);
          const avg = block.reduce((a, b) => a + b, 0) / block.length;
          reduced.push(avg);
        }
        return reduced;
      }
      return data;
    };

    data1 = reduceData(data1);
    data2 = reduceData(data2);

    const combined = [...data1, ...data2];
    const min = Math.min(...combined);
    const max = Math.max(...combined);
    const range = max - min || 1;

    const scaleY = height / range;
    const stepX = width / (Math.max(data1.length, data2.length) - 1);

    ctx.strokeStyle = "#c4c0c0ff";
    ctx.lineWidth = 0.5;

    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#f36666";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    data1.forEach((val, i) => {
      const x = i * stepX;
      const y = height - (val - min) * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = "#1b3560ff";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    data2.forEach((val, i) => {
      const x = i * stepX;
      const y = height - (val - min) * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, height - (0 - min) * scaleY);
    ctx.lineTo(width, height - (0 - min) * scaleY);
    ctx.stroke();
  }

  async function handleApprove(patientId) {
    const confirmed = await showConfirmModal({
      message: "Approve patient?",
      type: "approve",
    });
    if (!confirmed) return;

    try {
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/doctors/me/approve/${patientId}`,
        {
          method: "POST",
        }
      );
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
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/doctors/me/reject/${patientId}`,
        {
          method: "POST",
        }
      );
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

  const doctorForm = document.querySelector(".doctor-info form");
  const nameInput = document.getElementById("doctor-name");
  const surnameInput = document.getElementById("doctor-surname");
  const genderInput = document.getElementById("doctor-gender");
  const localityInput = document.getElementById("doctor-locality");

  async function loadDoctorInfo() {
    try {
      const res = await apiFetch("https://127.0.0.1:8443/api/doctors/me");
      if (!res || !res.ok) return;

      const doctor = await res.json();

      console.log("Returned doctor object:", doctor);

      document.getElementById("detail-name").textContent = doctor.name || "";
      document.getElementById("detail-surname").textContent =
        doctor.surname || "";
      document.getElementById("detail-gender").textContent =
        doctor.gender || "";
      document.getElementById("detail-locality").textContent = doctor.locality
        ? doctor.locality.name
        : "";
    } catch (err) {
      console.error("Error loading doctor info:", err);
    }
  }

  loadDoctorInfo();

  doctorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {};
    if (nameInput.value) payload.name = nameInput.value;
    if (surnameInput.value) payload.surname = surnameInput.value;
    if (genderInput.value) payload.gender = genderInput.value;
    if (localityInput.value) payload.localidad = localityInput.value;

    try {
      const res = await apiFetch("https://127.0.0.1:8443/api/doctors/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Failed to update doctor info.");
        return;
      }

      const updatedDoctor = await res.json();
      alert("Doctor info updated successfully!");
      loadDoctorInfo();
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  });
});
