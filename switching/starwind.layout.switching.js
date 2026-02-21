// sw-switching.js
import {
  createStarwindElement,
  defineElement,
} from "./starwind.elements.util.js";

const SwSwitchingLayout = createStarwindElement({
  gap: { var: "--sw-switching-gap", type: "space" },
  threshold: { var: "--sw-switching-threshold", type: "space" },
});

export function defineSwSwitching() {
  defineElement("sw-switching", SwSwitchingLayout);
}
