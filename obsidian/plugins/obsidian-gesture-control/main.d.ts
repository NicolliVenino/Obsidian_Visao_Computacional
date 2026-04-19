import { Plugin } from 'obsidian';
export default class GestureControlPlugin extends Plugin {
    ws: WebSocket;
    onload(): Promise<void>;
    connectWebSocket(): void;
    handleGesture(data: {
        gesture: string;
        x: number;
        y: number;
    }): void;
    findNearestNode(renderer: any, normX: number, normY: number): any;
    onunload(): void;
}
//# sourceMappingURL=main.d.ts.map