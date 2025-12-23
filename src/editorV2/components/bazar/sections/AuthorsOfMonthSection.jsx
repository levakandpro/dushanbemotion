import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../BazarUI.css";
import { SubscribeButton } from "../../../../components/ui/SubscribeButton";
import { OnlineStatus } from "../../../../components/ui/OnlineStatus";
import "../../../../components/ui/SubscribeButton.css";
import "../../../../components/ui/OnlineStatus.css";

export default function AuthorsOfMonthSection({ authors = [] }) {
  const navigate = useNavigate();
  const [subscribed, setSubscribed] = useState({});

  if (!authors || authors.length === 0) return null;

  // Сортируем по количеству подписчиков (убывание)
  const sortedAuthors = [...authors].sort((a, b) => (b.subscribers_count || 0) - (a.subscribers_count || 0));

  const handleAuthorClick = (username) => {
    if (username) {
      navigate(`/u/${username}`);
    }
  };

  const handleSubscribe = async (authorId) => {
    setSubscribed(prev => ({ ...prev, [authorId]: !prev[authorId] }));
  };

  return (
    <div className="bz-authors-month">
      {sortedAuthors.map((author, index) => (
        <div 
          key={author.id} 
          className="bz-author-month"
          onClick={() => handleAuthorClick(author.username)}
        >
          <div className="bz-author-month__rank">{index + 1}</div>
          <div className="bz-author-month__avatar-wrap">
            <div className="bz-author-month__avatar">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt="" />
              ) : (
                <div className="bz-author-month__placeholder">
                  {(author.display_name || 'A')[0].toUpperCase()}
                </div>
              )}
            </div>
            <OnlineStatus isOnline={author.is_online} size="small" />
          </div>
          <div className="bz-author-month__name">
            {author.display_name || author.username || 'Автор'}
          </div>
          <div className="bz-author-month__subs">
            {author.subscribers_count || 0} подписчиков
          </div>
          <SubscribeButton 
            isSubscribed={subscribed[author.id]} 
            onSubscribe={() => handleSubscribe(author.id)}
            size="small"
            showText={false}
          />
        </div>
      ))}
    </div>
  );
}
