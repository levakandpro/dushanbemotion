import React, { useState } from "react";
import "../BazarUI.css";
import ServiceViewModal from "./ServiceViewModal";

export default function ServicesSection({ services }) {
  const [selectedService, setSelectedService] = useState(null);

  if (!services || services.length === 0) return null;

  return (
    <>
      <div className="bz-services-grid">
        {services.map((s) => (
          <article 
            key={s.id} 
            className="bz-service-card"
            onClick={() => setSelectedService(s)}
          >
            {s.isNew && (
              <div className="bz-service-card__badge">НОВОЕ</div>
            )}
            {s.coverUrl && (
              <div className="bz-service-card__cover">
                <img src={s.coverUrl} alt="" />
              </div>
            )}
            <div className="bz-service-card__content">
              <h3 className="bz-service-card__title">{s.title}</h3>
              <p className="bz-service-card__desc">{s.desc}</p>
              <div className="bz-service-card__meta">
                <span>⏱️ {s.deliveryDays} дн.</span>
                <span>⭐ {s.stars > 0 ? s.stars.toFixed(1) : "—"}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedService && (
        <ServiceViewModal 
          service={selectedService} 
          onClose={() => setSelectedService(null)} 
        />
      )}
    </>
  );
}
