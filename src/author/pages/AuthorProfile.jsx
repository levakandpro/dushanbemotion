import React, { useMemo, useState, useEffect } from "react";
import "../components/author-ui.css";
import "./AuthorProfile.css";
import Loader from "../../components/ui/Loader";
import { getCurrentUser, getUserProfile, updateUserProfile } from "../../services/userService";
import { getAuthorStats } from "../../services/workService";

import AuthorStatsBar from "../components/AuthorStatsBar";

const DEFAULT_AVA = "https://archive.org/download/dd_20251214/dd.png";

export default function AuthorProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({ likesStars: 0, recommend: 0, orders: 0, balanceDmc: 0 });

  // Загружаем статистику
  useEffect(() => {
    const loadStats = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const authorStats = await getAuthorStats(user.id);
          setStats(authorStats);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };
    loadStats();
  }, []);

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    country: "",
    bio: "",
    avatar_url: "",
  });

  // Загружаем данные профиля при монтировании
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (!user) {
          setError("Пользователь не найден");
          return;
        }

        const profile = await getUserProfile(user.id);
        if (profile) {
          setForm({
            name: profile.display_name || "",
            tagline: profile.social_instagram || profile.social_telegram || "",
            country: profile.country || "",
            bio: profile.bio || "",
            avatar_url: profile.avatar_url || "",
          });
        } else {
          // Профиль не найден - возможно, нужно пройти онбординг
          setError("Профиль не найден. Пожалуйста, завершите настройку профиля.");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Ошибка загрузки профиля");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Сохранение профиля
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const user = await getCurrentUser();
      if (!user) {
        setError("Пользователь не найден");
        return;
      }

      // Подготавливаем данные для сохранения (убираем пустые строки)
      const updates = {};
      if (form.name && form.name.trim()) updates.display_name = form.name.trim();
      if (form.country && form.country.trim()) updates.country = form.country.trim();
      if (form.bio && form.bio.trim()) updates.bio = form.bio.trim();
      if (form.avatar_url && form.avatar_url.trim()) updates.avatar_url = form.avatar_url.trim();
      if (form.tagline && form.tagline.trim()) updates.social_instagram = form.tagline.trim();
      
      // Если все поля пустые, показываем ошибку
      if (Object.keys(updates).length === 0) {
        setError("Заполните хотя бы одно поле");
        return;
      }

      await updateUserProfile(user.id, updates);

      alert("Профиль сохранен!");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err?.message || "Ошибка сохранения профиля");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="au-profile">
      <div className="au-pageHead">
        <div>
          <h1 className="au-pageTitle">Профиль автора</h1>
          <p className="au-pageSub">Внешний вид профиля должен внушать доверие.</p>
        </div>
      </div>

      <AuthorStatsBar stats={stats} />

      {error && (
        <div style={{ padding: "12px", background: "rgba(255,0,0,0.1)", borderRadius: "8px", marginBottom: "16px", color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      <div className="au-profile__grid">
        <div className="au-card au-card__in">
          <div className="au-profile__top">
            <div className="au-profile__ava">
              <img src={form.avatar_url || DEFAULT_AVA} alt="" />
            </div>
            <div className="au-profile__meta">
              <div className="au-profile__name">{form.name || "Не указано"}</div>
              <div className="au-profile__tag">{form.tagline || "Не указано"}</div>
              <div className="au-profile__sub">{form.country || "Не указано"}</div>

              <div className="au-profile__badges">
                <span className="au-badge is-accent">Авторская</span>
                <span className="au-badge">Верификация</span>
                <span className="au-badge">Портфолио</span>
              </div>
            </div>

            <div className="au-profile__actions">
              <button className="au-btn" type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button className="au-btn au-btn--ghost" type="button">Сменить аватар</button>
            </div>
          </div>

          <div className="au-sep" />

          <div className="au-profile__form">
            <label className="au-profile__label">
              Имя/студия
              <input className="au-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>

            <label className="au-profile__label">
              Теги/направление
              <input className="au-input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </label>

            <label className="au-profile__label">
              Страна
              <input className="au-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </label>

            <label className="au-profile__label">
              Описание
              <textarea
                className="au-profile__textarea"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="au-card au-card__in">
          <div className="au-badge">Публично</div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 900 }}>Как видит клиент</div>
          <div style={{ marginTop: 4, color: "rgba(230,237,234,.58)", fontSize: 12, lineHeight: 1.4 }}>
            Клиент должен сразу понять: ты серьёзный автор. Чистое имя, понятная ниша, сильное описание.
          </div>

          <div className="au-sep" />

          <div className="au-profile__preview">
            <div className="au-profile__pName">{form.name}</div>
            <div className="au-profile__pTag">{form.tagline}</div>
            <div className="au-profile__pBio">{form.bio}</div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="au-btn" type="button">Открыть в BAZAR</button>
            <button className="au-btn au-btn--ghost" type="button">Скопировать ссылку</button>
          </div>
        </div>
      </div>
    </div>
  );
}
