import React, { useState, useCallback, useMemo } from 'react';
import { FrameData, BoxType, InputBox } from '../types';
import TestFramePlayer from './TestFramePlayer';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface TestPlayerProps {
  frames: FrameData[];
  onExitTest: () => void;
}

interface UserAnswer {
  inputs: Record<string, string>; 
  hotspotsClicked: Record<string, boolean>; 
}

export const TestPlayer: React.FC<TestPlayerProps> = ({ frames, onExitTest }) => {
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>(
    () => frames.reduce((acc, frame) => {
      acc[frame.id] = { inputs: {}, hotspotsClicked: {} };
      return acc;
    }, {} as Record<string, UserAnswer>)
  );
  const [showResults, setShowResults] = useState(false);
  const [justClickedHotspotId, setJustClickedHotspotId] = useState<string | null>(null);
  const [frameMistakes, setFrameMistakes] = useState<Record<string, boolean>>({});

  const currentFrameData = frames[currentFrameIdx];
  const currentUserAnswerForFrame = userAnswers[currentFrameData.id];

  const navigate = useCallback((direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentFrameIdx < frames.length - 1) {
        setCurrentFrameIdx(currentFrameIdx + 1);
      } else {
        setShowResults(true);
      }
    } else if (direction === 'prev') {
      if (currentFrameIdx > 0) {
        setCurrentFrameIdx(currentFrameIdx - 1);
      }
    }
  }, [currentFrameIdx, frames.length]);

  const handleInputChange = useCallback((boxId: string, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentFrameData.id]: {
        ...prev[currentFrameData.id],
        inputs: { ...prev[currentFrameData.id].inputs, [boxId]: value },
      },
    }));
  }, [currentFrameData.id]);

  const handleHotspotInteraction = useCallback((boxId: string) => {
    if (showResults) return;
    setUserAnswers(prev => ({
      ...prev,
      [currentFrameData.id]: {
        ...prev[currentFrameData.id],
        hotspotsClicked: { ...prev[currentFrameData.id].hotspotsClicked, [boxId]: true },
      },
    }));
    setJustClickedHotspotId(boxId); 
    setTimeout(() => {
        navigate('next');
        setJustClickedHotspotId(null);
    }, 200);
  }, [currentFrameData.id, navigate, showResults]);

  const handleFrameClickMistake = useCallback(() => {
    if (showResults || !currentFrameData) return;
    if (currentFrameData.boxes.some(box => box.type === BoxType.HOTSPOT)) {
      setFrameMistakes(prev => ({ ...prev, [currentFrameData.id]: true }));
    }
  }, [currentFrameIdx, showResults, currentFrameData]);

  const { score, totalPossible, mistakeFramesCount } = useMemo(() => {
    if (!showResults) return { score: 0, totalPossible: 0, mistakeFramesCount: 0 };
    let s = 0;
    let t = 0;
    frames.forEach(frame => {
      const hasHotspotsOnFrame = frame.boxes.some(b => b.type === BoxType.HOTSPOT);
      let wasMistakeClickOnFrame = !!frameMistakes[frame.id];

      frame.boxes.forEach(box => {
        t++;
        const frameAnswers = userAnswers[frame.id];
        if (box.type === BoxType.INPUT) {
          const userAnswer = frameAnswers?.inputs[box.id] ?? '';
          if (userAnswer.trim().toLowerCase() === (box as InputBox).expected.trim().toLowerCase()) {
            s++;
          }
        } else if (box.type === BoxType.HOTSPOT) {
          if (!wasMistakeClickOnFrame && frameAnswers?.hotspotsClicked[box.id]) {
            s++;
          }
        }
      });
    });
    return { score: s, totalPossible: t, mistakeFramesCount: Object.keys(frameMistakes).length };
  }, [showResults, frames, userAnswers, frameMistakes]);

  if (!currentFrameData) {
    return (
      <div className="p-4 text-red-500 flex flex-col items-center justify-center h-full">
          Error: Test data is corrupted or unavailable.
          <button onClick={onExitTest} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded">
            Start Over
          </button>
      </div>
    );
  }
  
  const isLastFrame = currentFrameIdx === frames.length - 1;

  return (
    <div className="w-full h-full flex flex-col items-center p-2 md:p-4" role="application">
      <header className="w-full max-w-7xl mb-4">
        <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg shadow-lg">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-200">
              {showResults ? "Test Review" : "Test in Progress"}
            </h2>
            <p className="text-gray-400" aria-live="polite">Frame {currentFrameIdx + 1} of {frames.length}</p>
          </div>
          <button
            onClick={onExitTest}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            aria-label="Exit Test"
          >
            Exit Test
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl flex-grow">
        <TestFramePlayer
          key={currentFrameData.id}
          frame={currentFrameData}
          onInputChange={handleInputChange}
          onHotspotInteraction={handleHotspotInteraction}
          onFrameClickMistake={handleFrameClickMistake} 
          userInputsForFrame={currentUserAnswerForFrame?.inputs || {}}
          userHotspotsClickedForFrame={currentUserAnswerForFrame?.hotspotsClicked || {}}
          showResults={showResults}
          justClickedHotspotId={justClickedHotspotId}
        />
      </main>

      <footer className="w-full max-w-7xl mt-4 flex flex-col items-center space-y-4">
        {showResults && (
            <>
                <div role="status" aria-live="assertive" className="p-4 bg-gray-800 border border-purple-500 rounded-lg text-gray-200 w-full text-center shadow-lg">
                    <h3 className="text-xl font-bold text-purple-400">Test Complete!</h3>
                    <p className="text-lg mt-1">Your score: {score} / {totalPossible}</p>
                    {mistakeFramesCount > 0 && (
                      <p className="text-sm text-red-400">Mistake clicks detected on {mistakeFramesCount} frame{mistakeFramesCount === 1 ? '' : 's'}.</p>
                    )}
                    <p className="text-sm mt-2 text-gray-400">You can now review your answers using the navigation buttons below.</p>
                </div>
                <div className="flex justify-between items-center w-full p-3 bg-gray-800 rounded-lg shadow-lg">
                    <button
                        onClick={() => navigate('prev')}
                        disabled={currentFrameIdx === 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous Frame"
                    >
                        <ChevronLeftIcon /> Previous
                    </button>
                    <button
                        onClick={() => navigate('next')}
                        disabled={isLastFrame}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next Frame for Review"
                    >
                        Next (Review) <ChevronRightIcon />
                    </button>
                </div>
            </>
        )}
      </footer>
    </div>
  );
};
