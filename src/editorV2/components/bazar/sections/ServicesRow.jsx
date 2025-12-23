import React from "react";
import { useNavigate } from "react-router-dom";
import "../BazarUI.css";
import ServiceCard from "../cards/ServiceCard";

export default function ServicesRow({ services = [] }) {
  const navigate = useNavigate();

  const handleViewService = (serviceId) => {
    navigate(`/bazar/service/${serviceId}`);
  };

  return (
    <section className="bz-sec">
      <div className="bz-sec__head">
        <div className="bz-sec__title">УСЛУГИ</div>
        <div className="bz-sec__sub">Оплата через TJ Кошельки • комиссия платформы 20%</div>
        <div className="bz-sec__spacer" />
        <button className="bz-linkBtn" type="button">Смотреть услуги</button>
      </div>

      <div className="bz-grid bz-grid--3">
        {services.map((s) => (
          <ServiceCard 
            key={s.id} 
            service={s} 
            onClick={() => handleViewService(s.id)}
          />
        ))}
      </div>
    </section>
  );
}
