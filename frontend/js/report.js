async function generateAndDownloadReport(doctorId, sessionId) {
  try {
    const generateResponse = await fetch(`/api/doctors/${doctorId}/report/${sessionId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!generateResponse.ok) {
      throw new Error(`Failed to generate report: ${generateResponse.statusText}`);
    }

    const report = await generateResponse.json();
    const reportId = report.reportId;

    const pdfResponse = await fetch(`/api/doctors/reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf'
      }
    });

    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }

    const blob = await pdfResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    a.download = report.fileName || `report_${reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating or downloading report:', error);
    alert('Sorry, there was an error downloading the report.');
  }
}
