// pixelDissolve.ts - 像素溶解效果指令

interface DissolveParams {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  size?: number;
  duration?: number;
  direct?: 'random' | 'top' | 'bottom' | 'left' | 'right' | 'point';
  x?: number;
  y?: number;
  dissolvedStyle?: {
    backgroundColor?: string;
    color?: string;
    font?: string;
  };
}



/**
 * 块溶解核心函数
 * @param {DissolveParams} params 配置参数
 * @param {Function} callback 动画结束回调
 */
function dissolve(params: DissolveParams, callback?: () => void): number {
  const defaultOpts = {
    size: 5, // 颗粒大小
    duration: 1000, // 持续时间(ms)
    direct: "random", // 溶解方向：random/top/bottom/left/right/point
    dissolvedStyle: {
      backgroundColor: "#10b981", // 默认绿色
      color: "#ff0000", // 默认红色文字
    },
  };

  // 合并配置
  const opts = { ...defaultOpts, ...params };

  const c = params.canvas;

  const ctx = c.getContext("2d")!
  const w = params.width || c.width;
  const h = params.height || c.height;

  // 计算最小颗粒尺寸（保证颗粒总数不超过2000，且不小于默认值）
  const minSize = Math.max(defaultOpts.size, Math.sqrt((w * h) / 2000) | 0);
  const size = (params.size || 0) > minSize ? params.size : minSize;
  const animDuration =
    (params.duration || 0) > 500 ? params.duration : defaultOpts.duration;
  // 计算总帧数（按60fps计算，预留100ms收尾）
  const frameCount = Math.ceil(((animDuration || 1000) - 100) / 16.7);

  // 计算横向/纵向颗粒数量
  const colCount = Math.ceil(w / (size || 5));
  const rowCount = Math.ceil(h / (size || 5));

  // 生成所有颗粒区块
  const chips: Array<{ x: number; y: number; start?: number }> = [];
  for (let i = 0; i < colCount; i++) {
    for (let j = 0; j < rowCount; j++) {
      chips.push({
        x: i * (size || 5),
        y: j * (size || 5),
      });
    }
  }

  // 根据溶解方向排序颗粒
  const xPos = params.x || w / 2;
  const yPos = params.y || h / 2;
  switch (params.direct) {
    case "top": // 从下往上溶解
      chips.sort((a, b) => b.y - a.y);
      break;
    case "bottom": // 从上往下溶解
      chips.sort((a, b) => a.y - b.y);
      break;
    case "left": // 从右往左溶解
      chips.reverse();
      break;
    case "right": // 从左往右溶解
      break;
    case "point": // 从指定点向外溶解
      chips.sort((a, b) => {
        return (
          Math.abs(xPos - a.x) +
          Math.abs(yPos - a.y) -
          (Math.abs(xPos - b.x) + Math.abs(yPos - b.y))
        );
      });
      break;
    default: // 完全随机溶解
      chips.sort(() => (Math.random() < 0.5 ? 1 : -1));
      break;
  }

  // 为每个颗粒分配开始消失的帧数
  for (let index = 0, length = chips.length; index < length; index++) {
    const chip = chips[index];
    chip.start = frameCount * Math.random() * (index / length);
  }

  // 按开始帧数排序颗粒
  chips.sort((a, b) => (a.start || 0) - (b.start || 0));

  let process = 0,
    pos = 0,
    tMoniter = 0;
  let animationId: number | null = null;
  // 逐帧执行溶解动画
  function animate() {
    process++;
    // 性能优化：跳帧处理（避免低端设备卡顿）
    const tnow = +new Date();
    if (tnow - tMoniter > 30) {
      process++;
    }
    tMoniter = tnow;

    // 强制触发重绘（兼容部分浏览器）
    c.style.color = c.style.color ? "" : "#fff";

    // 计算整体动画进度
    const overallProgress = Math.min(process / frameCount, 1);

    if (pos < chips.length) {
      for (let i = pos; i < chips.length; i++) {
        const cp = chips[i];
        if ((cp.start || 0) <= process) {
          // 清除当前颗粒区域
          ctx.clearRect(cp.x, cp.y, size || 5, size || 5);
          // 前5帧添加透明度过渡（让消失更柔和，同时逐渐显示溶解后的样式）
          if (process - (cp.start || 0) <= 5) {
            // 计算过渡透明度
            const alpha = 1 - (process - (cp.start || 0)) / 10;
            // 解析颜色（支持hex和rgb）
            const bgColor = opts.dissolvedStyle.backgroundColor || "#10b981";

            // 绘制溶解后的背景
            ctx.fillStyle = `rgba(${hexToRgb(bgColor)}, ${1 - alpha})`;
            ctx.fillRect(cp.x, cp.y, size || 5, size || 5);
          } else {
            // 完全显示溶解后的样式
            const bgColor = opts.dissolvedStyle.backgroundColor || "#10b981";

            // 绘制背景
            ctx.fillStyle = bgColor;
            ctx.fillRect(cp.x, cp.y, size || 5, size || 5);
            pos = i + 1;
          }
        } else {
          break;
        }
      }

      // 在背景溶解的同时，逐渐显示文字
      if (overallProgress > 0) {
        const textColor = opts.dissolvedStyle.color || "#ff0000";
        // 使用从dissolvedStyle中传递过来的字体
        const font = (opts.dissolvedStyle as any).font || "13px 'SF Pro Text'";

        // 清除之前的文字
        ctx.clearRect(0, 0, c.width, c.height);

        // 重新绘制所有已处理的颗粒背景
        for (let i = 0; i < pos; i++) {
          const cp = chips[i];
          const bgColor = opts.dissolvedStyle.backgroundColor || "#10b981";
          ctx.fillStyle = bgColor;
          ctx.fillRect(cp.x, cp.y, size || 5, size || 5);
        }

        // 绘制文字，透明度随整体进度变化
        ctx.fillStyle = `rgba(${hexToRgb(textColor)}, ${overallProgress})`;
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // 计算文字的实际高度，调整垂直位置
        const text = c.dataset.text || "Button";
        // const textMetrics = ctx.measureText(text); // 未使用
        const fontSize = parseFloat(ctx.font);
        const verticalOffset = fontSize * 0.2; // 向下调整20%的字体大小

        ctx.fillText(text, c.width / 2, c.height / 2 + verticalOffset);
      }

      animationId = requestAnimationFrame(animate);
    } else {
      // 动画结束后，绘制完整的溶解后样式（包括文字）
      const bgColor = opts.dissolvedStyle.backgroundColor || "#10b981";
      const textColor = opts.dissolvedStyle.color || "#ff0000";
      // 使用从dissolvedStyle中传递过来的字体
      const font = (opts.dissolvedStyle as any).font || "13px 'SF Pro Text'";

      // 绘制完整背景
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, c.width, c.height);
      // 绘制完整文字
      ctx.fillStyle = textColor;
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 计算字体大小，添加适当的垂直偏移量
      const text = c.dataset.text || "Button";
      const fontSize = parseFloat(ctx.font);
      const verticalOffset = fontSize * 0.2; // 向下调整20%的字体大小

      ctx.fillText(text, c.width / 2, c.height / 2 + verticalOffset);

      callback && callback();
    }
  }
  animationId = requestAnimationFrame(animate);
  return animationId;
}

