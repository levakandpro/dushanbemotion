[1mdiff --git a/src/author/AuthorLayout.jsx b/src/editorV2/splash/SplashHeader.jsx[m
[1mindex 7696998..1ce0462 100644[m
[1m--- a/src/author/AuthorLayout.jsx[m
[1m+++ b/src/editorV2/splash/SplashHeader.jsx[m
[36m@@ -1,218 +1,222 @@[m
[31m-import React, { useEffect, useState } from "react";[m
[31m-import { Link, useLocation, useNavigate } from "react-router-dom";[m
[31m-import { supabase } from "../services/supabaseClient";[m
[31m-import { useAuth } from "../lib/useAuth";[m
[31m-import { getUserProfile } from "../services/userService";[m
[31m-import "./AuthorLayout.css";[m
[31m-import mark from "../editorV2/components/bazar/assets/ii.png";[m
[32m+[m[32m﻿// src/editorV2/splash/SplashHeader.jsx[m
[32m+[m[32mimport React, { useState, useRef, useEffect } from 'react'[m
[32m+[m[32mimport { Link, useNavigate } from 'react-router-dom'[m
[32m+[m[32mimport LogoFiol from '../../assets/icons/logofiol.svg'[m
[32m+[m[32mimport { useAuth } from '../../lib/useAuth'[m
[32m+[m[32mimport { supabase } from '../../lib/supabaseClient'[m
[32m+[m[32mimport { getUserProfile } from '../../services/userService'[m
[32m+[m[32mimport AvatarPremiumSlideshow from '../../shared/components/AvatarPremiumSlideshow'[m
[32m+[m[32mimport { getAvatarUrl } from '../../shared/constants/avatars'[m
[32m+[m[32mimport './SplashHeader.css'[m
[32m+[m
[32m+[m[32mexport default function SplashHeader({ onShowAuthModal }) {[m
[32m+[m[32m  const { user, loading } = useAuth()[m
[32m+[m[32m  const [profile, setProfile] = useState(null)[m
[32m+[m[32m  const [showUserMenu, setShowUserMenu] = useState(false)[m
[32m+[m[32m  const [showDownloadsMenu, setShowDownloadsMenu] = useState(false)[m
[32m+[m[32m  const menuRef = useRef(null)[m
[32m+[m[32m  const downloadsMenuRef = useRef(null)[m
[32m+[m[32m  const navigate = useNavigate()[m
 [m
[32m+[m[32m  useEffect(() => {[m
[32m+[m[32m    if (user) {[m
[32m+[m[32m      loadProfile()[m
[32m+[m[32m    }[m
[32m+[m[32m  }, [user])[m
 [m
[31m-function Dot() {[m
[31m-  return <span className="au-dot" aria-hidden="true" />;[m
[31m-}[m
[31m-[m
[31m-function Icon({ type }) {[m
[31m-  switch (type) {[m
[31m-    case "home":[m
[31m-      return ([m
[31m-        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">[m
[31m-          <path[m
[31m-            fill="currentColor"[m
[31m-            d="M12 3.2 3 10.4v10.4h6.2v-6.1h5.6v6.1H21V10.4L12 3.2zm7.2 16h-2.6v-6.1H7.4v6.1H4.8v-8l7.2-5.8 7.2 5.8v8z"[m
[31m-          />[m
[31m-        </svg>[m
[31m-      );[m
[31m-    case "works":[m
[31m-      return ([m
[31m-        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">[m
[31m-          <path[m
[31m-            fill="currentColor"[m
[31m-            d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11zm2.5-.9a.9.9 0 0 0-.9.9v11c0 .5.4.9.9.9h11c.5 0 .9-.4.9-.9v-11a.9.9 0 0 0-.9-.9h-11zM7 15.8l2.3-2.6 2.2 2.4 3.4-4.2 2.1 2.6v1.8H7v-2z"[m
[31m-          />[m
[31m-        </svg>[m
[31m-      );[m
[31m-    case "services":[m
[31m-      return ([m
[31m-        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">[m
[31m-          <path[m
[31m-            fill="currentColor"[m
[31m-            d="M7 4h10a2 2 0 0 1 2 2v2h-2V6H7v12h10v-2h2v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm10.4 6.2 1.4-1.4 3.2 3.2-1.4 1.4-3.2-3.2zM10 13.6l6.4-6.4 3.2 3.2-6.4 6.4H10v-3.2z"[m
[31m-          />[m
[31m-        </svg>[m
[31m-      );[m
[31m-    case "collabs":[m
[31m-      return ([m
[31m-        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">[m
[31m-          <path[m
[31m-            fill="currentColor"[m
[31m-            d="M7.2 12.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm9.6 0a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM7.2 13.8c2.4 0 4.4 1.2 5.3 3.1.1.2.1.5 0 .7-.2.3-.4.4-.7.4H2.7c-.3 0-.5-.1-.7-.4-.1-.2-.1-.5 0-.7.9-1.9 2.9-3.1 5.2-3.1zm9.6 0c2.4 0 4.4 1.2 5.3 3.1.1.2.1.5 0 .7-.2.3-.4.4-.7.4h-6.3c.1-.2.1-.5 0-.7-.6-1.2-1.6-2.2-2.8-2.8.9-.5 2-.7 3.2-.7z"[m
[31m-          />[m
[31m-        </svg>[m
[31m-      );[m
[31m-    case "collections":[m
[31m-      return ([m
[31m-        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">[m
[31m-          <path[m
[31m-            fill="currentColor"[m
[31m-            d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"[m
[31m-          />[m
[31m-        </svg>[m
[31m-      );[m
[31m-    case "profile":[m
[31m-    default:[m
[31m-      return ([m
[31m-        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">[m
[31m-          <path[m
[31m-            fill="currentColor"[m
[31m-            d="M12 12.2a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4zm0-6.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zM4.2 20.2c.6-4 4-6.6 7.8-6.6s7.2 2.6 7.8 6.6H18c-.5-3-3-5-6-5s-5.5 2-6 5H4.2z"[m
[31m-          />[m
[31m-        </svg>[m
[31m-      );[m
[31m-  }[m
[31m-}[m
[31m-[m
[31m-export default function AuthorLayout({ children }) {[m
[31m-  const location = useLocation();[m
[31m-  const navigate = useNavigate();[m
[31m-  const { user, loading: authLoading } = useAuth();[m
[31m-  const [profile, setProfile] = useState(null);[m
[31m-  const [profileLoading, setProfileLoading] = useState(true);[m
[31m-[m
[32m+[m[32m  // Закрытие меню при клике вне его[m
   useEffect(() => {[m
[31m-    if (user && !authLoading) {[m
[31m-      loadProfile();[m
[32m+[m[32m    const handleClickOutside = (event) => {[m
[32m+[m[32m      if (menuRef.current && !menuRef.current.contains(event.target)) {[m
[32m+[m[32m        setShowUserMenu(false)[m
[32m+[m[32m      }[m
[32m+[m[32m      if (downloadsMenuRef.current && !downloadsMenuRef.current.contains(event.target)) {[m
[32m+[m[32m        setShowDownloadsMenu(false)[m
[32m+[m[32m      }[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    if (showUserMenu || showDownloadsMenu) {[m
[32m+[m[32m      document.addEventListener('mousedown', handleClickOutside)[m
[32m+[m[32m      return () => document.removeEventListener('mousedown', handleClickOutside)[m
     }[m
[31m-  }, [user, authLoading]);[m
[32m+[m[32m  }, [showUserMenu, showDownloadsMenu])[m
 [m
   const loadProfile = async () => {[m
[31m-    if (!user) return;[m
[32m+[m[32m    if (!user) return[m
     try {[m
[31m-      const profileData = await getUserProfile(user.id);[m
[31m-      setProfile(profileData);[m
[31m-      [m
[31m-      // Проверка: если пользователь не автор, редирект на онбординг[m
[31m-      if (profileData && profileData.is_author !== true) {[m
[31m-        navigate("/author/onboarding");[m
[31m-        return;[m
[31m-      }[m
[32m+[m[32m      const profileData = await getUserProfile(user.id)[m
[32m+[m[32m      setProfile(profileData)[m
     } catch (error) {[m
[31m-      console.error("Error loading profile:", error);[m
[31m-    } finally {[m
[31m-      setProfileLoading(false);[m
[32m+[m[32m      console.error('Error loading profile:', error)[m
     }[m
[31m-  };[m
[31m-[m
[31m-  const nav = [[m
[31m-    { path: "/author", label: "Главная", icon: <Icon type="home" /> },[m
[31m-    { path: "/author/works", label: "Мои работы", icon: <Icon type="works" /> },[m
[31m-    { path: "/author/collections", label: "Коллекции", icon: <Icon type="collections" /> },[m
[31m-    { path: "/author/services", label: "Мои услуги", icon: <Icon type="services" /> },[m
[31m-    { path: "/author/collabs", label: "Коллабы", icon: <Icon type="collabs" /> },[m
[31m-    { path: "/author/profile", label: "Профиль автора", icon: <Icon type="profile" /> },[m
[31m-  ];[m
[31m-[m
[31m-  const isActive = (path) => {[m
[31m-    if (path === "/author") return location.pathname === "/author";[m
[31m-    return location.pathname.startsWith(path);[m
[31m-  };[m
[32m+[m[32m  }[m
 [m
   const handleLogout = async () => {[m
[31m-    await supabase.auth.signOut();[m
[31m-    navigate("/auth/login");[m
[31m-  };[m
[31m-[m
[31m-  // Показываем загрузку, пока проверяем профиль[m
[31m-  if (authLoading || profileLoading) {[m
[31m-    return ([m
[31m-      <div[m
[31m-        style={{[m
[31m-          display: "flex",[m
[31m-          justifyContent: "center",[m
[31m-          alignItems: "center",[m
[31m-          height: "100vh",[m
[31m-          color: "white",[m
[31m-        }}[m
[31m-      >[m
[31m-        Загрузка...[m
[31m-      </div>[m
[31m-    );[m
[32m+[m[32m    await supabase.auth.signOut()[m
[32m+[m[32m    setShowUserMenu(false)[m
[32m+[m[32m    navigate('/')[m
   }[m
 [m
[31m-  // Если профиль загружен и пользователь не автор, редирект уже произошел[m
[31m-  // Но на всякий случай проверяем еще раз[m
[31m-  if (profile && profile.is_author !== true) {[m
[31m-    return null; // Редирект уже произошел[m
[32m+[m[32m  const getUserInitials = () => {[m
[32m+[m[32m    if (profile?.display_name) {[m
[32m+[m[32m      return profile.display_name.charAt(0).toUpperCase()[m
[32m+[m[32m    }[m
[32m+[m[32m    if (user?.email) {[m
[32m+[m[32m      return user.email.charAt(0).toUpperCase()[m
[32m+[m[32m    }[m
[32m+[m[32m    return 'U'[m
   }[m
 [m
   return ([m
[31m-    <div className="au-layout">[m
[31m-      <aside className="au-side">[m
[31m-        <div className="au-side__top">[m
[31m-          <div className="au-brand">[m
[31m-            <div className="au-brand__mark">[m
[31m-  <img src={mark} alt="" className="au-brand__markImg" draggable={false} />[m
[31m-</div>[m
[31m-[m
[31m-            <div className="au-brand__text">[m
[31m-              <div className="au-brand__title">D MOTION</div>[m
[31m-              <div className="au-brand__sub">Панель автора</div>[m
[31m-            </div>[m
[32m+[m[32m    <>[m
[32m+[m[32m      <header className="dm-splash-header">[m
[32m+[m[32m        <div className="dm-splash-header-content">[m
[32m+[m[32m          <div className="dm-splash-header-left">[m
[32m+[m[32m            <Link to="/" className="dm-splash-header-logo-link">[m
[32m+[m[32m              <img[m
[32m+[m[32m                src={LogoFiol}[m
[32m+[m[32m                alt="D MOTION"[m
[32m+[m[32m                className="dm-splash-header-logo"[m
[32m+[m[32m              />[m
[32m+[m[32m            </Link>[m
           </div>[m
[31m-[m
[31m-          <div className="au-side__quick">[m
[31m-            <Link className="au-ghostLink" to="/bazar" title="Открыть BAZAR">[m
[31m-              BAZAR <Dot />[m
[32m+[m[32m          <div className="dm-splash-header-right">[m
[32m+[m[32m            <Link to="/bazar" className="dm-splash-header-btn">[m
[32m+[m[32m              БАЗАР[m
             </Link>[m
[31m-            <Link className="au-ghostLink" to="/editor" title="Вернуться в редактор">[m
[31m-              Редактор <Dot />[m
[32m+[m[32m            <Link to="/pricing" className="dm-splash-header-btn">[m
[32m+[m[32m              ТАРИФЫ[m
             </Link>[m
[31m-          </div>[m
[31m-        </div>[m
[31m-[m
[31m-        <nav className="au-nav">[m
[31m-          {nav.map((it) => ([m
[31m-            <Link[m
[31m-              key={it.path}[m
[31m-              to={it.path}[m
[31m-              className={`au-navItem ${isActive(it.path) ? "is-active" : ""}`}[m
[31m-              title={it.label}[m
[31m-            >[m
[31m-              <span className="au-navItem__icon">{it.icon}</span>[m
[31m-              <span className="au-navItem__label">{it.label}</span>[m
[31m-              <span className="au-navItem__chev" aria-hidden="true">[m
[31m-                ›[m
[31m-              </span>[m
[32m+[m[32m            <Link to="#lessons" className="dm-splash-header-btn">[m
[32m+[m[32m              УРОКИ[m
             </Link>[m
[31m-          ))}[m
[31m-        </nav>[m
[31m-[m
[31m-        <div className="au-side__bottom">[m
[31m-          <Link className="au-navItem" to="/author/collections" state={{ reset: true }} title="Назад к коллекциям">[m
[31m-            <span className="au-navItem__icon" aria-hidden="true">←</span>[m
[31m-            <span className="au-navItem__label">Назад к коллекциям</span>[m
[31m-          </Link>[m
[31m-          <button[m
[31m-            className="au-navItem au-navItem--logout"[m
[31m-            onClick={handleLogout}[m
[31m-            title="Выйти из аккаунта"[m
[31m-          >[m
[31m-            <span className="au-navItem__icon">[m
[31m-              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">[m
[31m-                <path[m
[31m-                  fill="currentColor"[m
[31m-                  d="M16 17v-3H9v-4h7V7l5 5-5 5zM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z"[m
[31m-                />[m
[31m-              </svg>[m
[31m-            </span>[m
[31m-            <span className="au-navItem__label">Выйти</span>[m
[31m-          </button>[m
[32m+[m[32m            <div[m[41m [m
[32m+[m[32m              className={`dm-splash-header-downloads ${showDownloadsMenu ? 'dm-splash-header-downloads-open' : ''}`}[m
[32m+[m[32m              ref={downloadsMenuRef}[m
[32m+[m[32m              onMouseEnter={() => setShowDownloadsMenu(true)}[m
[32m+[m[32m              onMouseLeave={() => setShowDownloadsMenu(false)}[m
[32m+[m[32m            >[m
[32m+[m[32m              <button[m
[32m+[m[32m                className="dm-splash-header-btn"[m
[32m+[m[32m                onClick={() => setShowDownloadsMenu(!showDownloadsMenu)}[m
[32m+[m[32m              >[m
[32m+[m[32m                ЗАГРУЗКИ[m
[32m+[m[32m                <span className="dm-splash-header-arrow">▼</span>[m
[32m+[m[32m              </button>[m
[32m+[m[32m              {showDownloadsMenu && ([m
[32m+[m[32m                <div className="dm-splash-header-downloads-menu">[m
[32m+[m[32m                  <a[m
[32m+[m[32m                    href="#android"[m
[32m+[m[32m                    className="dm-splash-header-downloads-item"[m
[32m+[m[32m                    onClick={() => setShowDownloadsMenu(false)}[m
[32m+[m[32m                  >[m
[32m+[m[32m                    <svg className="dm-splash-header-downloads-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">[m
[32m+[m[32m                      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7C22 8.67 21.33 8 20.5 8z" fill="#3DDC84"/>[m
[32m+[m[32m                      <path d="M14.04 10l-1.79-3.11c-.12-.21-.37-.33-.61-.33h-1.28c-.24 0-.49.12-.61.33L8.96 10H14.04z" fill="#3DDC84"/>[m
[32m+[m[32m                      <circle cx="9" cy="13" r="1" fill="#3DDC84"/>[m
[32m+[m[32m                      <circle cx="15" cy="13" r="1" fill="#3DDC84"/>[m
[32m+[m[32m                    </svg>[m
[32m+[m[32m                    <span>Android</span>[m
[32m+[m[32m                  </a>[m
[32m+[m[32m                  <a[m
[32m+[m[32m                    href="#ios"[m
[32m+[m[32m                    className="dm-splash-header-downloads-item"[m
[32m+[m[32m                    onClick={() => setShowDownloadsMenu(fals