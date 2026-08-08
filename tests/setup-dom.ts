if (
    typeof HTMLElement !== "undefined" &&
    !("inert" in HTMLElement.prototype)
) {
    Object.defineProperty(HTMLElement.prototype, "inert", {
        configurable: true,
        get() {
            return this.hasAttribute("inert");
        },
        set(value: boolean) {
            this.toggleAttribute("inert", value);
        },
    });
}
