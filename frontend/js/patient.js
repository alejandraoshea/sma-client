document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "../../index.html";

  const claims = jwt_decode(token);
  if (claims.role !== "PATIENT") window.location.href = "../../index.html";

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
    if (!res) return null;
    return res;
  }

  const doctorsList = document.getElementById("doctors-list");
  const doctorsForm = document.getElementById("doctors-form");

  const statusBox = document.getElementById("doctor-status-box");
  const statusText = document.getElementById("doctor-status-text");

  loadDoctors();
  loadDoctorStatus();

  async function loadDoctors() {
    doctorsList.innerHTML = "Loading doctors...";
    try {
      const res = await apiFetch("https://127.0.0.1:8443/api/doctors");

      if (!res) return;

      if (!res.ok) {
        doctorsList.innerHTML =
          "<p style='color:red;'>Failed to load doctors.</p>";
        return;
      }

      const doctors = await res.json();

      if (!doctors.length) {
        doctorsList.innerHTML = "<p>No doctors available.</p>";
        return;
      }

      doctorsList.innerHTML = "";
      doctors.forEach((doctor) => {
        const div = document.createElement("div");
        div.className = "doctor-item";
        div.innerHTML = `
          <input type="radio" name="doctor" value="${doctor.doctorId}" id="doctor-${doctor.doctorId}" />
          <label for="doctor-${doctor.doctorId}">
            <p>Dr. ${doctor.name} ${doctor.surname}</p>
          </label>
        `;
        doctorsList.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      doctorsList.innerHTML = "<p style='color:red;'>Network error.</p>";
    }
  }

  doctorsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const checked = [
      ...doctorsForm.querySelectorAll('input[name="doctor"]:checked'),
    ];
    if (checked.length !== 1) {
      alert("Please select exactly one doctor.");
      return;
    }

    const doctorId = checked[0].value;

    try {
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/patients/request/${doctorId}`,
        { method: "POST" }
      );

      if (!res.ok) {
        alert("Failed to request doctor.");
        return;
      }

      alert("Doctor requested successfully!");
      doctorsForm.reset();
      loadDoctorStatus();
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  });

  const submitButton = doctorsForm.querySelector('button[type="submit"]');

  async function loadDoctorStatus() {
    try {
      const res = await apiFetch(`https://127.0.0.1:8443/api/patients/me`);
      if (!res || !res.ok) return;

      const patient = await res.json();
      const statusCircle = document.getElementById("doctor-status-box");

      if (!patient.selectedDoctorId) {
        statusCircle.style.backgroundColor = "blue";
        statusText.innerHTML = "No doctor assigned";
        statusCircle.classList.remove("hidden");
        submitButton.disabled = false;
        return;
      }

      statusCircle.classList.remove("hidden");
      const doctor = patient.selectedDoctor;
      const status = patient.doctorApprovalStatus;

      switch (status) {
        case "PENDING":
          statusText.innerHTML = `<p style="color:#d4a017">Pending</p>`;
          statusCircle.style.backgroundColor = "#d4a017";
          submitButton.disabled = true;
          break;

        case "APPROVED":
          statusText.innerHTML = `<p style="color:#4a8c3b;">Approved ✔</p>`;
          statusCircle.style.backgroundColor = "#4a8c3b";
          submitButton.disabled = true;
          break;

        case "DECLINED":
          statusText.innerHTML = `<p style="color:#c0392b">Declined</p>`;
          statusCircle.style.backgroundColor = "#c0392b";
          submitButton.disabled = false;
          break;

        default:
          statusText.innerHTML = `<p style="color:#2e70b5">Unknown</p>`;
          statusCircle.style.backgroundColor = "#2e70b5";
          submitButton.disabled = false;
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
});
