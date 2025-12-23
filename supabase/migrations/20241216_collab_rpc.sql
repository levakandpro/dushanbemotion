-- =====================================================
-- RPC ФУНКЦИИ ДЛЯ КОЛЛАБОВ С ЛОГИРОВАНИЕМ В HISTORY
-- =====================================================

-- -----------------------------
-- accept_collab - подтверждение участия
-- -----------------------------
CREATE OR REPLACE FUNCTION accept_collab(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  -- Получаем коллаб
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.status != 'pending' THEN
    RAISE EXCEPTION 'Коллаб не в статусе ожидания';
  END IF;
  
  -- Проверяем что пользователь - участник
  IF v_user_id != v_collab.author1_id AND v_user_id != v_collab.author2_id THEN
    RAISE EXCEPTION 'Вы не участник этого коллаба';
  END IF;
  
  -- Обновляем подтверждение
  IF v_user_id = v_collab.author1_id THEN
    UPDATE collabs SET author1_confirmed = true WHERE id = p_collab_id;
  ELSE
    UPDATE collabs SET author2_confirmed = true WHERE id = p_collab_id;
  END IF;
  
  -- Проверяем, оба ли подтвердили
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF v_collab.author1_confirmed AND v_collab.author2_confirmed THEN
    UPDATE collabs 
    SET status = 'active', confirmed_at = now() 
    WHERE id = p_collab_id;
  END IF;
  
  -- Логируем в историю
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'collab_confirmed', '{}'::jsonb);
END;
$$;

-- -----------------------------
-- pause_collab - пауза
-- -----------------------------
CREATE OR REPLACE FUNCTION pause_collab(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.status != 'active' THEN
    RAISE EXCEPTION 'Можно поставить на паузу только активный коллаб';
  END IF;
  
  IF v_user_id != v_collab.author1_id AND v_user_id != v_collab.author2_id THEN
    RAISE EXCEPTION 'Вы не участник этого коллаба';
  END IF;
  
  UPDATE collabs 
  SET status = 'paused', paused_by = v_user_id 
  WHERE id = p_collab_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'collab_paused', '{}'::jsonb);
END;
$$;

-- -----------------------------
-- resume_collab - снятие с паузы
-- -----------------------------
CREATE OR REPLACE FUNCTION resume_collab(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.status != 'paused' THEN
    RAISE EXCEPTION 'Коллаб не на паузе';
  END IF;
  
  IF v_collab.paused_by != v_user_id THEN
    RAISE EXCEPTION 'Снять с паузы может только тот, кто поставил';
  END IF;
  
  UPDATE collabs 
  SET status = 'active', paused_by = null 
  WHERE id = p_collab_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'collab_resumed', '{}'::jsonb);
END;
$$;

-- -----------------------------
-- request_delete_collab - запрос удаления
-- -----------------------------
CREATE OR REPLACE FUNCTION request_delete_collab(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.status IN ('archived', 'delete_requested') THEN
    RAISE EXCEPTION 'Коллаб уже в процессе удаления или архивирован';
  END IF;
  
  IF v_user_id != v_collab.author1_id AND v_user_id != v_collab.author2_id THEN
    RAISE EXCEPTION 'Вы не участник этого коллаба';
  END IF;
  
  UPDATE collabs 
  SET status = 'delete_requested', delete_requested_by = v_user_id 
  WHERE id = p_collab_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'delete_requested', '{}'::jsonb);
END;
$$;

-- -----------------------------
-- confirm_delete_collab - подтверждение удаления
-- -----------------------------
CREATE OR REPLACE FUNCTION confirm_delete_collab(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.status != 'delete_requested' THEN
    RAISE EXCEPTION 'Нет запроса на удаление';
  END IF;
  
  IF v_collab.delete_requested_by = v_user_id THEN
    RAISE EXCEPTION 'Вы уже запросили удаление, ждите подтверждения партнёра';
  END IF;
  
  IF v_user_id != v_collab.author1_id AND v_user_id != v_collab.author2_id THEN
    RAISE EXCEPTION 'Вы не участник этого коллаба';
  END IF;
  
  UPDATE collabs 
  SET status = 'archived', archived_at = now() 
  WHERE id = p_collab_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'delete_confirmed', '{}'::jsonb);
END;
$$;

-- -----------------------------
-- cancel_delete_collab - отмена запроса удаления
-- -----------------------------
CREATE OR REPLACE FUNCTION cancel_delete_collab(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.status != 'delete_requested' THEN
    RAISE EXCEPTION 'Нет запроса на удаление';
  END IF;
  
  IF v_collab.delete_requested_by != v_user_id THEN
    RAISE EXCEPTION 'Отменить запрос может только тот, кто его создал';
  END IF;
  
  UPDATE collabs 
  SET status = 'active', delete_requested_by = null 
  WHERE id = p_collab_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'delete_request_canceled', '{}'::jsonb);
END;
$$;

