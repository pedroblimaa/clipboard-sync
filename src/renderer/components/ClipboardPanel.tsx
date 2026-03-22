import './ClipboardPanel.css';
import { useClipboard } from '../hooks/useClipboard';

export function ClipboardPanel() {
  const {
    clipboardText,
    status,
    setClipboardText,
    handlePasteFromSystem,
    handleCopyToSystem,
  } = useClipboard();

  return (
    <section className="panel">
      <p className="eyebrow">Clipboard Sync</p>
      <h1>Keep one clipboard text ready to sync.</h1>
      <p className="lede">
        This is a React renderer hooked up to Electron via your preload API.
      </p>

      <label className="field" htmlFor="clipboard-text">
        Clipboard text
      </label>
      <textarea
        id="clipboard-text"
        value={clipboardText}
        onChange={(event) => setClipboardText(event.target.value)}
        placeholder="Type or load clipboard text here..."
        rows={10}
      />

      <div className="actions">
        <button type="button" onClick={handlePasteFromSystem}>
          Read clipboard
        </button>
        <button type="button" onClick={handleCopyToSystem}>
          Write clipboard
        </button>
      </div>

      <p className="status">{status}</p>
    </section>
  );
}
