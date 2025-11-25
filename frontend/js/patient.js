document.addEventListener("DOMContentLoaded", () => {
  const patientId = 1; // TODO: replace when login is connected

  const seeDoctorsBtn = document.getElementById("see-doctors-btn");
  const doctorsListContainer = document.getElementById("doctors-list-container");
  const doctorsList = document.getElementById("doctors-list");
  const doctorsForm = document.getElementById("doctors-form");

  const statusBox = document.getElementById("doctor-status-box");
  const statusText = document.getElementById("doctor-status-text");

  loadDoctorStatus();

  seeDoctorsBtn.addEventListener("click", async () => {
    doctorsListContainer.classList.toggle("hidden");
    if (!doctorsListContainer.classList.contains("hidden")) {
      await loadDoctors();
    }
  });

  async function loadDoctors() {
    doctorsList.innerHTML = "Loading doctors...";
    try {
      const res = await fetch("https://127.0.0.1:8443/api/doctors");
      if (!res.ok) {
        doctorsList.innerHTML = "<p style='color:red;'>Failed to load doctors.</p>";
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
          <input type="checkbox" name="doctor" value="${doctor.doctorId}" id="doctor-${doctor.doctorId}" />
          <label for="doctor-${doctor.doctorId}">
            <strong>Dr. ${doctor.name} ${doctor.surname}</strong><br/>
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

    const checked = [...doctorsForm.querySelectorAll('input[name="doctor"]:checked')];
    if (checked.length !== 1) {
      alert("Please select exactly one doctor.");
      return;
    }

    const doctorId = checked[0].value;

    try {
      const res = await fetch(`https://127.0.0.1:8443/api/patients/${patientId}/request/${doctorId}`, {
        method: "POST",
      });

      if (!res.ok) {
        alert("Failed to request doctor.");
        return;
      }

      alert("Doctor requested successfully!");
      doctorsForm.reset();
      doctorsListContainer.classList.add("hidden");

      loadDoctorStatus();
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  });

  async function loadDoctorStatus() {
    try {
      const res = await fetch(`https://127.0.0.1:8443/api/patients/${patientId}`);
      if (!res.ok) return;

      const patient = await res.json();

      if (!patient.selecteddoctorId) {
        statusBox.classList.add("hidden");
        return;
      }

      statusBox.classList.remove("hidden");

      const doctor = patient.selectedDoctor;
      const status = patient.doctorApprovalStatus;

      if (status === "PENDING") {
        statusText.innerHTML = `
          Request Status for Dr. ${doctor.name} ${doctor.surname}: 
          <strong style="color:orange">Pending</strong>
        `;
      } else if (status === "APPROVED") {
        statusText.innerHTML = `
          Your assigned doctor is <strong>Dr. ${doctor.name} ${doctor.surname}</strong>.
          <span style="color:green; font-weight:bold;">Approved ✔</span>
        `;
      } else if (status === "DECLINED") {
        statusText.innerHTML = `
          Your request for Dr. ${doctor.name} ${doctor.surname} was 
          <strong style="color:red">Declined</strong>.<br>
          You may request another doctor.
        `;

        seeDoctorsBtn.disabled = false;
      }

    } catch (err) {
      console.error(err);
    }
  }
});
