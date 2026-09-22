import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

export const WhiteboardFrontend: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const [initialData, setInitialData] = useState<any>(null);
    const [loaded, setLoaded] = useState(false);
    
    // We only want to set initial data once. After that Excalidraw manages its own state
    useEffect(() => {
        const api = (window as any).api?.interactive;
        if (!api) return;

        api.requestData(nodeId);

        const unsubData = api.onData((incomingData: any) => {
            if (loaded) return; // Ignore subsequent updates to prevent resetting the board
            
            const rawData = incomingData.properties?.excalidraw_data;
            
            // Set up initial data, enforcing clean aesthetic defaults if not present
            const newData = {
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
            
            setInitialData(newData);
            setLoaded(true);
        });

        return () => {
            if (unsubData) unsubData();
        };
    }, [nodeId, loaded]);

    const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
        const api = (window as any).api?.interactive;
        if (!api) return;

        const data = {
            elements: elements.filter(el => !el.isDeleted),
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
            />
        </div>
    );
};
