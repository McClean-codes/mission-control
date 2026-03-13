CREATE TABLE task_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_images_task_id ON task_images(task_id);

ALTER TABLE task_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_images_read" ON task_images FOR SELECT USING (true);
CREATE POLICY "task_images_insert" ON task_images FOR INSERT WITH CHECK (true);
CREATE POLICY "task_images_delete" ON task_images FOR DELETE USING (true);
