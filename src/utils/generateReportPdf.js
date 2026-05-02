import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPKTDisplay } from './pktTime';

/**
 * Generate and download a PDF report matching the ExamReportView layout.
 * @param {object} report — the same report shape from ExamReportPrototype / buildExamReport
 */
export function generateReportPdf(report) {
  if (!report) return;

  const { test, student, attempt, stats, questions } = report;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Colors ──────────────────────────────────────────────────
  const purple = [168, 85, 247];
  const teal = [0, 221, 179];
  const darkBg = [15, 23, 42];
  const white = [255, 255, 255];
  const red = [239, 68, 68];
  const gray = [148, 163, 184];

  // ── Helper: add page if needed ──
  const checkPage = (needed = 20) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = margin;
    }
  };

  // ══════════════════════════════════════════════════════════════
  // HEADER SECTION
  // ══════════════════════════════════════════════════════════════
  doc.setFillColor(...darkBg);
  doc.roundedRect(margin, y, contentWidth, 42, 3, 3, 'F');

  // Test name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...white);
  doc.text(test?.name || 'Assessment', margin + 6, y + 12);

  // Student info
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  let studentLine = student?.displayName || 'Student';
  if (student?.enrollmentNumber && student.enrollmentNumber !== '—') {
    studentLine += `  ·  #${student.enrollmentNumber}`;
  }
  doc.text(studentLine, margin + 6, y + 20);

  if (student?.email) {
    doc.setFontSize(8);
    doc.text(student.email, margin + 6, y + 26);
  }

  // Score on the right
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...teal);
  const scoreText = String(attempt?.score ?? '—');
  const scoreWidth = doc.getTextWidth(scoreText);
  doc.text(scoreText, margin + contentWidth - 6 - scoreWidth, y + 18);

  doc.setFontSize(8);
  doc.setTextColor(...gray);
  const scoreLabelText = `Score${test?.totalMarks != null ? ` (of ${test.totalMarks})` : ''}`;
  const scoreLabelW = doc.getTextWidth(scoreLabelText);
  doc.text(scoreLabelText, margin + contentWidth - 6 - scoreLabelW, y + 8);

  // Pass / Fail badge
  if (attempt?.passed != null) {
    const badge = attempt.passed ? 'PASS' : 'FAIL';
    const badgeColor = attempt.passed ? teal : red;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...badgeColor);
    const badgeW = doc.getTextWidth(badge);
    doc.text(badge, margin + contentWidth - 6 - badgeW, y + 25);
  }

  // Submitted at
  const timeStr = attempt?.submittedAt
    ? `Submitted: ${toPKTDisplay(attempt.submittedAt)}`
    : attempt?.startedAt
      ? `Started: ${toPKTDisplay(attempt.startedAt)}`
      : '';
  if (timeStr) {
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    const tw = doc.getTextWidth(timeStr);
    doc.text(timeStr, margin + contentWidth - 6 - tw, y + 32);
  }

  // Percentage
  if (attempt?.scorePercent != null) {
    const pctStr = `${attempt.scorePercent}%  ·  pass threshold ${attempt.passingPercentage ?? '—'}%`;
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    const pw = doc.getTextWidth(pctStr);
    doc.text(pctStr, margin + contentWidth - 6 - pw, y + 37);
  }

  y += 48;

  // ══════════════════════════════════════════════════════════════
  // STATS CARDS
  // ══════════════════════════════════════════════════════════════
  const statsData = [
    { label: 'Total Score', value: String(attempt?.score ?? '—'), color: teal },
    { label: 'Accuracy', value: `${stats?.accuracyPct ?? 0}%`, color: [34, 197, 94] },
    { label: 'Correct', value: String(stats?.correctCount ?? 0), color: [14, 165, 233] },
    { label: 'Incorrect', value: String(stats?.wrongCount ?? 0), color: red },
    {
      label: attempt?.violations > 0 ? 'Violation Detected' : 'Proctor Flags',
      value: String(attempt?.violations ?? 0),
      color: attempt?.violations > 0 ? red : gray,
    },
  ];

  const cardW = (contentWidth - 4 * 3) / 5;
  statsData.forEach((stat, i) => {
    const cx = margin + i * (cardW + 3);
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.roundedRect(cx, y, cardW, 22, 2, 2, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...stat.color);
    doc.text(stat.value, cx + cardW / 2, y + 10, { align: 'center' });

    doc.setFontSize(6);
    doc.setTextColor(...gray);
    doc.text(stat.label, cx + cardW / 2, y + 17, { align: 'center' });
  });

  y += 28;

  // ══════════════════════════════════════════════════════════════
  // QUESTIONS BREAKDOWN
  // ══════════════════════════════════════════════════════════════
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('Question Breakdown', margin, y);
  y += 8;

  (questions || []).forEach((q) => {
    checkPage(50);

    // Question header
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    const qHeaderH = 10;
    doc.roundedRect(margin, y, contentWidth, qHeaderH, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text(`Q${q.index}.`, margin + 4, y + 6.5);

    doc.setTextColor(...white);
    const qText = q.questionText || '';
    const truncated = qText.length > 100 ? qText.substring(0, 100) + '...' : qText;
    doc.text(truncated, margin + 16, y + 6.5);

    // Correct/Incorrect badge
    const badge = q.isCorrect ? 'Correct' : 'Incorrect';
    const badgeCol = q.isCorrect ? teal : red;
    doc.setTextColor(...badgeCol);
    const bw = doc.getTextWidth(badge);
    doc.text(badge, margin + contentWidth - 4 - bw, y + 6.5);

    y += qHeaderH + 2;

    // Full question text if truncated
    if (qText.length > 100) {
      checkPage(15);
      doc.setFontSize(8);
      doc.setTextColor(...white);
      const lines = doc.splitTextToSize(qText, contentWidth - 10);
      doc.text(lines, margin + 4, y + 4);
      y += lines.length * 3.5 + 4;
    }

    // Options table
    const optionRows = (q.options || []).map((opt) => {
      const letter = opt.letter?.toUpperCase();
      const selected = q.selectedOption === letter;
      const correct = q.correctOption === letter;

      let status = '';
      if (selected && correct) status = '✓ Your Choice (Correct)';
      else if (selected && !correct) status = '✗ Your Choice';
      else if (!selected && correct) status = '✓ Correct Answer';

      return [letter + '.', opt.text || '', status];
    });

    if (optionRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [],
        body: optionRows,
        theme: 'plain',
        margin: { left: margin + 2, right: margin + 2 },
        styles: {
          fontSize: 8,
          textColor: [200, 200, 220],
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 8, fontStyle: 'bold', textColor: gray },
          1: { cellWidth: contentWidth - 48 },
          2: { cellWidth: 36, fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          if (data.column.index === 2) {
            const val = data.cell.raw || '';
            if (val.includes('✓')) {
              data.cell.styles.textColor = teal;
            } else if (val.includes('✗')) {
              data.cell.styles.textColor = red;
            }
          }
        },
      });
      y = doc.lastAutoTable.finalY + 2;
    }

    // Explanation
    if (q.explanation && String(q.explanation).trim()) {
      checkPage(15);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(103, 232, 249);
      doc.text('Justification:', margin + 4, y + 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(200, 200, 220);
      const expLines = doc.splitTextToSize(q.explanation, contentWidth - 14);
      doc.text(expLines, margin + 4, y + 7);
      y += expLines.length * 3 + 8;
    }

    // Marks awarded
    if (q.marksAwarded != null) {
      doc.setFontSize(7);
      doc.setTextColor(...gray);
      doc.text(`Marks: ${q.marksAwarded}`, margin + 4, y + 2);
      y += 5;
    }

    y += 4;
  });

  // ══════════════════════════════════════════════════════════════
  // IP PROCTOR AUDIT (if present)
  // ══════════════════════════════════════════════════════════════
  if (report.ipAudit && report.audience === 'teacher') {
    checkPage(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('IP Proctor Audit', margin, y);
    y += 8;

    const ipData = report.ipAudit;
    const proctor = report.proctor || {};
    const auditRows = [
      ['Tab Switch Flags', String(proctor.tabSwitchViolations ?? 0)],
      ['Initial IP', ipData.initialIp || '—'],
      ['IP Locked', ipData.ipLocked ? 'YES — Auto-submitted' : 'No'],
      ['IP Flags', String(ipData.ipChangeCount ?? 0)],
      ['VPN Detected', ipData.vpnDetected ? 'YES' : 'No'],
    ];

    autoTable(doc, {
      startY: y,
      body: auditRows,
      theme: 'plain',
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, textColor: [200, 200, 220], cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: gray, cellWidth: 40 },
      },
    });
    y = doc.lastAutoTable.finalY + 4;

    // IP log entries
    if (ipData.logs && ipData.logs.length > 0) {
      checkPage(20);
      autoTable(doc, {
        startY: y,
        head: [['Time (PKT)', 'IP Address', 'Action', 'VPN']],
        body: ipData.logs.map((log) => [
          toPKTDisplay(log.created_at),
          log.ip_address || '—',
          log.action || '—',
          log.is_vpn ? 'Yes' : 'No',
        ]),
        theme: 'grid',
        margin: { left: margin, right: margin },
        headStyles: { fillColor: darkBg, textColor: teal, fontSize: 7 },
        styles: { fontSize: 7, textColor: [200, 200, 220], cellPadding: 1.5 },
      });
      y = doc.lastAutoTable.finalY + 4;
    }
  }

  // ── Footer ──────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(
      `Online Class Marker System  ·  Generated ${toPKTDisplay(new Date().toISOString())}  ·  Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // ── Download ──────────────────────────────────────────────
  const fileName = `Report_${(test?.name || 'Exam').replace(/\s+/g, '_')}_${(student?.displayName || 'Student').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
