import { BaseNode } from '@tracereactive/types';

export class ExtractWhiteboardTextNode extends BaseNode {
    readonly typeId = 'whiteboard:extractText';
    readonly displayName = 'Extract Whiteboard Text';
    readonly category = { name: 'Tools', accent: 'purple-500' } as any;
    readonly visible = true;
    
    readonly inputs = [
        { name: 'Board', inputType: 'whiteboard:data' }
    ];
    
    readonly outputs = [
        { name: 'Text', outputType: 'core:data' }
    ];
    
    readonly properties = [];

    async evaluate(inputs: Record<string, any>, properties: Record<string, any>) {
        const data = inputs.Board;
        if (!data || !Array.isArray(data.elements)) {
            return { Text: [] };
        }

        const textElements = data.elements.filter((el: any) => el.type === 'text');
        const textStrings = textElements.map((el: any) => el.text);

        return { Text: textStrings };
    }
}
