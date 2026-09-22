import { RenderNode } from '@tracereactive/types';
import { exportToSvg } from '@excalidraw/excalidraw';

export class RenderWhiteboardNode extends RenderNode {
    readonly typeId = 'whiteboard:render';
    readonly displayName = 'Render Whiteboard';
    readonly category = { name: 'Whiteboard', accent: 'purple-500' } as any;
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Board', acceptsType: 'whiteboard:data' }
    ];
    
    readonly outputs = [
        { name: 'Render', outputType: 'render' }
    ];
    
    readonly properties = [];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>) {
        const data = inputs.Board;
        if (!data || !data.elements) {
            return { Render: { type: 'core:svg', content: '' } };
        }

        try {
            const svgElement = await exportToSvg({
                elements: data.elements,
                appState: data.appState,
                files: data.files,
            });
            const svgString = new XMLSerializer().serializeToString(svgElement);
            return { 
                Render: { type: 'core:svg', content: svgString },
                type: 'core:svg',
                content: svgString
            };
        } catch (error) {
            console.error('Error exporting whiteboard to SVG:', error);
            return { 
                Render: { type: 'core:svg', content: '' },
                type: 'core:svg',
                content: ''
            };
        }
    }
}
