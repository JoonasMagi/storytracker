-- Lisa deleted_at väli stories tabelisse (soft-delete)
ALTER TABLE stories ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;

-- Lisa version väli stories tabelisse (versioonihaldus)
ALTER TABLE stories ADD COLUMN version INT DEFAULT 1;

-- Loo story_history tabel muudatuste ajaloo jaoks
CREATE TABLE IF NOT EXISTS story_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    title TEXT,
    description TEXT,
    version INT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255),
    FOREIGN KEY (story_id) REFERENCES stories(id)
);
