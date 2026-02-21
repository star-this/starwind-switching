var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/starwind.elements.util.js
function defineElement(tagName, elementClass) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass);
  }
}
function isSafeToken(value) {
  return /^[a-z]+(?:-[a-z]+)*$/.test(value);
}
function normalizeSpaceLike(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  if (isSafeToken(v)) {
    return `var(--sw-space-${v})`;
  }
  return v;
}
function normalizeRatio(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  if (v.includes("/")) {
    return v.replace(/\s*\/\s*/g, " / ");
  }
  return v;
}
function applyVar(el, cssVarName, value) {
  if (value === "") {
    el.style.removeProperty(cssVarName);
    return;
  }
  el.style.setProperty(cssVarName, value);
}
function applyProp(el, propName, value) {
  if (value === "") {
    el.style.removeProperty(propName);
    return;
  }
  el.style.setProperty(propName, value);
}
function createStarwindElement(varMap) {
  var _StarwindElement_instances, applyAll_fn, _a;
  return _a = class extends HTMLElement {
    constructor() {
      super(...arguments);
      __privateAdd(this, _StarwindElement_instances);
    }
    static get observedAttributes() {
      return Object.keys(varMap);
    }
    connectedCallback() {
      __privateMethod(this, _StarwindElement_instances, applyAll_fn).call(this);
    }
    attributeChangedCallback() {
      __privateMethod(this, _StarwindElement_instances, applyAll_fn).call(this);
    }
  }, _StarwindElement_instances = new WeakSet(), applyAll_fn = function() {
    for (const [attr, spec] of Object.entries(varMap)) {
      const raw = this.getAttribute(attr);
      const value = raw == null ? "" : String(raw);
      if (spec.type === "space") {
        const normalized2 = normalizeSpaceLike(value);
        if (spec.var) applyVar(this, spec.var, normalized2);
        if (spec.prop) applyProp(this, spec.prop, normalized2);
        continue;
      }
      if (spec.type === "ratio") {
        const normalized2 = normalizeRatio(value);
        if (spec.var) applyVar(this, spec.var, normalized2);
        if (spec.prop) applyProp(this, spec.prop, normalized2);
        continue;
      }
      if (spec.type === "number") {
        const n = String(value).trim();
        const ok = /^-?\d+(\.\d+)?$/.test(n);
        const normalized2 = ok ? n : "";
        if (spec.var) applyVar(this, spec.var, normalized2);
        if (spec.prop) applyProp(this, spec.prop, normalized2);
        continue;
      }
      const normalized = String(value).trim();
      if (spec.var) applyVar(this, spec.var, normalized);
      if (spec.prop) applyProp(this, spec.prop, normalized);
    }
  }, _a;
}
export {
  applyProp,
  applyVar,
  createStarwindElement,
  defineElement,
  normalizeRatio,
  normalizeSpaceLike
};
