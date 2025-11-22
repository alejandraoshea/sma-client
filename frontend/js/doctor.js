document.addEventListener("DOMContentLoaded", () => {
  const doctorId = 1; 

  const seePatientsBtn = document.getElementById("see-patients-btn");
  const requestsBox = document.getElementById("requests-box");
  const patientsBox = document.getElementById("patients-box");
  const requestsList = document.getElementById("requests-list");
  const requestsTitle = document.getElementById("requests-title");
  const patientsBody = document.getElementById("patients-body");

  seePatientsBtn.addEventListener("click", async () => {
    requestsBox.classList.toggle("hidden");
    patientsBox.classList.toggle("hidden");

    await loadRequests();
    await loadPatients();
  });

  async function loadRequests() {
    requestsList.innerHTML = "Loading requests...";
    try {
      const res = await fetch(`http://localhost:8080/api/doctors/${doctorId}/requests`);
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
        left.innerHTML = `<strong>${req.patientId}</strong> ${req.name || req.patientName || ""} ${req.surname || req.patientSurname || ""}`;

        const actions = document.createElement("div");
        actions.className = "request-actions";

        const acc = document.createElement("button");
        acc.className = "accept-btn";
        acc.textContent = "Accept";
        acc.onclick = () => handleApprove(req.patientId);

        const dec = document.createElement("button");
        dec.className = "decline-btn";
        dec.textContent = "Decline";
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
    patientsBody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";
    try {
      const res = await fetch(`http://localhost:8080/api/doctors/${doctorId}/patients`);
      if (!res.ok) {
        patientsBody.innerHTML = "<tr><td colspan='4'>Could not load patients</td></tr>";
        return;
      }
      const list = await res.json();
      patientsBody.innerHTML = "";
      if (!Array.isArray(list) || list.length === 0) {
        patientsBody.innerHTML = "<tr><td colspan='4'>No patients yet</td></tr>";
        return;
      }

      list.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="padding:.6rem;border:1px solid #eee">${p.patientId ?? p.id ?? p.id}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.name ?? p.patientName ?? ""}</td>
          <td style="padding:.6rem;border:1px solid #eee">${p.surname ?? p.patientSurname ?? ""}</td>
          <td style="padding:.6rem;border:1px solid #eee">
            <button class="accept-btn" data-id="${p.patientId ?? p.id ?? p.id}">View</button>
          </td>
        `;
        patientsBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      patientsBody.innerHTML = "<tr><td colspan='4'>Error loading patients</td></tr>";
    }
  }

  async function handleApprove(patientId) {
    if (!confirm("Approve patient?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/doctors/${doctorId}/approve/${patientId}`, {
        method: "POST"
      });
      if (!res.ok) {
        alert("Failed to approve");
        return;
      }
      alert("Approved");
      await loadRequests();
      await loadPatients();
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  }

  async function handleReject(patientId) {
    if (!confirm("Reject patient?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/doctors/${doctorId}/reject/${patientId}`, {
        method: "POST"
      });
      if (!res.ok) {
        alert("Failed to reject");
        return;
      }
      alert("Rejected");
      await loadRequests();
      await loadPatients();
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  }

});
