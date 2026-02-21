// starwind.elements.util.js
export function defineElement(tagName, elementClass) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass);
  }
}

function isSafeToken(value) {
  return /^[a-z]+(?:-[a-z]+)*$/.test(value);
}

export function normalizeSpaceLike(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";

  // token => var(--sw-space-<token>) (supports pairs like "s-m", inverse "m-s")
  if (isSafeToken(v)) {
    return `var(--sw-space-${v})`;
  }

  return v;
}

export function normalizeRatio(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";

  // Make "16/9" usable as "16 / 9"
  if (v.includes("/")) {
    return v.replace(/\s*\/\s*/g, " / ");
  }

  return v;
}

export function applyVar(el, cssVarName, value) {
  if (value === "") {
    el.style.removeProperty(cssVarName);
    return;
  }

  el.style.setProperty(cssVarName, value);
}

export function applyProp(el, propName, value) {
  if (value === "") {
    el.style.removeProperty(propName);
    return;
  }

  el.style.setProperty(propName, value);
}

export function createStarwindElement(varMap) {
  return class StarwindElement extends HTMLElement {
    static get observedAttributes() {
      return Object.keys(varMap);
    }

    connectedCallback() {
      this.#applyAll();
    }

    attributeChangedCallback() {
      this.#applyAll();
    }

    #applyAll() {
      for (const [attr, spec] of Object.entries(varMap)) {
        const raw = this.getAttribute(attr);
        const value = raw == null ? "" : String(raw);

        if (spec.type === "space") {
          const normalized = normalizeSpaceLike(value);
          if (spec.var) applyVar(this, spec.var, normalized);
          if (spec.prop) applyProp(this, spec.prop, normalized);
          continue;
        }

        if (spec.type === "ratio") {
          const normalized = normalizeRatio(value);
          if (spec.var) applyVar(this, spec.var, normalized);
          if (spec.prop) applyProp(this, spec.prop, normalized);
          continue;
        }

        if (spec.type === "number") {
          const n = String(value).trim();
          const ok = /^-?\d+(\.\d+)?$/.test(n);
          const normalized = ok ? n : "";
          if (spec.var) applyVar(this, spec.var, normalized);
          if (spec.prop) applyProp(this, spec.prop, normalized);
          continue;
        }

        // raw
        const normalized = String(value).trim();
        if (spec.var) applyVar(this, spec.var, normalized);
        if (spec.prop) applyProp(this, spec.prop, normalized);
      }
    }
  };
}
