CREATE TABLE IF NOT EXISTS video_subtitles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  videoUrl TEXT NOT NULL,
  subtitleUrl TEXT NOT NULL,
  videoTitle TEXT NOT NULL,
  subtitleContent TEXT
);