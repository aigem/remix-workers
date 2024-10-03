CREATE TABLE IF NOT EXISTS video_subtitles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  videoId TEXT NOT NULL,
  videoUrl TEXT NOT NULL,
  subtitleUrl TEXT NOT NULL,
  videoTitle TEXT NOT NULL,
  subtitleContent TEXT
);