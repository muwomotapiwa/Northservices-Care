document.addEventListener('DOMContentLoaded', function() {
  const dataRaw = sessionStorage.getItem('clientContractData');
  if (!dataRaw) return;

  let data;
  try {
    data = JSON.parse(dataRaw);
  } catch (e) {
    return;
  }

  const downloadBlock = document.getElementById('downloadCopy');
  const summary = document.getElementById('downloadSummary');
  const btn = document.getElementById('downloadCopyBtn');
  if (!downloadBlock || !summary || !btn) return;

  const safe = (v) => (v ? v : 'N/A');
  summary.innerHTML = `
    <strong>Patient:</strong> ${safe(data.patientName)} — ${safe(data.patientCell)}<br>
    <strong>Payer:</strong> ${safe(data.paymentName)} — ${safe(data.paymentCell)}<br>
    <strong>Email:</strong> ${safe(data.paymentEmail)}<br>
    <strong>Submitted:</strong> ${safe(data.submittedAt)}
  `;

  downloadBlock.style.display = 'block';
  btn.addEventListener('click', () => window.print());
});
