import { InteractiveNode } from '@tracereactive/types';
import { syncBoardWithSvgInputs } from '../utils/svgSync';

export class WhiteboardNode extends InteractiveNode {
    readonly typeId = 'whiteboard:editor';
    readonly displayName = 'Whiteboard';
    readonly nodeInterface = 'interactive';
    readonly category = { name: 'Whiteboard', accent: 'purple-500' } as any;
    readonly visible = true;
    
    readonly inputs = [];
    
    readonly dynamicInputs = { baseName: 'SVG', acceptsType: 'render' };
    
    readonly outputs = [
        { name: 'Board', outputType: 'whiteboard:data' }
    ];
    
    readonly properties = [
        { name: 'excalidraw_data', type: 'object', defaultValue: null, hidden: true }
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>) {
        let boardData = properties.excalidraw_data || { elements: [], appState: {}, files: {} };
        
        // Sync with dynamic SVG inputs before returning
        boardData = syncBoardWithSvgInputs(boardData, inputs);

        return { Board: boardData };
    }
}