-- -----------------------------
-- request_share_change - запрос изменения долей
-- -----------------------------
CREATE OR REPLACE FUNCTION request_share_change(
  p_collab_id UUID,
  p_new_author1_share DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
  v_new_author2_share DECIMAL;
BEGIN
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.status != 'active' THEN
    RAISE EXCEPTION 'Изменить проценты можно только в активном коллабе';
  END IF;
  
  IF v_user_id != v_collab.author1_id AND v_user_id != v_collab.author2_id THEN
    RAISE EXCEPTION 'Вы не участник этого коллаба';
  END IF;
  
  v_new_author2_share := 100 - p_new_author1_share;
  
  UPDATE collabs 
  SET 
    pending_author1_share = p_new_author1_share,
    pending_author2_share = v_new_author2_share,
    share_change_requested_by = v_user_id
  WHERE id = p_collab_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'share_change_requested', 
    jsonb_build_object('new_author1_share', p_new_author1_share, 'new_author2_share', v_new_author2_share));
END;
$$;

-- -----------------------------
-- confirm_share_change - подтверждение изменения долей
-- -----------------------------
CREATE OR REPLACE FUNCTION confirm_share_change(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.pending_author1_share IS NULL OR v_collab.share_change_requested_by IS NULL THEN
    RAISE EXCEPTION 'Нет запроса на изменение процентов';
  END IF;
  
  IF v_collab.share_change_requested_by = v_user_id THEN
    RAISE EXCEPTION 'Вы уже запросили изменение, ждите подтверждения партнёра';
  END IF;
  
  IF v_user_id != v_collab.author1_id AND v_user_id != v_collab.author2_id THEN
    RAISE EXCEPTION 'Вы не участник этого коллаба';
  END IF;
  
  UPDATE collabs 
  SET 
    author1_share = pending_author1_share,
    author2_share = pending_author2_share,
    pending_author1_share = null,
    pending_author2_share = null,
    share_change_requested_by = null
  WHERE id = p_collab_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'share_change_confirmed', 
    jsonb_build_object('new_author1_share', v_collab.pending_author1_share, 'new_author2_share', v_collab.pending_author2_share));
END;
$$;

-- -----------------------------
-- reject_share_change - отклонение изменения долей
-- -----------------------------
CREATE OR REPLACE FUNCTION reject_share_change(p_collab_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collab RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_collab FROM collabs WHERE id = p_collab_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Коллаб не найден';
  END IF;
  
  IF v_collab.share_change_requested_by IS NULL THEN
    RAISE EXCEPTION 'Нет запроса на изменение процентов';
  END IF;
  
  IF v_user_id != v_collab.author1_id AND v_user_id != v_collab.author2_id THEN
    RAISE EXCEPTION 'Вы не участник этого коллаба';
  END IF;
  
  UPDATE collabs 
  SET 
    pending_author1_share = null,
    pending_author2_share = null,
    share_change_requested_by = null
  WHERE id = p_collab_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (p_collab_id, v_user_id, 'share_change_rejected', '{}'::jsonb);
END;
$$;

-- -----------------------------
-- approve_material - подтверждение материала
-- -----------------------------
CREATE OR REPLACE FUNCTION approve_material(p_material_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_material RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_material FROM collab_materials WHERE id = p_material_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Материал не найден';
  END IF;
  
  IF v_material.pending_approval_from != v_user_id THEN
    RAISE EXCEPTION 'Вы не можете подтвердить этот материал';
  END IF;
  
  UPDATE collab_materials 
  SET 
    status = 'approved',
    pending_approval_from = null,
    approved_at = now()
  WHERE id = p_material_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (v_material.collab_id, v_user_id, 'material_approved', 
    jsonb_build_object('material_id', p_material_id, 'title', v_material.title));
END;
$$;

-- -----------------------------
-- reject_material - отклонение материала
-- -----------------------------
CREATE OR REPLACE FUNCTION reject_material(p_material_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_material RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_material FROM collab_materials WHERE id = p_material_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Материал не найден';
  END IF;
  
  IF v_material.pending_approval_from != v_user_id THEN
    RAISE EXCEPTION 'Вы не можете отклонить этот материал';
  END IF;
  
  UPDATE collab_materials 
  SET 
    status = 'rejected',
    pending_approval_from = null,
    rejection_reason = p_reason,
    rejected_at = now()
  WHERE id = p_material_id;
  
  INSERT INTO collab_history (collab_id, actor_id, action_type, details)
  VALUES (v_material.collab_id, v_user_id, 'material_rejected', 
    jsonb_build_object('material_id', p_material_id, 'title', v_material.title, 'reason', p_reason));
END;
$$;

-- -----------------------------
-- GRANTS
-- -----------------------------
GRANT EXECUTE ON FUNCTION accept_collab(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION pause_collab(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION resume_collab(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION request_delete_collab(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_delete_collab(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_delete_collab(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION request_share_change(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_share_change(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_share_change(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_material(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_material(UUID, TEXT) TO authenticated;
