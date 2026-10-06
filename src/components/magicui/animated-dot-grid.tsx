"use client";

import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

interface AnimatedDotGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dot edge length in CSS pixels. */
  squareSize?: number;
  /** Space between dots in CSS pixels. */
  gridGap?: number;
  /** Peak opacity of a dot at rest. */
  maxOpacity?: number;
  /** Flicker speed multiplier. */
  speed?: number;
  /** CSS color or var(); defaults to the theme's foreground. */
  color?: string;
  /** Brighten dots around the pointer. */
  interactive?: boolean;
  /** Slow diagonal shimmer travelling across the grid. */
  wave?: boolean;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

// Every dot fades between pseudo-random brightness levels at its own pace.
// Brightness is a pure function of (cell, time), so the grid costs nothing
// on the CPU no matter how large it is.
const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_dpr;
uniform float u_time;
uniform float u_cell;
uniform float u_square;
uniform vec3 u_color;
uniform float u_maxOpacity;
uniform vec2 u_mouse;
uniform float u_mouseStrength;
uniform float u_wave;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 device = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec2 cell = floor(device / u_cell);
  vec2 local = device - cell * u_cell;
  if (local.x >= u_square || local.y >= u_square) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float seed = hash12(cell);
  float t = u_time * (0.35 + seed * 1.15) + seed * 17.0;
  float index = floor(t);
  float from = hash13(vec3(cell, index));
  float to = hash13(vec3(cell, index + 1.0));
  float level = mix(from, to, smoothstep(0.55, 1.0, fract(t)));
  float alpha = level * u_maxOpacity;

  vec2 css = device / u_dpr;
  float shimmer = sin((css.x * 0.6 + css.y) * 0.006 - u_time * 0.8);
  alpha *= mix(1.0, 0.65 + 0.7 * smoothstep(0.2, 1.0, shimmer), u_wave);

  float glow = 1.0 - smoothstep(0.0, 170.0, distance(css, u_mouse));
  alpha += glow * glow * u_mouseStrength * (0.25 + level) * 0.6;

  alpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(u_color * alpha, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

// Resolves any CSS color (including var() and oklch()) to 0-1 RGB.
function resolveRgb(color: string | undefined, host: HTMLElement): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.color = color || "var(--foreground)";
  probe.style.display = "none";
  host.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [0.5, 0.5, 0.5];
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

export function AnimatedDotGrid({
  squareSize = 2,
  gridGap = 2,
  maxOpacity = 0.3,
  speed = 1,
  color,
  interactive = false,
  wave = false,
  className,
  ...props
}: AnimatedDotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || fallback) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    const program = gl && createProgram(gl);
    if (!gl || !program) {
      setFallback(true);
      return;
    }

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      resolution: uniform("u_resolution"),
      dpr: uniform("u_dpr"),
      time: uniform("u_time"),
      cell: uniform("u_cell"),
      square: uniform("u_square"),
      color: uniform("u_color"),
      maxOpacity: uniform("u_maxOpacity"),
      mouse: uniform("u_mouse"),
      mouseStrength: uniform("u_mouseStrength"),
      wave: uniform("u_wave"),
    };
    gl.uniform1f(u.maxOpacity, maxOpacity);
    gl.uniform1f(u.wave, wave ? 1 : 0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dpr = 1;
    let visible = true;
    let frame = 0;
    let lastFrame = 0;
    const start = performance.now();
    const pointer = { x: -1e4, y: -1e4, active: false };
    const glow = { x: -1e4, y: -1e4, strength: 0 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(container.clientWidth * dpr));
      const height = Math.max(1, Math.round(container.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(u.resolution, width, height);
      gl.uniform1f(u.dpr, dpr);
      // Whole device pixels keep every dot the same size at fractional DPRs.
      gl.uniform1f(u.square, Math.max(1, Math.round(squareSize * dpr)));
      gl.uniform1f(u.cell, Math.max(2, Math.round((squareSize + gridGap) * dpr)));
    };

    const applyColor = () => gl.uniform3f(u.color, ...resolveRgb(color, container));

    const draw = (now: number) => {
      const seconds = reducedMotion.matches ? 0 : ((now - start) / 1000) * speed;
      gl.uniform1f(u.time, seconds % 3600);
      if (interactive) {
        const rect = canvas.getBoundingClientRect();
        const targetX = pointer.x - rect.left;
        const targetY = pointer.y - rect.top;
        if (glow.strength < 0.01) {
          glow.x = targetX;
          glow.y = targetY;
        } else {
          glow.x += (targetX - glow.x) * 0.18;
          glow.y += (targetY - glow.y) * 0.18;
        }
        glow.strength += ((pointer.active ? 1 : 0) - glow.strength) * 0.08;
        gl.uniform2f(u.mouse, glow.x, glow.y);
        gl.uniform1f(u.mouseStrength, glow.strength);
      } else {
        gl.uniform1f(u.mouseStrength, 0);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible || now - lastFrame < 1000 / 50) return;
      lastFrame = now;
      draw(now);
    };

    const startLoop = () => {
      cancelAnimationFrame(frame);
      if (reducedMotion.matches && !interactive) {
        draw(performance.now());
      } else {
        frame = requestAnimationFrame(loop);
      }
    };

    resize();
    applyColor();
    startLoop();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersectionObserver.observe(container);

    const themeObserver = new MutationObserver(() => {
      applyColor();
      draw(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    if (interactive) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("blur", onPointerLeave);
    }

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setFallback(true);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    reducedMotion.addEventListener("change", startLoop);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      reducedMotion.removeEventListener("change", startLoop);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [squareSize, gridGap, maxOpacity, speed, color, interactive, wave, fallback]);

  if (fallback) {
    return (
      <FlickeringGrid
        className={className}
        squareSize={squareSize}
        gridGap={gridGap}
        maxOpacity={maxOpacity}
        color={color}
        {...props}
      />
    );
  }

  return (
    <div ref={containerRef} className={cn("relative h-full w-full overflow-hidden", className)} {...props}>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
