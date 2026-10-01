package controllers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/PHM1605/ai-station-v3/server/database"
	"github.com/PHM1605/ai-station-v3/server/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func getVideoDuration(ctx context.Context, videoPath string) (float64, error) {
	output, err := exec.CommandContext(ctx, "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", videoPath).Output()
	if err != nil {
		return 0, err
	}

	duration, err := strconv.ParseFloat(strings.TrimSpace(string(output)), 64)
	if err != nil {
		return 0, err
	}

	// all good
	return duration, nil
}

func GetDatasets(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		projectId := c.Param("projectId")
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()

		// Make sure this Project belongs to this User
		var project models.Project
		var projectCollection *mongo.Collection = database.OpenCollection("projects", client)
		err := projectCollection.FindOne(ctx, bson.M{
			"project_id": projectId,
			"owner_id":   userId,
		}).Decode(&project)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve project"})
			return
		}

		// Get Datasets in this Project
		var datasets = make([]models.Dataset, 0)
		var datasetCollection *mongo.Collection = database.OpenCollection("datasets", client)
		cursor, err := datasetCollection.Find(
			ctx,
			bson.M{"project_id": projectId, "owner_id": userId},
			options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve datasets"})
			return
		}
		defer cursor.Close(ctx)
		if err := cursor.All(ctx, &datasets); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse datasets"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"datasets": datasets})
	}
}

func CreateDataset(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		projectId := c.Param("projectId")
		datasetName := strings.TrimSpace(c.PostForm("name"))
		if datasetName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dataset name is required"})
			return
		}

		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid upload form"})
			return
		}
		videoFiles := form.File["videos"]
		if len(videoFiles) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "At least one Video is required"})
			return
		}

		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()

		// Verify that the User is owning this Project
		var project models.Project
		var projectCollection *mongo.Collection = database.OpenCollection("projects", client)
		err = projectCollection.FindOne(ctx, bson.M{"project_id": projectId, "owner_id": userId}).Decode(&project)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve Project"})
			return
		}

		// Create new Dataset
		datasetId := bson.NewObjectID().Hex()
		datasetDirectory := filepath.Join("uploads", userId, projectId, datasetId)
		datasetVideosDirectory := filepath.Join(datasetDirectory, "videos")
		datasetFramesDirectory := filepath.Join(datasetDirectory, "frames")
		if err := os.MkdirAll(datasetVideosDirectory, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create dataset folder"})
			return
		}
		// Remove this incomplete Dataset if error occurs
		uploadSucceeded := false
		defer func() {
			if !uploadSucceeded {
				_ = os.RemoveAll(datasetDirectory)
			}
		}()

		invalidVideos := make([]gin.H, 0)
		datasetVideos := make([]models.DatasetVideo, 0, len(videoFiles))
		for _, videoFile := range videoFiles {
			videoId := bson.NewObjectID().Hex()
			extension := strings.ToLower(filepath.Ext(videoFile.Filename))
			storedName := videoId + extension
			storedPath := filepath.Join(datasetVideosDirectory, storedName)
			// Store video at location
			if err := c.SaveUploadedFile(videoFile, storedPath); err != nil {
				invalidVideos = append(invalidVideos, gin.H{
					"name":  videoFile.Filename,
					"error": "Unable to save Video",
				})
				continue
			}

			duration, err := getVideoDuration(ctx, storedPath)
			if err != nil {
				invalidVideos = append(invalidVideos, gin.H{
					"name":  videoFile.Filename,
					"error": "Invalid video file",
				})
				continue
			}

			if duration > 31 {
				invalidVideos = append(invalidVideos, gin.H{
					"name":     videoFile.Filename,
					"duration": duration,
					"error":    "Video is longer than 31 seconds",
				})
				continue
			}

			datasetVideo := models.DatasetVideo{
				VideoID:      videoId,
				DatasetID:    datasetId,
				ProjectID:    projectId,
				OwnerID:      userId,
				OriginalName: videoFile.Filename,
				StoredName:   storedName,
				VideoPath:    storedPath,
				Duration:     duration,
				FrameCount:   0,
			}
			datasetVideos = append(datasetVideos, datasetVideo)
		}

		// Report all invalid videos
		if len(invalidVideos) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":          "Some videos are invalid",
				"invalid_videos": invalidVideos,
			})
			return
		}

		frameDocuments := make([]interface{}, 0) // accumulate Frames from all Videos in Dataset
		totalFrameCount := 0                     // Number of frames from all videos in Dataset
		for index := range datasetVideos {
			video := &datasetVideos[index]
			frames, err := extractVideoFrames(ctx, *video, datasetFramesDirectory)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to extract frames from %s", video.OriginalName)})
				return
			}
			video.FrameCount = len(frames)
			totalFrameCount += len(frames)
			for _, frame := range frames {
				frameDocuments = append(frameDocuments, frame)
			}
		}

		// Add Videos metadata
		var videoCollection *mongo.Collection = database.OpenCollection("dataset_videos", client)
		_, err = videoCollection.InsertMany(ctx, datasetVideos)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save video information"})
			return
		}

		// Add Frames metadata
		var frameCollection *mongo.Collection = database.OpenCollection("video_frames", client)
		_, err = frameCollection.InsertMany(ctx, frameDocuments)
		if err != nil {
			// if insert Frames fails => delete Video of those Frames too
			_, _ = videoCollection.DeleteMany(ctx, bson.M{"dataset_id": datasetId})
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save frame information"})
			return
		}

		// Add Dataset
		now := time.Now()
		dataset := models.Dataset{
			DatasetID:  datasetId,
			ProjectID:  projectId,
			OwnerID:    userId,
			Name:       datasetName,
			VideoCount: len(videoFiles),
			FrameCount: totalFrameCount,
			Status:     "READY",
			CreatedAt:  now,
			UpdatedAt:  now,
		}
		var datasetCollection *mongo.Collection = database.OpenCollection("datasets", client)
		_, err = datasetCollection.InsertOne(ctx, dataset)
		if err != nil {
			// Remove BOTH Videos and Frames in DB if Dataset insertion fails
			_, _ = videoCollection.DeleteMany(ctx, bson.M{"dataset_id": datasetId})
			_, _ = frameCollection.DeleteMany(ctx, bson.M{"dataset_id": datasetId})
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Dataset"})
			return
		}
		uploadSucceeded = true
		c.JSON(http.StatusCreated, dataset)
	}
}

