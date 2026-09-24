import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { syncBoardWithSvgInputs } from '../utils/svgSync';

export const WhiteboardFrontend: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const [initialData, setInitialData] = useState<any>(null);
    const [loaded, setLoaded] = useState(false);
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const lastInputsRef = useRef<any>({});
    const debounceTimerRef = useRef<any>(null);
    const lastPushedVersionsRef = useRef<Record<string, number>>({});
    
    useEffect(() => {
        const api = (window as any).api?.interactive;
        if (!api) return;

        api.requestData(nodeId);

        const unsubData = api.onData((incomingData: any) => {
            const rawData = incomingData.properties?.excalidraw_data;
            const inputs = incomingData.inputs || {};

            if (!loaded) {
                // Set up initial data
                const baseData = {
                    elements: rawData?.elements || [],
                    appState: {
                        ...(rawData?.appState || {}),
                        currentItemRoughness: 0,
                        currentItemFontFamily: 2,
                        gridSize: 20,
                        gridModeEnabled: true
                    },
                    files: rawData?.files || null
                };
                
                const syncedData = syncBoardWithSvgInputs(baseData, inputs);
                setInitialData(syncedData);
                lastInputsRef.current = inputs;
                setLoaded(true);
            } else if (excalidrawAPI) {
                // Check if inputs have changed to avoid unnecessary updates
                const inputsChanged = JSON.stringify(lastInputsRef.current) !== JSON.stringify(inputs);
                if (inputsChanged) {
                    lastInputsRef.current = inputs;
                    
                    const currentElements = excalidrawAPI.getSceneElementsIncludingDeleted();
                    const currentFiles = excalidrawAPI.getFiles();
                    const currentAppState = excalidrawAPI.getAppState();
                    
                    const baseData = {
                        elements: currentElements,
                        files: currentFiles,
                        appState: currentAppState
                    };
                    
                    const syncedData = syncBoardWithSvgInputs(baseData, inputs);
                    
                    // Only push updates to Excalidraw if syncBoardWithSvgInputs actually modified something!
                    let elementsChanged = false;
                    if (syncedData.elements.length !== currentElements.length) {
                        elementsChanged = true;
                    } else {
                        for (let i = 0; i < syncedData.elements.length; i++) {
                            if (syncedData.elements[i].version !== currentElements[i]?.version) {
                                elementsChanged = true;
                                break;
                            }
                        }
                    }
                    
                    if (elementsChanged) {
                        // addFiles wants an array of file objects
                        if (syncedData.files) {
                            const filesArray = Object.values(syncedData.files);
                            if (filesArray.length > 0) {
                                excalidrawAPI.addFiles(filesArray);
                            }
                        }
                        
                        const versions: Record<string, number> = {};
                        syncedData.elements.forEach((el: any) => {
                            versions[el.id] = el.version;
                        });
                        lastPushedVersionsRef.current = versions;
                        
                        excalidrawAPI.updateScene({
                            elements: syncedData.elements,
                            commitToHistory: false
                        });
                    }
                }
            }
        });

        return () => {
            if (unsubData) unsubData();
        };
    }, [nodeId, loaded, excalidrawAPI]);

    const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
        // Did the user modify anything, or is this just Excalidraw firing onChange after our programmatic updateScene?
        const userChangedElements = elements.some(el => {
            return el.version !== lastPushedVersionsRef.current[el.id];
        });
        
        // Also check if they added/deleted elements
        const countChanged = elements.length !== Object.keys(lastPushedVersionsRef.current).length;

        if (!userChangedElements && !countChanged) {
            return; // No user interaction!
        }

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            const api = (window as any).api?.interactive;
            if (!api) return;

            const data = {
                elements: elements.filter((el: any) => !el.isDeleted),
                appState: {
                    viewBackgroundColor: appState.viewBackgroundColor,
                    currentItemRoughness: appState.currentItemRoughness,
                    currentItemFontFamily: appState.currentItemFontFamily
                },
                files
            };

            api.setOutput(nodeId, { Board: data });
            if (api.setProperty) {
                api.setProperty(nodeId, 'excalidraw_data', data);
            }
        }, 300);
    }, [nodeId]);

    if (!loaded) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--secondary-text-color)' }}>
                Loading whiteboard...
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Excalidraw
                initialData={initialData}
                onChange={handleChange}
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
            />
        </div>
    );
};
