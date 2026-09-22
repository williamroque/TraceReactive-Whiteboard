import { BaseNode } from '@tracereactive/types';
import { exportToSvg } from '@excalidraw/excalidraw';

export class RenderWhiteboardNode extends BaseNode {
    readonly typeId = 'whiteboard:render';
    readonly displayName = 'Render Whiteboard';
    readonly category = { name: 'Tools', accent: 'purple-500' } as any;
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Board', inputType: 'whiteboard:data' }
    ];
    
    readonly outputs = [
        { name: 'SVG', outputType: 'core:svg' }
    ];
    
    readonly properties = [];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>) {
        const data = inputs.Board;
        if (!data || !data.elements) {
            return { SVG: '' };
        }

        const svg = await exportToSvg({
            elements: data.elements,
            appState: data.appState,
            files: data.files,
        });

        return { SVG: svg.outerHTML };
    }
}
