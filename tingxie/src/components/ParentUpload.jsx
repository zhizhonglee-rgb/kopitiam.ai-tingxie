import React, { useState } from 'react';
import { Upload, Play } from 'lucide-react';

export default function ParentUpload({ onStart, initialWords }) {
  const [inputText, setInputText] = useState(initialWords.join(' '));

  const handleTextChange = (e) => {
    setInputText(e.target.value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(prev => prev + ' ' + event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const getCleanWords = () => {
    if (!inputText) return [];
    // Split by comma or newline
    const phrases = inputText.split(/[,\n，]+/).map(p => p.trim()).filter(p => p.length > 0);
    // Keep phrases that contain Chinese characters and strip non-chinese parts
    return phrases
      .filter(p => /[\u4e00-\u9fa5]/.test(p))
      .map(p => p.replace(/[^\u4e00-\u9fa5]/g, ''));
  };

  const words = getCleanWords();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Enter Characters to Practice:
        </label>
        <textarea
          className="input-area"
          value={inputText}
          onChange={handleTextChange}
          placeholder="Type or paste Chinese characters here... (e.g. 欢迎光临)"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <label className="btn btn-secondary" style={{ width: 'auto', cursor: 'pointer', flex: 1 }}>
          <Upload size={20} />
          Upload .txt File
          <input 
            type="file" 
            accept=".txt,.csv" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
        </label>
      </div>

      {words.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Recognized Characters ({words.length}):
          </div>
          <div className="word-list">
            {words.map((word, idx) => (
              <span key={idx} className="word-chip">{word}</span>
            ))}
          </div>
        </div>
      )}

      <button 
        className="btn" 
        onClick={() => onStart(words)}
        disabled={words.length === 0}
        style={{ opacity: words.length === 0 ? 0.5 : 1 }}
      >
        <Play size={20} />
        Start Spelling Exercise
      </button>
    </div>
  );
}
