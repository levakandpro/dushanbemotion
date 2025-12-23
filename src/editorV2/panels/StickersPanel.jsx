import StickersPanelClient from '../../stickers/client/StickersPanel';

export default function StickersPanel({ project, onChangeProject, gridColumns, onGridColumnsChange }) {
  return (
    <StickersPanelClient 
      project={project}
      onChangeProject={onChangeProject}
      gridColumns={gridColumns}
      onGridColumnsChange={onGridColumnsChange}
    />
  );
}
