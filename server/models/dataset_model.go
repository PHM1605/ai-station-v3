package models

import "time"

type Dataset struct {
	DatasetID  string    `json:"dataset_id" bson:"dataset_id"`
	ProjectID  string    `json:"project_id" bson:"project_id"`
	OwnerID    string    `json:"owner_id" bson:"owner_id"`
	Name       string    `json:"name" bson:"name"`
	VideoCount int       `json:"video_count" bson:"video_count"`
	FrameCount int       `json:"frame_count" bson:"frame_count"`
	Status     string    `json:"status" bson:"status"`
	CreatedAt  time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" bson:"updated_at"`
}

type VideoFrame struct {
	FrameID     string  `json:"frame_id" bson:"frame_id"`
	VideoID     string  `json:"video_id" bson:"video_id"`
	DatasetID   string  `json:"dataset_id" bson:"dataset_id"`
	ProjectID   string  `json:"project_id" bson:"project_id"`
	OwnerID     string  `json:"owner_id" bson:"owner_id"`
	FrameNumber int     `json:"frame_number" bson:"frame_number"`
	Timestamp   float64 `json:"timestamp" bson:"timestamp"`
	ImagePath   string  `json:"-" bson:"image_path"`
	ImageURL    string  `json:"image_url" bson:"-"`
}

type DatasetVideo struct {
	VideoID      string  `json:"video_id" bson:"video_id"`
	DatasetID    string  `json:"dataset_id" bson:"dataset_id"`
	ProjectID    string  `json:"project_id" bson:"project_id"`
	OwnerID      string  `json:"owner_id" bson:"owner_id"`
	OriginalName string  `json:"original_name" bson:"original_name"`
	StoredName   string  `json:"stored_name" bson:"stored_name"`
	VideoPath    string  `json:"-" bson:"video_path"`
	Duration     float64 `json:"duration" bson:"duration"`
	FrameCount   int     `json:"frame_count" bson:"frame_count"`
}
