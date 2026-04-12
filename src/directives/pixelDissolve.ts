/** Vue directive: canvas-based pixel dissolve on hover. */

interface DissolveParams {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  size?: number;
  duration?: number;
  direct?: "random" | "top" | "bottom" | "left" | "right" | "point";
  x?: number;
  y?: number;
  dissolvedStyle?: {
    backgroundColor?: string;
    color?: string;
    font?: string;
  };
}

/**
 * Runs the dissolve animation; invokes `callback` when the animation completes.
 */
function dissolve(params: DissolveParams, callback?: () => void): number {
  const defaultOpts = {
    size: 5,
    duration: 1000,
    direct: "random",
    dissolvedStyle: {
      backgroundColor: "#10b981",
      color: "#ff0000",
    },
  };

  const opts = { ...defaultOpts, ...params };

  const c = params.canvas;
  const ctx = c.getContext("2d")!;
  const w = params.width || c.width;
  const h = params.height || c.height;

  const minSize = Math.max(defaultOpts.size, Math.sqrt((w * h) / 2000) | 0);
  const size = (params.size || 0) > minSize ? params.size : minSize;
  const animDuration =
    (params.duration || 0) > 500 ? params.duration : defaultOpts.duration;
  const frameCount = Math.ceil(((animDuration || 1000) - 100) / 16.7);

  const colCount = Math.ceil(w / (size || 5));
  const rowCount = Math.ceil(h / (size || 5));

  const chips: Array<{ x: number; y: number; start?: number }> = [];
  for (let i = 0; i < colCount; i++) {
    for (let j = 0; j < rowCount; j++) {
      chips.push({
        x: i * (size || 5),
        y: j * (size || 5),
      });
    }
  }

  const xPos = params.x || w / 2;
  const yPos = params.y || h / 2;
  switch (params.direct) {
    case "top":
      chips.sort((a, b) => b.y - a.y);
      break;
    case "bottom":
      chips.sort((a, b) => a.y - b.y);
      break;
    case "left":
      chips.reverse();
      break;
    case "right":
      break;
    case "point":
      chips.sort((a, b) => {
        return (
          Math.abs(xPos - a.x) +
          Math.abs(yPos - a.y) -
          (Math.abs(xPos - b.x) + Math.abs(yPos - b.y))
        );
      });
      break;
    default:
      chips.sort(() => (Math.random() < 0.5 ? 1 : -1));
      break;
  }

  for (let index = 0, length = chips.length; index < length; index++) {
    const chip = chips[index];
    chip.start = frameCount * Math.random() * (index / length);
  }

  chips.sort((a, b) => (a.start || 0) - (b.start || 0));

  let process = 0;
  let pos = 0;
  let lastFrameTime = 0;
  let animationId: number | null = null;

  function animate() {
    process++;
    const tnow = +new Date();
    if (tnow - lastFrameTime > 30) {
      process++;
    }
    lastFrameTime = tnow;

    c.style.color = c.style.color ? "" : "#fff";

    const overallProgress = Math.min(process / frameCount, 1);

    if (pos < chips.length) {
      for (let i = pos; i < chips.length; i++) {
        const cp = chips[i];
        if ((cp.start || 0) <= process) {
          ctx.clearRect(cp.x, cp.y, size || 5, size || 5);
          if (process - (cp.start || 0) <= 5) {
            const alpha = 1 - (process - (cp.start || 0)) / 10;
            const bgColor = opts.dissolvedStyle?.backgroundColor || "#10b981";

            ctx.fillStyle = `rgba(${hexToRgb(bgColor)}, ${1 - alpha})`;
            ctx.fillRect(cp.x, cp.y, size || 5, size || 5);
          } else {
            const bgColor = opts.dissolvedStyle?.backgroundColor || "#10b981";

            ctx.fillStyle = bgColor;
            ctx.fillRect(cp.x, cp.y, size || 5, size || 5);
            pos = i + 1;
          }
        } else {
          break;
        }
      }

      if (overallProgress > 0) {
        const textColor = opts.dissolvedStyle?.color || "#ff0000";
        const font =
          opts.dissolvedStyle?.font || "13px 'SF Pro Text'";

        ctx.clearRect(0, 0, c.width, c.height);

        for (let i = 0; i < pos; i++) {
          const cp = chips[i];
          const bgColor = opts.dissolvedStyle?.backgroundColor || "#10b981";
          ctx.fillStyle = bgColor;
          ctx.fillRect(cp.x, cp.y, size || 5, size || 5);
        }

        ctx.fillStyle = `rgba(${hexToRgb(textColor)}, ${overallProgress})`;
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = c.dataset.text || "Button";
        const fontSize = parseFloat(ctx.font);
        const verticalOffset = fontSize * 0.2;

        ctx.fillText(text, c.width / 2, c.height / 2 + verticalOffset);
      }

      animationId = requestAnimationFrame(animate);
    } else {
      const bgColor = opts.dissolvedStyle?.backgroundColor || "#10b981";
      const textColor = opts.dissolvedStyle?.color || "#ff0000";
      const font =
        opts.dissolvedStyle?.font || "13px 'SF Pro Text'";

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = textColor;
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const text = c.dataset.text || "Button";
      const fontSize = parseFloat(ctx.font);
      const verticalOffset = fontSize * 0.2;

      ctx.fillText(text, c.width / 2, c.height / 2 + verticalOffset);

      callback?.();
    }
  }
  animationId = requestAnimationFrame(animate);
  return animationId;
}

