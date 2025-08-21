import React, { useState, useCallback, useEffect } from 'react';
import { Frame as RawFrame, FrameData, FrameBox, BoxType } from './types';
import { TestPlayer } from './components/TestPlayer';

type GameState = 'loading' | 'playing' | 'error';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('loading');
    const [frames, setFrames] = useState<FrameData[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleReset = useCallback(() => {
        window.location.reload();
    }, []);

    useEffect(() => {
        const loadTestData = async () => {
            setError(null);
            try {
                const response = await fetch('/test-data/data.json');
                 if (!response.ok) {
                    throw new Error(`Could not fetch test data. Ensure data.json is in the /public/test-data/ folder. (HTTP ${response.status})`);
                }
                const parsedFrames: RawFrame[] = await response.json();
                
                if (!Array.isArray(parsedFrames) || parsedFrames.length === 0) {
                    throw new Error('JSON file is empty or has an invalid format.');
                }
                
                const processedFrames: FrameData[] = await Promise.all(
                  parsedFrames.map(async (frame) => {
                        const url = `/test-data/${frame.image}`;

                        const { width, height } = await new Promise<{width: number, height: number}>((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
                            img.onerror = () => reject(new Error(`Could not load image: ${frame.image}. Make sure it is in the /public/test-data/ folder.`));
                            img.src = url;
                        });

                        const boxes: FrameBox[] = [];
                        frame.hotspots.forEach(h => {
                            boxes.push({ ...h, id: crypto.randomUUID(), type: BoxType.HOTSPOT });
                        });
                        frame.inputs.forEach(i => {
                            boxes.push({ ...i, id: crypto.randomUUID(), type: BoxType.INPUT });
                        });

                        return {
                            id: crypto.randomUUID(),
                            imageFileName: frame.image,
                            imageDataUrl: url,
                            originalWidth: width,
                            originalHeight: height,
                            boxes,
                        };
                    })
                );

                setFrames(processedFrames);
                setGameState('playing');
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during file processing.';
                setError(errorMessage);
                setGameState('error');
                console.error(err);
            }
        };

        loadTestData();
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900">
            <main className="w-full max-w-7xl flex-grow flex items-center justify-center">
                {gameState === 'loading' && <div className="text-xl">Loading your test...</div>}
                {(gameState === 'error') && (
                    <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
                        <h2 className="text-2xl text-red-400 mb-4">An Error Occurred</h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button
                            onClick={handleReset}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors">
                            Try Again
                        </button>
                    </div>
                )}
                {gameState === 'playing' && frames.length > 0 && (
                    <TestPlayer
                        frames={frames}
                        onExitTest={handleReset}
                    />
                )}
            </main>
        </div>
    );
};

export default App;