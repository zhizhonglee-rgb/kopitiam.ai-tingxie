import React, { useState } from 'react';
import ParentUpload from './components/ParentUpload';
import StudentQuiz from './components/StudentQuiz';
import { Sparkles } from 'lucide-react';

function App() {
  const [words, setWords] = useState([]);
  const [mode, setMode] = useState('parent'); // 'parent' or 'student'

  const handleStartQuiz = (wordList) => {
    setWords(wordList);
    setMode('student');
  };

  const handleEndQuiz = () => {
    setMode('parent');
  };

  return (
    <div className="glass-panel" style={{ width: '100%' }}>
      <h1 className="title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <Sparkles size={36} color="#818cf8" />
        听写 Magic
      </h1>
      <p className="subtitle">Interactive Chinese Spelling Practice</p>
      
      {mode === 'parent' ? (
        <ParentUpload onStart={handleStartQuiz} initialWords={words} />
      ) : (
        <StudentQuiz words={words} onFinish={handleEndQuiz} />
      )}
    </div>
  );
}

export default App;
