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
  summary.style.whiteSpace = 'pre-line';
  summary.textContent =
    `Patient: ${safe(data.patientName)} — ${safe(data.patientCell)}\n` +
    `Payer: ${safe(data.paymentName)} — ${safe(data.paymentCell)}\n` +
    `Email: ${safe(data.paymentEmail)}\n` +
    `Submitted: ${safe(data.submittedAt)}`;

  downloadBlock.style.display = 'block';
  btn.addEventListener('click', () => {
    window.location.href = 'client-contract.html?printcopy=1&returnTo=thank-you.html';
  });
});
