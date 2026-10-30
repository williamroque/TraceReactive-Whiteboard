import { WhiteboardNode } from './nodes/WhiteboardNode';
import { RenderWhiteboardNode } from './nodes/RenderWhiteboardNode';
import { ExtractWhiteboardTextNode } from './nodes/ExtractWhiteboardTextNode';
import type { GravityDockAPI } from '@gravitydock/types';

declare const gravityDock: GravityDockAPI;

const nodes = [
    new WhiteboardNode(),
    new RenderWhiteboardNode(),
    new ExtractWhiteboardTextNode()
];

const serializableNodes = nodes.map(n => ({
    typeId: n.typeId,
    displayName: n.displayName,
    category: n.category,
    nodeInterface: n.nodeInterface,
    visible: n.visible,
    inputs: n.inputs,
    outputs: n.outputs,
    properties: n.properties,
    dynamicInputs: n.dynamicInputs,
    dynamicOutputs: n.dynamicOutputs
}));

gravityDock.registerNodes(serializableNodes);

gravityDock.onEvaluateNode(async ({ typeId, inputs, properties }: any) => {
    const node = nodes.find(n => n.typeId === typeId);
    if (!node) {
        throw new Error(`Unknown node type: ${typeId}`);
    }

    const result = await node.evaluate(inputs, properties);
    return result;
});
