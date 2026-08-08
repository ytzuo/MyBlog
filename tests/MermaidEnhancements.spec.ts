import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    addMermaidZoomControls,
    createMermaidZoomModal,
} from "virtual:mermaid-enhancements-test";

const getRequiredElement = <ElementType extends Element>(
    selector: string,
): ElementType => {
    const element = document.querySelector<ElementType>(selector);
    if (!element) throw new Error(`Missing test element: ${selector}`);
    return element;
};

const mountDiagram = () => {
    document.body.innerHTML = `
        <main id="page-content">
            <button id="outside-action" type="button">Outside action</button>
            <div class="mermaid-container">
                <div class="mermaid-chart">
                    <svg viewBox="0 0 640 360" aria-label="Request flow"></svg>
                </div>
            </div>
        </main>
    `;

    const sourceSvg = getRequiredElement<SVGSVGElement>(
        ".mermaid-chart svg",
    );
    Object.defineProperty(sourceSvg, "viewBox", {
        configurable: true,
        value: {
            baseVal: { width: 640, height: 360 },
        },
    });

    addMermaidZoomControls();

    return {
        background: getRequiredElement<HTMLElement>("#page-content"),
        outsideButton:
            getRequiredElement<HTMLButtonElement>("#outside-action"),
        trigger: getRequiredElement<HTMLButtonElement>(
            ".mermaid-zoom-btn",
        ),
    };
};

const openDialog = () => {
    const elements = mountDiagram();
    elements.trigger.click();

    return {
        ...elements,
        dialog: getRequiredElement<HTMLElement>("#mermaid-zoom-dialog"),
        closeButton: getRequiredElement<HTMLButtonElement>(
            '[data-action="close"]',
        ),
    };
};

beforeEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
});

afterEach(() => {
    document.dispatchEvent(new Event("astro:before-swap"));
    document.body.innerHTML = "";
});

describe("Mermaid zoom dialog", () => {
    it("creates a labelled modal dialog", () => {
        const dialog = createMermaidZoomModal();

        expect(dialog.id).toBe("mermaid-zoom-dialog");
        expect(dialog.getAttribute("role")).toBe("dialog");
        expect(dialog.getAttribute("aria-modal")).toBe("true");
        expect(dialog.getAttribute("aria-labelledby")).toBe(
            "mermaid-zoom-title",
        );
        expect(dialog.getAttribute("aria-hidden")).toBe("true");
        expect(
            getRequiredElement("#mermaid-zoom-title").textContent,
        ).toBe("Enlarged Mermaid diagram");
    });

    it("links the trigger and focuses close when opened", () => {
        const { background, trigger, dialog, closeButton } = openDialog();

        expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
        expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
        expect(trigger.getAttribute("aria-expanded")).toBe("true");
        expect(dialog.dataset.open).toBe("true");
        expect(dialog.getAttribute("aria-hidden")).toBe("false");
        expect(document.activeElement).toBe(closeButton);
        expect(background.inert).toBe(true);
        expect(background.getAttribute("aria-hidden")).toBe("true");
        expect(document.body.style.overflow).toBe("hidden");
    });

    it("keeps keyboard focus inside the dialog", () => {
        const { outsideButton, closeButton } = openDialog();
        const firstAction = getRequiredElement<HTMLButtonElement>(
            '[data-action="zoom-out"]',
        );

        closeButton.focus();
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Tab",
                bubbles: true,
                cancelable: true,
            }),
        );
        expect(document.activeElement).toBe(firstAction);

        firstAction.focus();
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Tab",
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            }),
        );
        expect(document.activeElement).toBe(closeButton);

        outsideButton.focus();
        expect(document.activeElement).toBe(closeButton);
    });

    it("closes with Escape and restores the page and trigger", () => {
        const { background, trigger } = mountDiagram();
        background.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "clip";
        trigger.click();
        const dialog = getRequiredElement<HTMLElement>(
            "#mermaid-zoom-dialog",
        );

        const escapeEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(escapeEvent);

        expect(escapeEvent.defaultPrevented).toBe(true);
        expect(dialog.dataset.open).toBe("false");
        expect(dialog.getAttribute("aria-hidden")).toBe("true");
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
        expect(background.inert).toBe(false);
        expect(background.getAttribute("aria-hidden")).toBe("false");
        expect(document.body.style.overflow).toBe("clip");
        expect(document.activeElement).toBe(trigger);
    });
});
