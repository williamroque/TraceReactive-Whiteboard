import { WhiteboardFrontend } from './frontends/WhiteboardFrontend';

declare const window: any;

if (window.TraceReactiveUI && window.TraceReactiveUI.registerInteractiveFrontend) {
    window.TraceReactiveUI.registerInteractiveFrontend({
        typeIds: ['whiteboard:editor'],
        component: WhiteboardFrontend,
        packageId: 'com.tracereactive.whiteboard'
    });
}
