import React, { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { Volume2, ChevronRight, CheckCircle2, ArrowLeft, RotateCcw, Eye } from 'lucide-react';

const CANVAS_SIZE = 280;

function drawGrid(canvas) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;

  // Center cross (solid)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();

  // Diagonal cross (dashed)
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, size);
  ctx.moveTo(size, 0);
  ctx.lineTo(0, size);
  ctx.stroke();
  ctx.setLineDash([]);
}

function setupDrawing(canvas) {
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onPointerDown(e) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
  }

  function onPointerMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
  }

  function onPointerUp(e) {
    e.preventDefault();
    isDrawing = false;
  }

  function onPointerLeave() {
    isDrawing = false;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);

  // Return cleanup function
  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerleave', onPointerLeave);
  };
}

export default function StudentQuiz({ words, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('drawing'); // 'drawing', 'revealed', 'finished'
  const canvasContainerRef = useRef(null);
  const answerContainerRef = useRef(null);
  const canvasesRef = useRef([]);
  const cleanupsRef = useRef([]);

  const currentPhrase = words[currentIndex];

  const playAudio = () => {
    if (!currentPhrase) return;
    const utterance = new SpeechSynthesisUtterance(currentPhrase);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // Initialize canvases when word changes
  useEffect(() => {
    if (words.length > 0 && currentIndex < words.length) {
      playAudio();
      setStatus('drawing');
      const chars = currentPhrase.split('');

      // Clean up previous event listeners
      cleanupsRef.current.forEach(fn => fn());
      cleanupsRef.current = [];

      // Clear containers
      if (canvasContainerRef.current) canvasContainerRef.current.innerHTML = '';
      if (answerContainerRef.current) answerContainerRef.current.innerHTML = '';
      canvasesRef.current = [];

      chars.forEach(() => {
        const wrapper = document.createElement('div');
        wrapper.className = 'drawing-wrapper';

        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        canvas.className = 'drawing-canvas';

        wrapper.appendChild(canvas);
        canvasContainerRef.current.appendChild(wrapper);
        canvasesRef.current.push(canvas);

        // Draw grid guidelines
        drawGrid(canvas);

        // Set up drawing and store cleanup
        const cleanup = setupDrawing(canvas);
        cleanupsRef.current.push(cleanup);
      });

    } else if (currentIndex >= words.length && words.length > 0) {
      setStatus('finished');
    }

    // Cleanup on unmount
    return () => {
      cleanupsRef.current.forEach(fn => fn());
      cleanupsRef.current = [];
    };
  }, [currentIndex, words, currentPhrase]);

  const handleClear = () => {
    canvasesRef.current.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(canvas);
    });
  };

  const handleCheck = () => {
    setStatus('revealed');
  };

  // Populate answer container after it renders
  useEffect(() => {
    if (status !== 'revealed' || !answerContainerRef.current) return;
    answerContainerRef.current.innerHTML = '';
    const chars = currentPhrase.split('');

    chars.forEach((char) => {
      const div = document.createElement('div');
      div.className = 'answer-char';
      answerContainerRef.current.appendChild(div);

      const writer = HanziWriter.create(div, char, {
        width: 120,
        height: 120,
        padding: 10,
        strokeColor: '#4ade80',
        strokeAnimationSpeed: 1.5,
        delayBetweenStrokes: 100,
      });
      writer.animateCharacter();
    });
  }, [status, currentPhrase]);

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
        {status === 'revealed' ? (
          <span className="status-success">Compare your answer below</span>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>Draw the character below</span>
        )}
      </div>

      {status === 'revealed' && (
        <div className="comparison-label">Your Answer</div>
      )}

      <div className="canvas-container" ref={canvasContainerRef}>
      </div>

      {status === 'revealed' && (
        <div className="answer-section">
          <div className="comparison-label correct">Correct Answer</div>
          <div className="answer-container" ref={answerContainerRef}></div>
        </div>
      )}

      <div className="controls">
        {status === 'drawing' && (
          <>
            <button className="btn btn-secondary" onClick={handleClear}>
              <RotateCcw size={18} /> Clear
            </button>
            <button className="btn" onClick={handleCheck}>
              <Eye size={18} /> Check Answer
            </button>
          </>
        )}
        {status === 'revealed' && (
          <button className="btn" onClick={handleNext}>
            Next Word <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
