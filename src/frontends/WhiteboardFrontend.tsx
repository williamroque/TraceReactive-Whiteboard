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
                    
                    // addFiles wants an array of file objects
                    if (syncedData.files) {
                        const filesArray = Object.values(syncedData.files);
                        if (filesArray.length > 0) {
                            excalidrawAPI.addFiles(filesArray);
                        }
                    }
                    
                    excalidrawAPI.updateScene({
                        elements: syncedData.elements,
                        commitToHistory: false
                    });

                    // Force save back to the host since updateScene might not trigger onChange immediately
                    const dataToSave = {
                        elements: syncedData.elements.filter((el: any) => !el.isDeleted),
                        appState: currentAppState,
                        files: syncedData.files
                    };
                    api.setOutput(nodeId, { Board: dataToSave });
                    if (api.setProperty) {
                        api.setProperty(nodeId, 'excalidraw_data', dataToSave);
                    }
                }
            }
        });

        return () => {
            if (unsubData) unsubData();
        };
    }, [nodeId, loaded, excalidrawAPI]);

    const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
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
