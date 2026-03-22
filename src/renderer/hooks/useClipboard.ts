import { useEffect, useState } from 'react';
import { clipboardApi } from '../lib/electron-api';

export function useClipboard() {
  const [clipboardText, setClipboardText] = useState('');
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    void clipboardApi.getMessage().then((text) => {
      setClipboardText(text);
    });
  }, []);

  const handlePasteFromSystem = async () => {
    const text = await clipboardApi.getMessage();
    setClipboardText(text);
    setStatus('Loaded from system clipboard');
  };

  const handleCopyToSystem = async () => {
    await clipboardApi.writeClipboard(clipboardText);
    setStatus('Copied to system clipboard');
  };

  return {
    clipboardText,
    status,
    setClipboardText,
    handlePasteFromSystem,
    handleCopyToSystem,
  };
}
