export function extractSvgContent(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'string') {
        const svgStart = val.indexOf('<svg');
        const svgEnd = val.lastIndexOf('</svg>');
        if (svgStart >= 0 && svgEnd > svgStart) {
            return val.substring(svgStart, svgEnd + 6);
        }
        return null;
    }
    if (typeof val === 'object') {
        if (val.type === 'core:svg' && typeof val.content === 'string') {
            return extractSvgContent(val.content);
        }
        if (typeof val.content === 'string') {
            return extractSvgContent(val.content);
        }
        if (typeof val.svg === 'string') {
            return extractSvgContent(val.svg);
        }
        if (val.Render) {
            return extractSvgContent(val.Render);
        }
    }
    return null;
}

export function hashString(str: string): string {
    // Strip non-deterministic IDs (e.g. from MathJax) before hashing to prevent flickering
    // If the visual paths haven't changed, the hash should remain identical
    let stableStr = str.replace(/id="[^"]+"/g, 'id=""').replace(/url\(#[^\)]+\)/g, 'url()');
    
    let hash = 0;
    for (let i = 0; i < stableStr.length; i++) {
        const char = stableStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return String(Math.abs(hash));
}

export function svgToDataUrl(svgString: string): string {
    let processedSvg = svgString.trim();
    // Add xmlns if missing, otherwise it won't render as an image in browser
    if (!processedSvg.includes('xmlns=')) {
        processedSvg = processedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // Excalidraw's internal schema validators often strictly require the dataURL to contain base64.
    // We encode the SVG using a safe UTF-8 to Base64 conversion to avoid unicode corruption.
    const base64 = btoa(
        encodeURIComponent(processedSvg).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        })
    );
    
    return 'data:image/svg+xml;base64,' + base64;
}

export function getSvgDimensions(svgString: string): { width: number; height: number } {
    const defaultDims = { width: 400, height: 300 };
    try {
        if (typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgEl = doc.querySelector('svg');
            if (!svgEl) return defaultDims;

            const widthAttr = svgEl.getAttribute('width');
            const heightAttr = svgEl.getAttribute('height');
            const viewBoxAttr = svgEl.getAttribute('viewBox');

            let w = widthAttr ? parseFloat(widthAttr) : NaN;
            let h = heightAttr ? parseFloat(heightAttr) : NaN;

            if ((isNaN(w) || isNaN(h) || w <= 0 || h <= 0) && viewBoxAttr) {
                const parts = viewBoxAttr.trim().split(/[\s,]+/).map(parseFloat);
                if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                    w = parts[2];
                    h = parts[3];
                }
            }

            if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                const maxDim = 600;
                if (w > maxDim || h > maxDim) {
                    const scale = Math.min(maxDim / w, maxDim / h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }
                return { width: Math.round(w), height: Math.round(h) };
            }
        }
    } catch {
        return defaultDims;
    }
    return defaultDims;
}

export function idForInput(inputKey: string): string {
    return 'svg_input_' + inputKey.replace(/\s+/g, '_');
}

export function createImageElement({
    id,
    fileId,
    x,
    y,
    width,
    height,
    customData
}: {
    id: string;
    fileId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    customData?: Record<string, any>;
}) {
    return {
        id,
        type: 'image' as const,
        x,
        y,
        width,
        height,
        angle: 0,
        strokeColor: 'transparent',
        backgroundColor: 'transparent',
        fillStyle: 'solid' as const,
        strokeWidth: 1,
        strokeStyle: 'solid' as const,
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.floor(Math.random() * 2000000000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 2000000000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        status: 'pending' as const,
        fileId,
        scale: [1, 1] as [number, number],
        crop: null,
        customData
    };
}

export function syncBoardWithSvgInputs(boardData: any, inputs: Record<string, any>): any {
    const rawElements = boardData?.elements || [];
    const rawFiles = boardData?.files || {};
    const appState = boardData?.appState || {};

    const currentSvgMap = new Map<string, string>();
    for (const [key, val] of Object.entries(inputs || {})) {
        if (key.startsWith('SVG')) {
            const svg = extractSvgContent(val);
            if (svg) {
                currentSvgMap.set(key, svg);
            }
        }
    }

    if (currentSvgMap.size === 0 && !rawElements.some((el: any) => el.customData?.svgInputKey || el.id?.startsWith('svg_input_'))) {
        return boardData;
    }

    const nextFiles = { ...rawFiles };
    let nextElements = [...rawElements];

    nextElements = nextElements.map((el: any) => {
        const key = el.customData?.svgInputKey || (el.id?.startsWith('svg_input_') ? el.id.replace('svg_input_', '').replace('_', ' ') : null);
        if (key && !currentSvgMap.has(key)) {
            if (!el.isDeleted) {
                return { ...el, isDeleted: true, version: (el.version || 1) + 1, updated: Date.now() };
            }
        }
        return el;
    });

    let index = 0;
    for (const [key, svgContent] of currentSvgMap.entries()) {
        const hash = hashString(svgContent);
        const fileId = 'svg_' + hash;
        nextFiles[fileId] = {
            id: fileId,
            mimeType: 'image/svg+xml',
            dataURL: svgToDataUrl(svgContent),
            created: Date.now()
        };

        const targetId = idForInput(key);
        const existingIdx = nextElements.findIndex((el: any) => el.customData?.svgInputKey === key || el.id === targetId);

        if (existingIdx >= 0) {
            const existing = nextElements[existingIdx];
            if (existing.fileId !== fileId || existing.isDeleted) {
                nextElements[existingIdx] = {
                    ...existing,
                    fileId,
                    status: 'pending' as const,
                    isDeleted: false,
                    updated: Date.now(),
                    version: (existing.version || 1) + 1,
                    customData: {
                        ...existing.customData,
                        svgInputKey: key
                    }
                };
            }
        } else {
            const dims = getSvgDimensions(svgContent);
            const newEl = createImageElement({
                id: targetId,
                fileId,
                x: 100 + index * 100,
                y: 100 + index * 100,
                width: dims.width,
                height: dims.height,
                customData: { svgInputKey: key }
            });
            nextElements.push(newEl);
        }
        index++;
    }

    return {
        ...boardData,
        elements: nextElements,
        files: nextFiles,
        appState
    };
}
