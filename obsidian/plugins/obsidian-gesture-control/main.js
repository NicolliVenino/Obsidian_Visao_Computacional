"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
class GestureControlPlugin extends obsidian_1.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.connectWebSocket();
        });
    }
    connectWebSocket() {
        this.ws = new WebSocket('ws://localhost:8765');
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleGesture(data);
        };
        this.ws.onclose = () => {
            // Reconectar após 3 segundos
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }
    handleGesture(data) {
        // Pega a leaf do Graph View ativa
        const graphLeaf = this.app.workspace.getLeavesOfType('graph')[0];
        if (!graphLeaf)
            return;
        // @ts-ignore — acessa o renderer interno
        const renderer = graphLeaf.view.renderer;
        if (!renderer)
            return;
        switch (data.gesture) {
            case 'pan':
                renderer.targetX += (data.x - 0.5) * 20;
                renderer.targetY += (data.y - 0.5) * 20;
                break;
            case 'zoom_in':
                renderer.targetZoom = Math.min(renderer.targetZoom * 1.05, 5);
                break;
            case 'select':
                // Encontra nó mais próximo do ponto da mão
                const node = this.findNearestNode(renderer, data.x, data.y);
                if (node)
                    this.app.workspace.openLinkText(node.id, '');
                break;
        }
        renderer.invalidate();
    }
    findNearestNode(renderer, normX, normY) {
        // Converte coordenada normalizada para espaço do grafo
        const x = (normX - 0.5) * renderer.width / renderer.scale + renderer.panX;
        const y = (normY - 0.5) * renderer.height / renderer.scale + renderer.panY;
        let closest = null;
        let minDist = Infinity;
        for (const node of renderer.nodes) {
            const dist = Math.hypot(node.x - x, node.y - y);
            if (dist < minDist && dist < 80) {
                minDist = dist;
                closest = node;
            }
        }
        return closest;
    }
    onunload() {
        var _a;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
    }
}
exports.default = GestureControlPlugin;