func DeleteDataset(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		projectId := c.Param("projectId")
		datasetId := c.Param("datasetId")
		// Set Timeout for Request
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()

		var datasetCollection *mongo.Collection = database.OpenCollection("datasets", client)
		// Verify Dataset Ownership
		var dataset models.Dataset
		err := datasetCollection.FindOne(ctx, bson.M{"dataset_id": datasetId, "project_id": projectId, "owner_id": userId}).Decode(&dataset)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dataset not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve dataset"})
			return
		}
		// Delete Frame metadata
		var frameCollection *mongo.Collection = database.OpenCollection("video_frames", client)
		_, err = frameCollection.DeleteMany(ctx, bson.M{"dataset_id": datasetId, "owner_id": userId})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete dataset frames"})
			return
		}
		// Delete video metadata
		var videoCollection *mongo.Collection = database.OpenCollection("dataset_videos", client)
		_, err = videoCollection.DeleteMany(ctx, bson.M{"dataset_id": datasetId, "owner_id": userId})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete dataset videos"})
			return
		}
		// Delete Dataset metadata
		result, err := datasetCollection.DeleteOne(ctx, bson.M{"dataset_id": datasetId, "project_id": projectId, "owner_id": userId})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete Dataset"})
			return
		}
		if result.DeletedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dataset not found"})
			return
		}
		// Delete the data itself in Storage
		datasetDirectory := filepath.Join("uploads", userId, projectId, datasetId)
		if err := os.RemoveAll(datasetDirectory); err != nil {
			// DB clean, only trash storage, so we don't tell FE that DB has problems
			fmt.Println("Failed to remove dataset directory: ", err)
		}
		c.JSON(http.StatusOK, gin.H{"message": "Dataset deleted successfully"})
	}
}

const annotationFramesPerSecond = 1.0

func extractVideoFrames(ctx context.Context, video models.DatasetVideo, framesDirectory string) ([]models.VideoFrame, error) {
	videoFramesDirectory := filepath.Join(framesDirectory, video.VideoID)
	if err := os.MkdirAll(videoFramesDirectory, 0755); err != nil {
		return nil, err
	}
	// Extract Frame Images from video path ("output" here is metadata only)
	outputPattern := filepath.Join(videoFramesDirectory, "%06d.jpg")
	output, err := exec.CommandContext(
		ctx,
		"ffmpeg",
		"-y",
		"-hide_banner",
		"-loglevel",
		"error",
		"-i",
		video.VideoPath,
		"-vf",
		fmt.Sprintf("fps=%g", annotationFramesPerSecond),
		"-q:v",
		"2",
		outputPattern,
	).CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("ffmpeg failed: %s", strings.TrimSpace(string(output)))
	}

	// Get *.jpg paths in that folder
	framePaths, err := filepath.Glob(filepath.Join(videoFramesDirectory, "*.jpg"))
	if err != nil {
		return nil, err
	}
	sort.Strings(framePaths)
	if len(framePaths) == 0 {
		return nil, fmt.Errorf("no frames were extracted")
	}

	// Parse Frames Metadata
	frames := make([]models.VideoFrame, 0, len(framePaths))
	for index, framePath := range framePaths {
		frames = append(frames, models.VideoFrame{
			FrameID:     bson.NewObjectID().Hex(),
			VideoID:     video.VideoID,
			DatasetID:   video.DatasetID,
			ProjectID:   video.ProjectID,
			OwnerID:     video.OwnerID,
			FrameNumber: index + 1,
			Timestamp:   float64(index) / annotationFramesPerSecond, // seconds within Video
			ImagePath:   framePath,
		})
	}
	return frames, nil
}

