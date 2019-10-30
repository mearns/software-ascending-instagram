import { useRouter } from "next/router";
import React, { useState, useEffect, useRef } from "react";

async function getScaledImage(src, maxWidth, maxHeight, gravity) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const scaleX = maxWidth / nw;
  const scaleY = maxHeight / nh;
  const scale = Math.min(scaleX, scaleY);
  const w = nw * scale;
  const h = nh * scale;
  return [img, w, h];
}

async function loadAndPaintImage(canvas, src, gravity, authorImageSrc, title) {
  const [img, w, h] = await getScaledImage(src, canvas.width, canvas.height);
  const [x, y] = applyGravity(canvas.width - w, canvas.height - h, gravity);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, x, y, w, h);
  if (authorImageSrc) {
    const scale = 7;
    const [authorImg, authorW, authorH] = await getScaledImage(
      authorImageSrc,
      canvas.width / scale,
      canvas.height / scale
    );
    const x = canvas.width - authorW - canvas.width / 40;
    const y = canvas.height - authorH - canvas.height / 40;
    const cx = Math.floor(x + authorW / 2);
    const cy = Math.floor(y + authorH / 2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(
      cx,
      cy,
      Math.floor(Math.max(authorW, authorH)) / 2,
      0,
      2.0 * Math.PI
    );
    ctx.clip();
    ctx.drawImage(authorImg, x, y, authorW, authorH);
    ctx.restore();
  }

  if (title) {
    const nominalFontSize = 42;
    const lineSpacing = 1.3;
    const padding = canvas.width / 30;
    const lines = title.split(/\\n/);
    ctx.save();
    ctx.font = `${nominalFontSize}pt serif`;
    const metrics = lines.map(line => ctx.measureText(line));
    const nominalRight = Math.max(
      ...metrics.map(m => m.actualBoundingBoxRight)
    );
    const nominalLeft = Math.min(
      ...metrics.map(m => Math.min(0, m.actualBoundingBoxLeft))
    );
    const nominalLineHeight = Math.max(
      ...metrics.map(m => m.actualBoundingBoxAscent)
    );
    const nominalHeight =
      nominalLineHeight *
      (lines.length + (lines.length - 1) * (lineSpacing - 1));
    const hscale = (canvas.width - padding * 2) / nominalRight;
    const vscale = (canvas.height - padding * 2) / nominalHeight;
    const scale = Math.min(hscale, vscale);
    const fontSize = Math.floor(scale * nominalFontSize);
    ctx.font = `${fontSize}pt serif`;
    const x = padding + nominalLeft * scale;
    const y = padding;
    const lineHeight = nominalLineHeight * scale;
    lines.forEach((line, idx) => {
      ctx.fillText(
        line,
        x,
        y + (idx + 1) * lineHeight + idx * lineHeight * (lineSpacing - 1)
      );
    });
    ctx.restore();
  }
}

function applyGravity(sx, sy, gravity = "center") {
  const match = /^(?:(n|north|s|south)?\s*(e|east|w|west)?|(m|middle|c|center))$/.exec(
    gravity.toLowerCase()
  );
  if (!match) {
    console.warn("Invalid gravity specified");
    return [sx / 2, sy / 2];
  }
  const [, vert, horz] = match;
  const y = !vert ? sy / 2 : vert.startsWith("n") ? 0 : sy;
  const x = !horz ? sx / 2 : horz.startsWith("e") ? 0 : sx;
  return [x, y];
}

const Page = () => {
  const router = useRouter();
  const title = useRef();
  const canvas = useRef();
  const width = 300;
  const titlePadding = 15;
  const foregroundColor = router.query.fgColor || "black";
  const backgroundColor = router.query.bgColor || "rgba(255, 255, 255, 0.7)";

  const [titleSize, setTitleSize] = useState(32);

  useEffect(() => {
    if (!title.current) {
      return;
    }
    const h1 = title.current;
    if (h1.clientHeight > width || h1.clientWidth > width) {
      console.log("XXX", titleSize, h1.clientWidth);
      setTitleSize(titleSize - 1);
    }
  }, [title, titleSize, router.query.title]);

  useEffect(() => {
    if (!router.query.photo) {
      return;
    }
    if (!canvas.current) {
      return;
    }
    loadAndPaintImage(
      canvas.current,
      router.query.photo,
      router.query.gravity,
      router.query.authorImage,
      router.query.title
    );
  }, [
    canvas,
    router.query.photo,
    router.query.gravity,
    router.query.authorImage,
    router.query.title
  ]);

  return (
    <div>
      <h1
        ref={title}
        style={{
          display: "none",
          position: "absolute",
          padding: `${titlePadding}px 0 0 ${titlePadding}px`,
          margin: 0,
          maxWidth: width - 2 * titlePadding,
          fontSize: titleSize,
          whiteSpace: "pre",
          color: foregroundColor,
          textShadow: `
            -1px -1px 2px ${backgroundColor},
            -1px  1px 2px ${backgroundColor},
             1px  1px 2px ${backgroundColor},
             1px -1px 2px ${backgroundColor}
          `
        }}
      >
        {router.query.title && router.query.title.replace(/\\n/g, "\n")}
      </h1>
      <canvas
        ref={canvas}
        width={width}
        height={width}
        style={{ border: "3px solid black" }}
      />
    </div>
  );
};

export default Page;
