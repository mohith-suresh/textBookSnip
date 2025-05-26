"use client";
import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

const GenericHTMLContent = ({ htmlContent, multiplier, highlightIds, reRender }) => {
  const contentRef = useRef(null);
  const overlayRef = useRef(null);
  const [isSnipping, setIsSnipping] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [overlayStyle, setOverlayStyle] = useState({ display: "none" });

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = htmlContent;
      contentRef.current.style.setProperty("--scale-factor", multiplier);
    }

    const handleMouseOver = (event) => {
      let element = event.target;
      while (element) {
        if (element.id && element.id.startsWith("overlay")) {
          document.body.style.cursor = "crosshair";
          return;
        }
        element = element.parentElement;
      }
      if (event.target.tagName.toLowerCase() === "span") {
        console.log("Spanning over the new text.")
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "auto"; // Reset to default for other elements
      }
    };

    const handleMouseOut = (event) => {
      document.body.style.cursor = "auto"; // Reset to default when the mouse leaves the element
    };

    const handleMouseDown = (event) => {
      let element = event.target;
      while (element) {
        if (element.id && element.id.startsWith("overlay")) {
          setIsSnipping(true);
          setStartPos({ x: event.clientX, y: event.clientY });
          setOverlayStyle({
            left: event.clientX + "px",
            top: event.clientY + "px",
            width: "0px",
            height: "0px",
            display: "block",
            zIndex: 9999, // Ensure the overlay is above other elements
          });
          console.log("Snipping started at:", event.clientX, event.clientY);
          return;
        }
        element = element.parentElement;
      }
    };

    const handleMouseMove = (event) => {
      if (isSnipping) {
        const currentX = event.clientX;
        const currentY = event.clientY;
        const width = currentX - startPos.x;
        const height = currentY - startPos.y;
        setOverlayStyle((prevStyle) => ({
          ...prevStyle,
          width: Math.abs(width) + "px",
          height: Math.abs(height) + "px",
          left: width < 0 ? currentX + "px" : prevStyle.left,
          top: height < 0 ? currentY + "px" : prevStyle.top,
        }));
        console.log("Snipping to:", currentX, currentY, "Width:", Math.abs(width), "Height:", Math.abs(height));
      }
    };

    const handleMouseUp = async () => {
      if (isSnipping) {
        setIsSnipping(false);
        console.log("Snipping ended");
        // Capture the screenshot of the snipped region
        if (overlayRef.current) {
          const overlayRect = overlayRef.current.getBoundingClientRect();
          const canvas = await html2canvas(contentRef.current, {
            x: overlayRect.left + window.scrollX,
            y: overlayRect.top + window.scrollY,
            width: overlayRect.width,
            height: overlayRect.height,
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight,
          });
          const imgData = canvas.toDataURL("image/png");
          console.log("Screenshot taken:", imgData);
          // You can now use the imgData for further processing
        }
      }
    };

    const handleScroll = () => {
      if (!isSnipping) {
        setOverlayStyle({ display: "none" });
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("scroll", handleScroll);

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [htmlContent, multiplier, isSnipping, startPos]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={contentRef}></div>
      <div
        ref={overlayRef}
        id="snip-overlay"
        style={{
          position: "fixed",
          backgroundColor: "rgba(128, 0, 128, 0.5)",
          display: overlayStyle.display,
          top: overlayStyle.top,
          left: overlayStyle.left,
          width: overlayStyle.width,
          height: overlayStyle.height,
          zIndex: overlayStyle.zIndex,
          pointerEvents: "none", // Ensure the overlay does not interfere with mouse events
        }}
      ></div>
    </div>
  );
};

export default GenericHTMLContent;
