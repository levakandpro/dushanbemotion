import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../BazarUI.css";
import CollabViewModal from "./CollabViewModal";

export default function CollabsSection({ collabs, isPremium = false }) {
  const navigate = useNavigate();
  const [selectedCollab, setSelectedCollab] = useState(null);

  if (!collabs || collabs.length === 0) return null;

  const handleAuthorClick = (e, username) => {
    e.stopPropagation();
    if (username) {
      navigate(`/u/${username}`);
    }
  };

  return (
    <>
      <div className="bz-services-grid">
        {collabs.map((c) => (
          <article 
            key={c.id} 
            className="bz-service-card"
            onClick={() => setSelectedCollab(c)}
          >
            {c.isNew && (
              <div className="bz-service-card__badge">НОВОЕ</div>
            )}
            
            {c.coverUrl && (
              <div className="bz-service-card__cover">
                <img src={c.coverUrl} alt="" />
              </div>
            )}
            
            <div className="bz-service-card__content">
              <h3 className="bz-service-card__title">{c.title}</h3>
              
              <div className="bz-service-card__meta">
                <span 
                  className="bz-service-card__author"
                  onClick={(e) => handleAuthorClick(e, c.author1?.username)}
                >
                  {c.author1?.display_name || "Автор"}
                </span>
                <span className="bz-service-card__x">×</span>
                <span 
                  className="bz-service-card__author"
                  onClick={(e) => handleAuthorClick(e, c.author2?.username)}
                >
                  {c.author2?.display_name || "Автор"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedCollab && (
        <CollabViewModal
          collab={selectedCollab}
          onClose={() => setSelectedCollab(null)}
          isPremium={isPremium}
        />
      )}
    </>
  );
}
