import { InteractiveNode } from '@tracereactive/types';

export class WhiteboardNode extends InteractiveNode {
    readonly typeId = 'whiteboard:editor';
    readonly displayName = 'Whiteboard';
    readonly nodeInterface = 'interactive';
    readonly category = { name: 'Tools', accent: 'purple-500' } as any;
    readonly visible = true;
    
    readonly inputs = [];
    
    readonly outputs = [
        { name: 'Board', outputType: 'whiteboard:data' }
    ];
    
    readonly properties = [
        { name: 'excalidraw_data', type: 'object', defaultValue: null, hidden: true }
    ];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>) {
        if (properties.excalidraw_data) {
            return { Board: properties.excalidraw_data };
        }
        return {};
    }
}
