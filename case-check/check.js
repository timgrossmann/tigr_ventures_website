(() => {
  'use strict';
  const KEY = 'tigr.case-check.v1';
  const form = document.querySelector('#check');
  const fields = [...form.querySelectorAll('input, textarea')];
  const status = document.querySelector('#save-status');
  const exportStatus = document.querySelector('#export-status');
  let blocked = false;
  const say = (message, error = false) => { status.textContent = message; status.dataset.error = String(error); };
  function values() {
    const result = {};
    for (const field of fields) {
      if (field.type === 'checkbox') result[field.name] = field.checked;
      else if (field.type === 'radio') { if (!(field.name in result)) result[field.name] = ''; if (field.checked) result[field.name] = field.value; }
      else result[field.name] = field.value;
    }
    return result;
  }
  function valid(data) {
    if (!data || data.version !== 1 || typeof data.values !== 'object' || !data.values || Array.isArray(data.values)) return false;
    const blank = values();
    if (Object.keys(data.values).length !== Object.keys(blank).length) return false;
    return Object.keys(blank).every(name => {
      const field = fields.find(f => f.name === name), value = data.values[name];
      if (field.type === 'checkbox') return typeof value === 'boolean';
      if (typeof value !== 'string' || value.length > (field.maxLength > 0 ? field.maxLength : 5000)) return false;
      if (field.type === 'radio') return value === '' || fields.some(f => f.name === name && f.value === value);
      if (field.type === 'date' && value) { const input = document.createElement('input'); input.type = 'date'; input.value = value; return input.value === value; }
      return true;
    });
  }
  function number(value, integer) {
    const normalized = value.trim().replace(',', '.');
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) return null;
    const n = Number(normalized);
    return Number.isFinite(n) && n >= 0 && (!integer || Number.isSafeInteger(n)) ? n : null;
  }
  function hours() {
    const v = values(), cases = number(v.cases, true), minutes = number(v.minutes, false);
    if (!v.cases.trim() && !v.minutes.trim()) return 'Noch keine Stunden berechnet';
    if (cases === null || minutes === null) return 'Bitte Anzahl als ganze Zahl und Minuten als Zahl ab 0 eintragen.';
    const result = cases * minutes / 60;
    return Number.isFinite(result) ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(result) + ' Stunden im Zeitraum' : 'Die Zahlen sind zu groß. Bitte prüfen.';
  }
  function summary() {
    const v = values(), show = name => v[name] || '— noch nicht ausgefüllt';
    const lines = ['MEIN WORKFLOW-CHECK', '', 'Workflow: ' + show('workflow'), 'Wer wartet worauf? ' + show('waiting'), '', 'Patterns: ' + (fields.filter(f => f.type === 'checkbox' && f.checked).map(f => f.value).join(', ') || '— noch nicht gewählt'), '', 'BASELINE', 'Zeitraum: ' + show('period'), 'Anzahl Cases: ' + show('cases'), 'Minuten je Case: ' + show('minutes'), 'Anzahl Cases × Minuten ÷ 60: ' + hours(), 'Aufwand ist noch keine Einsparung.', 'Cross-Check: Systemzahl und offene Differenz: ' + show('crosscheck')];
    for (const section of form.querySelectorAll('.questions')) {
      lines.push('', section.querySelector('h2').textContent);
      for (const q of section.querySelectorAll('.question')) lines.push(q.querySelector('legend').textContent + ' ' + show(q.querySelector('input').name));
    }
    lines.push('', 'MEIN NEXT STEP', 'Eigene Entscheidung: ' + show('decision'), 'Was kläre oder teste ich zuerst? ' + show('first'), 'Mit wem? ' + show('who'), 'Bis wann prüfen wir erneut? ' + show('when'), '', 'Offene Voraussetzungen zuerst klären. Keine automatische Eignungs- oder Rechtsfreigabe.', 'https://tigr.ventures/case-check/');
    return lines.join('\n');
  }
  function refresh() {
    document.querySelector('#hours').textContent = hours();
    document.querySelector('#progress').textContent = form.querySelectorAll('.question input:checked').length + ' / 11 Fragen beantwortet';
    document.querySelector('#export-text').value = summary();
  }
  function save() {
    refresh();
    if (blocked) { say('Gespeicherte Daten sind beschädigt oder nicht lesbar. Neue Eingaben sind nur hier sichtbar. Bitte exportieren und bewusst zurücksetzen.', true); return; }
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, values: values() }));
      say('Auf diesem Gerät gespeichert · ' + new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date()));
    } catch { say('Speichern nicht möglich. Deine Eingaben bleiben nur in dieser geöffneten Seite. Bitte kopieren oder herunterladen.', true); }
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) {
      const data = JSON.parse(raw);
      if (!valid(data)) throw new Error('Invalid saved check');
      for (const field of fields) {
        const value = data.values[field.name];
        if (field.type === 'checkbox') field.checked = value;
        else if (field.type === 'radio') field.checked = field.value === value;
        else field.value = value;
      }
      say('Dein gespeicherter Check ist wieder da.');
    } else say('Noch keine Eingaben · Änderungen werden lokal gespeichert.');
  } catch (error) {
    blocked = error.name !== 'SecurityError';
    say(blocked ? 'Gespeicherte Daten konnten nicht gelesen werden. Bitte bewusst zurücksetzen; neue Eingaben vorher exportieren.' : 'Lokaler Speicher ist gesperrt. Bitte den Check vor dem Schließen kopieren oder herunterladen.', true);
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', save);
  form.addEventListener('change', save);
  document.querySelector('#copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(summary()); exportStatus.textContent = 'Check kopiert. Du kannst ihn jetzt einfügen.'; }
    catch { document.querySelector('#preview').open = true; const area = document.querySelector('#export-text'); area.focus(); area.select(); exportStatus.textContent = 'Automatisches Kopieren ist nicht verfügbar. Der Text ist markiert: bitte über das Kopiermenü deines Geräts kopieren.'; }
  });
  document.querySelector('#download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([summary()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'mein-workflow-check.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    exportStatus.textContent = 'Textdatei zum Speichern bereitgestellt.';
  });
  const dialog = document.querySelector('#reset-dialog');
  document.querySelector('#reset').addEventListener('click', () => dialog.showModal());
  document.querySelector('#cancel-reset').addEventListener('click', () => dialog.close());
  document.querySelector('#confirm-reset').addEventListener('click', () => {
    try { localStorage.removeItem(KEY); blocked = false; form.reset(); refresh(); say('Check gelöscht · neue Eingaben werden lokal gespeichert.'); exportStatus.textContent = ''; dialog.close(); document.querySelector('#workflow').focus(); }
    catch { dialog.close(); say('Löschen im Browser nicht möglich. Deine Eingaben bleiben erhalten. Prüfe die Speichereinstellungen deines Browsers.', true); }
  });
  refresh();
})();
