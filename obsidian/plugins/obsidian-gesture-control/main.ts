import { Plugin, WorkspaceLeaf } from 'obsidian';

export default class GestureControlPlugin extends Plugin {
  ws: WebSocket;

  async onload() {
    this.connectWebSocket();
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

  handleGesture(data: { gesture: string, x: number, y: number }) {
    // Pega a leaf do Graph View ativa
    const graphLeaf = this.app.workspace.getLeavesOfType('graph')[0];
    if (!graphLeaf) return;

    // @ts-ignore — acessa o renderer interno
    const renderer = (graphLeaf.view as any).renderer;
    if (!renderer) return;

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
        if (node) this.app.workspace.openLinkText(node.id, '');
        break;
    }
    renderer.invalidate();
  }

  findNearestNode(renderer: any, normX: number, normY: number) {
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
    this.ws?.close();
  }
}