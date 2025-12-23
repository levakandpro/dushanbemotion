import React, { useRef, useState, useEffect } from "react";
import CollectionCard from "../cards/CollectionCard";
import "../BazarUI.css";

export default function CollectionsRow({ collections = [], onView, onAuthorClick }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  if (!collections || collections.length === 0) {
    return null;
  }

  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollLeftStart(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - startX;
    scrollRef.current.scrollLeft = scrollLeftStart - deltaX;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!scrollRef.current) return;
    // Горизонтальный скролл колёсиком мыши
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div 
      className="bz-strip bz-strip--scrollable"
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          covers={collection.covers || []}
          onView={onView}
          onAuthorClick={onAuthorClick}
          mini
        />
      ))}
    </div>
  );
}
