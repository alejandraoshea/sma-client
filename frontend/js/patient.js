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

  const statusText = document.getElementById("doctor-status-text");
  const doctorText = document.getElementById("doctor-name-text");

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
        if (doctor.name === null || doctor.surname == null) {
          return;
        }

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
      showToast("Please select exactly one doctor.", "info");
      return;
    }

    const doctorId = checked[0].value;

    try {
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/patients/request/${doctorId}`,
        { method: "POST" }
      );

      if (!res.ok) {
        showToast("Failed to request doctor.", "error");
        return;
      }

      showToast("Doctor requested successfully!", "success");
      doctorsForm.reset();
      loadDoctorStatus();
    } catch (err) {
      console.error(err);
      showToast("Network error.", "error");
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
        doctorText.innerHTML = "";
        statusCircle.classList.remove("hidden");
        submitButton.disabled = false;
        return;
      }

      statusCircle.classList.remove("hidden");

      const status = patient.doctorApprovalStatus;

      switch (status) {
        case "PENDING":
          statusText.innerHTML = `<p style="color:#d4a017">Pending</p>`;
          statusCircle.style.backgroundColor = "#d4a017";
          submitButton.disabled = true;
          if (patient.selectedDoctorId) {
            await loadDoctorInfo(patient.selectedDoctorId);
          }
          break;

        case "APPROVED":
          statusText.innerHTML = `<p style="color:#4a8c3b;">Approved ✔</p>`;
          statusCircle.style.backgroundColor = "#4a8c3b";
          submitButton.disabled = true;
          if (patient.selectedDoctorId) {
            await loadDoctorInfo(patient.selectedDoctorId);
          }
          break;

        case "DECLINED":
          statusText.innerHTML = `<p style="color:#c0392b">Declined</p>`;
          statusCircle.style.backgroundColor = "#c0392b";
          submitButton.disabled = false;
          doctorText.innerHTML = "";
          break;

        default:
          statusText.innerHTML = `<p style="color:#2e70b5">Unknown</p>`;
          statusCircle.style.backgroundColor = "#2e70b5";
          submitButton.disabled = false;
          doctorText.innerHTML = "";
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }

  const patientForm = document.querySelector(".patient-info form");
  const nameInput = document.getElementById("patient-name");
  const surnameInput = document.getElementById("patient-surname");
  const genderInput = document.getElementById("patient-gender");
  const birthdateInput = document.getElementById("patient-birthdate");
  const heightInput = document.getElementById("patient-height");
  const weightInput = document.getElementById("patient-weight");

  async function loadPatientInfo() {
    try {
      const res = await apiFetch("https://127.0.0.1:8443/api/patients/me");
      if (!res || !res.ok) return;

      const patient = await res.json();

      console.log("Returned patient object:", patient);

      document.getElementById("detail-name").textContent = patient.name || "";
      document.getElementById("detail-surname").textContent =
        patient.surname || "";
      document.getElementById("detail-gender").textContent =
        patient.gender || "";
      document.getElementById("detail-birthdate").textContent =
        patient.birthDate || "";
      document.getElementById("detail-height").textContent = patient.height
        ? patient.height + " cm"
        : "";
      document.getElementById("detail-weight").textContent = patient.weight
        ? patient.weight + " kg"
        : "";
    } catch (err) {
      console.error("Error loading patient info:", err);
    }
  }
  async function loadDoctorInfo(doctorId) {
    try {
      const res = await apiFetch(
        `https://127.0.0.1:8443/api/doctors/${doctorId}`
      );
      if (!res || !res.ok) {
        doctorText.innerHTML = "Failed to load doctor info.";
        return;
      }
      const doctor = await res.json();
      doctorText.innerHTML = `Dr. ${doctor.name} ${doctor.surname}`;
    } catch (err) {
      console.error(err);
      doctorText.innerHTML = "Error loading doctor info.";
    }
  }

  loadPatientInfo();

  patientForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: nameInput.value || undefined,
      surname: surnameInput.value || undefined,
      gender: genderInput.value || undefined,
      birthDate: birthdateInput.value || undefined,
      height: heightInput.value ? Number(heightInput.value) : undefined,
      weight: weightInput.value ? Number(weightInput.value) : undefined,
    };

    try {
      const res = await apiFetch("https://127.0.0.1:8443/api/patients/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        showToast("Failed to update patient info.", "error");
        return;
      }

      const updatedPatient = await res.json();
      showToast("Patient info updated successfully!", "success");
      loadPatientInfo();
    } catch (err) {
      console.error(err);
      showToast("Network error.", "error");
    }
  });

  const doctorIcon = new L.Icon({
    iconUrl: "../assets/images/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const map = L.map("doctors-map").setView([40.4168, -3.7038], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  async function loadDoctorsOnMap() {
    try {
      const res = await apiFetch(
        "https://127.0.0.1:8443/api/patients/me/map-doctors"
      );
      if (!res || !res.ok) return;

      const doctors = await res.json();

      doctors.forEach((doctor) => {
        if (
          doctor.locality &&
          doctor.locality.latitude &&
          doctor.locality.longitude
        ) {
          const marker = L.marker(
            [doctor.locality.latitude, doctor.locality.longitude],
            { icon: doctorIcon }
          ).addTo(map);

          marker.bindPopup(
            `<b>Dr. ${doctor.name} ${doctor.surname}</b><br>${doctor.locality.name}`
          );
        }
      });
    } catch (err) {
      console.error("Error loading doctors on map:", err);
    }
  }

  function showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.classList.add("toast", `toast-${type}`);
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "transform 0.3s ease, opacity 0.3s ease";
      toast.style.transform = "translateX(100%)";
      toast.style.opacity = "0";

      toast.addEventListener("transitionend", () => {
        toast.remove();
      });
    }, duration);
  }

  async function loadMedicalReports() {
    const historyDiv = document.getElementById("medical-history");
    historyDiv.innerHTML = "Loading medical reports...";

    try {
      const res = await apiFetch(
        "https://127.0.0.1:8443/api/patients/me/reports"
      );
      if (!res || !res.ok) {
        historyDiv.innerHTML =
          "<p style='color:red;'>Failed to load reports.</p>";
        return;
      }

      const reports = await res.json();

      if (!reports.length) {
        historyDiv.innerHTML = "<p>No medical history available.</p>";
        return;
      }

      historyDiv.innerHTML = "";

      reports.forEach((report) => {
        const card = document.createElement("div");
        card.className = "report-card";
        card.style.borderRadius = "12px";
        card.style.padding = "1rem 0.5rem";
        card.style.textAlign = "center";
        card.style.background = "#fafafa";
        card.style.cursor = "pointer";
        card.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
        card.style.transition = "transform 0.2s, box-shadow 0.2s";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "center";
        card.style.justifyContent = "center";

        const date = new Date(report.createdAt).toLocaleString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        card.innerHTML = `
          <img src="../assets/svgs/file.svg" />
          <div style="margin-top:0.5rem; font-size:0.8rem; color:grey;">
            ${date}
          </div>
        `;

        card.addEventListener("mouseover", () => {
          card.style.transform = "scale(1.05)";
          card.style.boxShadow = "0 6px 15px rgba(0,0,0,0.15)";
        });
        card.addEventListener("mouseout", () => {
          card.style.transform = "scale(1)";
          card.style.boxShadow = "0 3px 8px rgba(0,0,0,0.1)";
        });

        card.addEventListener("click", async () => {
          try {
            const downloadRes = await apiFetch(
              `https://127.0.0.1:8443/api/patients/me/reports/${report.reportId}`
            );

            if (!downloadRes.ok) throw new Error("Failed to download report");

            const blob = await downloadRes.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `report_${report.reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } catch (err) {
            showToast("Network error.", "error");
          }
        });

        historyDiv.appendChild(card);
      });
    } catch (err) {
      console.error("Error loading medical reports:", err);
      historyDiv.innerHTML = "<p style='color:red;'>Network error.</p>";
    }
  }

  loadMedicalReports();
  loadDoctors();
  loadDoctorStatus();
  loadPatientInfo();
  loadDoctorsOnMap();
});