// 辅助函数：将十六进制颜色转换为RGB格式
function hexToRgb(hex: string): string {
  // 移除#号
  hex = hex.replace(/^#/, "");

  // 解析RGB值
  let r, g, b;
  if (hex.length === 3) {
    // 简写形式：#RGB
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    // 完整形式：#RRGGBB
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  return `${r}, ${g}, ${b}`;
}

interface PixelDissolveOptions {
  size?: number;
  duration?: number;
  direct?: 'random' | 'top' | 'bottom' | 'left' | 'right' | 'point';
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

// Vue指令实现
export default {
  mounted(el: ElementWithPixelDissolve, binding: { value?: PixelDissolveOptions }) {
    const options = binding.value || {};
    // 保存原始内容和样式
    const originalText = el.textContent;
    const originalStyle = { ...el.style };

    // 解析配置选项
    const initialStyle = options.initialStyle || {
      backgroundColor: "#2563eb", // 默认蓝色
      color: "#ffffff", // 默认白色文字
    };
    const dissolvedStyle = options.dissolvedStyle || {
      backgroundColor: "#10b981", // 默认绿色
      color: "#ff0000", // 默认红色文字
    };

    // 获取元素的计算样式，确保获取到正确的尺寸
    const computedStyle = window.getComputedStyle(el);

    const btnWidth = parseFloat(computedStyle.width) || 100;
    const btnHeight = parseFloat(computedStyle.height) || 40;

    // 创建canvas元素替代原按钮
    const canvas = document.createElement("canvas");
    canvas.width = btnWidth;
    canvas.height = btnHeight;

    // 设置canvas样式
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.border = "none";
    canvas.style.borderRadius = computedStyle.borderRadius || "8px";
    canvas.style.cursor = "pointer";
    canvas.style.boxShadow =
      computedStyle.boxShadow || "0 2px 4px rgba(0,0,0,0.1)";
    canvas.style.userSelect = "none";

    // 清空元素并添加canvas
    el.innerHTML = "";
    el.appendChild(canvas);

    // 存储按钮文本到canvas的dataset中
    canvas.dataset.text = originalText;

    // 设置按钮容器样式，确保尺寸固定
    el.style.position = "relative";
    el.style.overflow = "hidden";
    el.style.width = `${btnWidth}px`;
    el.style.height = `${btnHeight}px`;
    el.style.padding = "0";
    el.style.margin = "0";
    el.style.border = "none";

    // 应用初始样式（除了尺寸相关的样式）
    const styleWithoutSize = {
      backgroundColor: initialStyle.backgroundColor,
      color: initialStyle.color,
      font: initialStyle.font
    };
    Object.assign(el.style, styleWithoutSize);

    // 绘制按钮内容到canvas
    function drawButton(useDissolvedStyle = false) {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 选择要使用的样式
      const targetStyle = useDissolvedStyle ? dissolvedStyle : initialStyle;

      // 绘制背景
      if (targetStyle.backgroundColor) {
        ctx.fillStyle = targetStyle.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // 默认渐变
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        const bgColor = targetStyle.backgroundColor || "#2563eb";
        bgGradient.addColorStop(0, bgColor);
        bgGradient.addColorStop(1, adjustBrightness(bgColor, -10));
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 绘制文字
      ctx.fillStyle = targetStyle.color || "#ffffff";
      ctx.font = targetStyle.font || originalStyle.font || "13px 'SF Pro Text'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 获取文本内容
      const text = originalText || "Button";

      // 计算字体大小，添加适当的垂直偏移量
      const fontSize = parseFloat(ctx.font);
      const verticalOffset = fontSize * 0.2; // 向下调整20%的字体大小

      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + verticalOffset);
    }

    // 辅助函数：调整颜色亮度
    function adjustBrightness(color: string, amount: number): string {
      return (
        "#" +
        color.replace(/^#/, "").replace(/../g, (color: string) => {
          const num = parseInt(color, 16) + amount;
          return Math.max(0, Math.min(255, num)).toString(16).padStart(2, "0");
        })
      );
    }

    // 初始化绘制
    drawButton();

    let animationFrameId: number | null = null;

    // 重置动画状态
    function resetAnimation() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      // 直接绘制按钮
      drawButton();
    }

    // 跟踪鼠标是否在按钮上
    let isMouseOver = false;

    // 鼠标移入事件
    el.addEventListener("mouseenter", () => {
      isMouseOver = true;
      // 立即重置之前的状态
      resetAnimation();

      // 执行溶解动画并存储animationId
      animationFrameId = dissolve(
        {
          canvas: canvas,
          width: canvas.width,
          height: canvas.height,
          size: options.size || 5,
          duration: options.duration || 1000,
          direct: options.direct || "random",
          x: options.x,
          y: options.y,
          dissolvedStyle: {
            ...dissolvedStyle,
            // 确保溶解后的字体与初始状态一致
            font:
              dissolvedStyle.font ||
              initialStyle.font ||
              originalStyle.font ||
              "13px 'SF Pro Text'",
          },
        },
        () => {
          // 检查鼠标是否仍然在按钮上
          if (!isMouseOver) {
            resetAnimation();
          }
        },
      );
    });

    // 鼠标移出事件 - 重置按钮
    el.addEventListener("mouseleave", () => {
      isMouseOver = false;
      // 立即重置按钮
      resetAnimation();
    });

    // 存储原始状态
    el._pixelDissolve = {
      originalText,
      originalStyle,
      canvas,
      drawButton,
    };
  },
  unmounted(el: ElementWithPixelDissolve) {
    // 清理
    if (el._pixelDissolve) {
      delete el._pixelDissolve;
    }
  },
};
