import { WhiteboardFrontend } from './frontends/WhiteboardFrontend';

declare const window: any;

if (window.GravityDockUI && window.GravityDockUI.registerInteractiveFrontend) {
    window.GravityDockUI.registerInteractiveFrontend({
        typeIds: ['whiteboard:editor'],
        component: WhiteboardFrontend,
        packageId: 'com.gravitydock.whiteboard'
    });
}
