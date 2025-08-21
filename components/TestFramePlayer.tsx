import React, { useState, useEffect } from 'react';
import { FrameData, BoxType, InputBox } from '../types';

interface TestFramePlayerProps {
  frame: FrameData;
  onInputChange: (boxId: string, value: string) => void;
  onHotspotInteraction: (boxId: string) => void;
  onFrameClickMistake: () => void;
  userInputsForFrame: Record<string, string>; 
  userHotspotsClickedForFrame: Record<string, boolean>; 
  showResults: boolean; 
  justClickedHotspotId?: string | null; 
}

const TestFramePlayer: React.FC<TestFramePlayerProps> = ({
  frame,
  onInputChange,
  onHotspotInteraction,
  onFrameClickMistake,
  userInputsForFrame,
  userHotspotsClickedForFrame,
  showResults,
  justClickedHotspotId,
}) => {
  const [showMistakeFlash, setShowMistakeFlash] = useState(false);

  useEffect(() => {
    setShowMistakeFlash(false);
  }, [frame.id]);

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (showResults) return;
    const target = event.target as HTMLElement;
    // Check if click was on the background, not on an interactive element
    if (target.dataset.interactiveType !== 'hotspot' && target.closest('[data-interactive-type="input-area"]') === null) {
      onFrameClickMistake();
      setShowMistakeFlash(true);
      setTimeout(() => setShowMistakeFlash(false), 700);
    }
  };

  return (
    <div
      className={`relative w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg ${showMistakeFlash ? 'mistake-flash-animation' : ''}`}
      style={{ aspectRatio: `${frame.originalWidth} / ${frame.originalHeight}` }}
      onClick={handleContainerClick} 
      role="group" 
      aria-label={`Test frame content area for frame ID: ${frame.id.substring(0,8)}`}
    >
      <img
        src={frame.imageDataUrl}
        alt={`Test Frame ${frame.id.substring(0, 8)}`}
        className="block w-full h-auto pointer-events-none"
        draggable="false"
      />
      {frame.boxes.map((box) => {
        const boxStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${(box.x / frame.originalWidth) * 100}%`,
          top: `${(box.y / frame.originalHeight) * 100}%`,
          width: `${(box.w / frame.originalWidth) * 100}%`,
          height: `${(box.h / frame.originalHeight) * 100}%`,
        };
        
        if (box.type === BoxType.HOTSPOT) {
          let hotspotClasses = 'transition-all duration-150 flex items-center justify-center';
          let icon = null;

          if (showResults) {
            hotspotClasses += ' cursor-default'; 
            if (userHotspotsClickedForFrame[box.id]) { 
              hotspotClasses += ' bg-green-500/40 border-2 border-green-400 rounded-md';
              icon = <span className="text-white text-2xl font-bold select-none" aria-label="Correctly clicked">✓</span>;
            } else { 
              hotspotClasses += ' bg-red-500/40 border-2 border-red-400 rounded-md';
              icon = <span className="text-white text-2xl font-bold select-none" aria-label="Missed hotspot">✗</span>;
            }
          } else {
            hotspotClasses += ` cursor-default bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 rounded-md`;
            if (justClickedHotspotId === box.id) {
              hotspotClasses += ' outline outline-4 outline-green-400 bg-green-500/50'; 
            }
          }

          return (
            <div
              key={box.id}
              style={boxStyle}
              className={hotspotClasses}
              onClick={(e) => { e.stopPropagation(); if (!showResults) onHotspotInteraction(box.id); }}
              onKeyDown={(e) => { if (!showResults && (e.key === 'Enter' || e.key === ' ')) { e.stopPropagation(); onHotspotInteraction(box.id); }}}
              title={box.label}
              role="button"
              tabIndex={showResults ? -1 : 0} 
              aria-label={`Hotspot: ${box.label}`}
              data-interactive-type="hotspot" 
            >
              {icon}
            </div>
          );
        }

        if (box.type === BoxType.INPUT) {
          const userAnswer = userInputsForFrame[box.id] ?? '';
          const expectedAnswer = (box as InputBox).expected;
          let ringClass = 'ring-purple-500';

          if (showResults) {
            const isCorrect = userAnswer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
            ringClass = isCorrect ? 'ring-green-500' : 'ring-red-500';
          }

          return (
            <div
              key={box.id}
              style={boxStyle}
              className={`absolute flex p-0.5 rounded-md ring-2 ring-offset-2 ring-offset-gray-800/80 transition-shadow ${ringClass}`}
              onClick={(e) => e.stopPropagation()} 
              data-interactive-type="input-area"
            >
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => !showResults && onInputChange(box.id, e.target.value)}
                readOnly={showResults}
                placeholder={!showResults ? box.label : ''} 
                title={box.label}
                aria-label={`Input for ${box.label}.`}
                className="w-full h-full p-2 text-base bg-white/90 focus:bg-white text-black placeholder-gray-500 outline-none border-none rounded-sm"
              />
               {showResults && (
                 <div className="absolute -bottom-7 left-0 text-xs px-1.5 py-0.5 rounded-sm shadow-md whitespace-nowrap bg-gray-900 text-white z-10">
                    Your answer: <span className="font-semibold">{userAnswer || '""'}</span>
                    {userAnswer.trim().toLowerCase() !== expectedAnswer.trim().toLowerCase() && (
                      <> | Expected: <span className="font-semibold">{expectedAnswer}</span></>
                    )}
                 </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default TestFramePlayer;