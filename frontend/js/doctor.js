document.addEventListener("DOMContentLoaded", () => {
  const doctorId = 4; 

  const seePatientsBtn = document.getElementById("see-patients-btn");
  const requestsBox = document.getElementById("requests-box");
  const patientsBox = document.getElementById("patients-box");
  const requestsList = document.getElementById("requests-list");
  const requestsTitle = document.getElementById("requests-title");
  const patientsBody = document.getElementById("patients-body");

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
        `;
        patientsBody.appendChild(tr);
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