function hexToRgb(hex: string): string {
  hex = hex.replace(/^#/, "");

  let r: number;
  let g: number;
  let b: number;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  return `${r}, ${g}, ${b}`;
}

interface PixelDissolveOptions {
  size?: number;
  duration?: number;
  direct?: "random" | "top" | "bottom" | "left" | "right" | "point";
  x?: number;
  y?: number;
  initialStyle?: {
    backgroundColor?: string;
    color?: string;
    font?: string;
  };
  dissolvedStyle?: {
    backgroundColor?: string;
    color?: string;
    font?: string;
  };
}

interface ElementWithPixelDissolve extends HTMLElement {
  _pixelDissolve?: {
    originalText: string;
    originalStyle: CSSStyleDeclaration;
    canvas: HTMLCanvasElement;
    drawButton: (useDissolvedStyle?: boolean) => void;
  };
  dataset: DOMStringMap & {
    text?: string;
  };
}

export default {
  mounted(
    el: ElementWithPixelDissolve,
    binding: { value?: PixelDissolveOptions },
  ) {
    const options = binding.value || {};
    const originalText = el.textContent;
    const originalStyle = { ...el.style };

    const initialStyle = options.initialStyle || {
      backgroundColor: "#2563eb",
      color: "#ffffff",
    };
    const dissolvedStyle = options.dissolvedStyle || {
      backgroundColor: "#10b981",
      color: "#ff0000",
    };

    const computedStyle = window.getComputedStyle(el);

    const btnWidth = parseFloat(computedStyle.width) || 100;
    const btnHeight = parseFloat(computedStyle.height) || 40;

    const canvas = document.createElement("canvas");
    canvas.width = btnWidth;
    canvas.height = btnHeight;

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.border = "none";
    canvas.style.borderRadius = computedStyle.borderRadius || "8px";
    canvas.style.cursor = "pointer";
    canvas.style.boxShadow =
      computedStyle.boxShadow || "0 2px 4px rgba(0,0,0,0.1)";
    canvas.style.userSelect = "none";

    el.innerHTML = "";
    el.appendChild(canvas);

    canvas.dataset.text = originalText ?? "";

    el.style.position = "relative";
    el.style.overflow = "hidden";
    el.style.width = `${btnWidth}px`;
    el.style.height = `${btnHeight}px`;
    el.style.padding = "0";
    el.style.margin = "0";
    el.style.border = "none";

    const styleWithoutSize = {
      backgroundColor: initialStyle.backgroundColor,
      color: initialStyle.color,
      font: initialStyle.font,
    };
    Object.assign(el.style, styleWithoutSize);

    function drawButton(useDissolvedStyle = false) {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const targetStyle = useDissolvedStyle ? dissolvedStyle : initialStyle;

      if (targetStyle.backgroundColor) {
        ctx.fillStyle = targetStyle.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        const bgColor = targetStyle.backgroundColor || "#2563eb";
        bgGradient.addColorStop(0, bgColor);
        bgGradient.addColorStop(1, adjustBrightness(bgColor, -10));
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.fillStyle = targetStyle.color || "#ffffff";
      ctx.font = targetStyle.font || originalStyle.font || "13px 'SF Pro Text'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const text = originalText || "Button";

      const fontSize = parseFloat(ctx.font);
      const verticalOffset = fontSize * 0.2;

      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + verticalOffset);
    }

    function adjustBrightness(color: string, amount: number): string {
      return (
        "#" +
        color.replace(/^#/, "").replace(/../g, (colorPair: string) => {
          const num = parseInt(colorPair, 16) + amount;
          return Math.max(0, Math.min(255, num)).toString(16).padStart(2, "0");
        })
      );
    }

    drawButton();

    let animationFrameId: number | null = null;

    function resetAnimation() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      drawButton();
    }

    let isMouseOver = false;

    el.addEventListener("mouseenter", () => {
      isMouseOver = true;
      resetAnimation();

      animationFrameId = dissolve(
        {
          canvas,
          width: canvas.width,
          height: canvas.height,
          size: options.size || 5,
          duration: options.duration || 1000,
          direct: options.direct || "random",
          x: options.x,
          y: options.y,
          dissolvedStyle: {
            ...dissolvedStyle,
            font:
              dissolvedStyle.font ||
              initialStyle.font ||
              originalStyle.font ||
              "13px 'SF Pro Text'",
          },
        },
        () => {
          if (!isMouseOver) {
            resetAnimation();
          }
        },
      );
    });

    el.addEventListener("mouseleave", () => {
      isMouseOver = false;
      resetAnimation();
    });

    el._pixelDissolve = {
      originalText: originalText ?? "",
      originalStyle,
      canvas,
      drawButton,
    };
  },
  unmounted(el: ElementWithPixelDissolve) {
    if (el._pixelDissolve) {
      delete el._pixelDissolve;
    }
  },
};
