import React, { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { Volume2, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function StudentQuiz({ words, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('drawing'); // 'drawing', 'success', 'finished'
  const canvasRef = useRef(null);
  const writerRef = useRef(null);

  const currentWord = words[currentIndex];

  const playAudio = () => {
    if (!currentWord) return;
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8; // slightly slower for spelling practice
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (words.length > 0 && currentIndex < words.length) {
      // Auto-play audio when word changes
      playAudio();

      if (writerRef.current) {
        writerRef.current.setCharacter(currentWord);
      } else {
        // Initialize HanziWriter on first load
        writerRef.current = HanziWriter.create(canvasRef.current, currentWord, {
          width: 300,
          height: 300,
          padding: 20,
          showCharacter: false, // hide character for spelling practice
          showOutline: false,   // hide outline
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 50,
        });
      }

      setStatus('drawing');
      
      // Start the quiz
      writerRef.current.quiz({
        onMistake: (strokeData) => {
          // Could play error sound or flash red
        },
        onComplete: (summaryData) => {
          setStatus('success');
          // When done tracing correctly, optionally show character
          writerRef.current.showCharacter({
            duration: 500
          });
        }
      });
    } else if (currentIndex >= words.length && words.length > 0) {
      setStatus('finished');
    }

    // Cleanup: we don't destroy HanziWriter, just recycle it or hide it
  }, [currentIndex, words, currentWord]);

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
  };

  if (words.length === 0) return null;

  if (status === 'finished') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <CheckCircle2 color="var(--success-color)" size={80} style={{ margin: '0 auto 1.5rem auto' }} />
        <h2>Great Job!</h2>
        <p className="subtitle" style={{ marginTop: '0.5rem' }}>You completed all {words.length} words.</p>
        <button className="btn" onClick={onFinish} style={{ marginTop: '2rem' }}>
          Back to Parent Menu
        </button>
      </div>
    );
  }

  const progress = ((currentIndex) / words.length) * 100;

  return (
    <div>
      <div className="nav-header">
        <button onClick={onFinish}>
          <ArrowLeft size={18} /> Exit
        </button>
        <span style={{ color: 'var(--text-secondary)' }}>
          {currentIndex + 1} of {words.length}
        </span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <button className="audio-btn" onClick={playAudio} aria-label="Play Pronunciation">
        <Volume2 />
      </button>

      <div className="status-text">
        {status === 'success' ? (
          <span className="status-success">Correct! Well done.</span>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>Draw the character below</span>
        )}
      </div>

      <div className="canvas-container">
        {/* The HanziWriter will attach its SVG here */}
        <div ref={canvasRef} className="hanzi-canvas" />
      </div>

      <div className="controls">
        {status === 'success' && (
          <button className="btn" onClick={handleNext}>
            Next Word <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
