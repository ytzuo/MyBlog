declare module "virtual:mermaid-enhancements-test" {
    export function createMermaidZoomModal(): HTMLElement;
    export function openMermaidZoom(
        chart: HTMLElement,
        trigger: HTMLButtonElement,
    ): void;
    export function addMermaidZoomControls(): void;
}