func GetAllFrames(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		projectId := c.Param("projectId")
		// which page of Frames
		page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
		if err != nil || page < 1 {
			page = 1
		}
		// 1 page has e.g. 56 entries
		limit, err := strconv.Atoi(c.DefaultQuery("limit", "56"))
		if err != nil || limit < 1 || limit > 100 {
			limit = 56
		}
		// Set request Timeout
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()
		// Get Frames from DB
		frames := make([]models.VideoFrame, 0)
		var frameCollection *mongo.Collection = database.OpenCollection("video_frames", client)
		filter := bson.M{
			"project_id": projectId,
			"owner_id":   userId,
		}
		// Count how many Frames
		total, err := frameCollection.CountDocuments(ctx, filter)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count Frames"})
			return
		}
		// e.g. if we want Page 2 we skip the 1st 56 entries
		skip := int64((page - 1) * limit)
		cursor, err := frameCollection.Find(
			ctx,
			filter,
			options.Find().
				SetSort(bson.D{
					{Key: "dataset_id", Value: 1},
					{Key: "video_id", Value: 1},
					{Key: "frame_number", Value: 1}}).
				SetSkip(skip).
				SetLimit(int64(limit)),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve Frames"})
			return
		}
		defer cursor.Close(ctx)
		// Parsing Frames
		if err := cursor.All(ctx, &frames); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse Frames"})
			return
		}
		for index := range frames {
			frames[index].ImageURL = fmt.Sprintf("/frames/%s/image", frames[index].FrameID)
		}
		c.JSON(http.StatusOK, gin.H{"frames": frames, "page": page, "limit": limit, "total": total})
	}
}

func GetDatasetFrames(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		projectId := c.Param("projectId")
		datasetId := c.Param("datasetId")
		// which page of frames
		page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
		if err != nil || page < 1 {
			page = 1
		}
		// 1 page has 60 entries
		limit, err := strconv.Atoi(c.DefaultQuery("limit", "60"))
		if err != nil || limit < 1 || limit > 100 {
			limit = 60
		}
		// Set Timeout
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()
		// Confirm this Dataset belongs to logged-in User
		var dataset models.Dataset
		var datasetCollection *mongo.Collection = database.OpenCollection("datasets", client)
		err = datasetCollection.FindOne(ctx, bson.M{"dataset_id": datasetId, "project_id": projectId, "owner_id": userId}).Decode(&dataset)
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dataset not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve dataset"})
			return
		}
		// Get Frames from DB
		frames := make([]models.VideoFrame, 0)
		var frameCollection *mongo.Collection = database.OpenCollection("video_frames", client)
		filter := bson.M{
			"dataset_id": datasetId,
			"project_id": projectId,
			"owner_id":   userId,
		}
		total, err := frameCollection.CountDocuments(ctx, filter)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count frames"})
			return
		}
		// e.g. if we want Page 2 we skip the 1st 60 entries
		skip := int64((page - 1) * limit)
		cursor, err := frameCollection.Find(
			ctx,
			filter,
			options.Find().
				SetSort(bson.D{
					{Key: "video_id", Value: 1},
					{Key: "frame_number", Value: 1}}).
				SetSkip(skip).
				SetLimit(int64(limit)),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve frames"})
			return
		}
		defer cursor.Close(ctx)
		// Parsing Frames
		if err := cursor.All(ctx, &frames); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse frames"})
			return
		}
		for index := range frames {
			frames[index].ImageURL = fmt.Sprintf("/frames/%s/image", frames[index].FrameID) // to get Image: send GET request to /frames/<id>/image
		}

		c.JSON(http.StatusOK, gin.H{"frames": frames, "page": page, "limit": limit, "total": total})
	}
}

func GetFrameImage(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		frameId := c.Param("frameId")
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()

		var frame models.VideoFrame
		var frameCollection *mongo.Collection = database.OpenCollection("video_frames", client)
		err := frameCollection.FindOne(ctx, bson.M{"frame_id": frameId, "owner_id": userId}).Decode(&frame)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve frame"})
			return
		}
		c.File(frame.ImagePath)
	}
}
