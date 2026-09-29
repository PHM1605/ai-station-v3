package controllers

import (
	"context"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
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
		if err := os.MkdirAll(datasetDirectory, 0755); err != nil {
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
		videoDocuments := make([]interface{}, 0, len(videoFiles))
		for _, videoFile := range videoFiles {
			videoId := bson.NewObjectID().Hex()
			extension := strings.ToLower(filepath.Ext(videoFile.Filename))
			storedName := videoId + extension
			storedPath := filepath.Join(datasetDirectory, storedName)
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

			videoDocuments = append(videoDocuments, models.DatasetVideo{
				VideoID:      videoId,
				DatasetID:    datasetId,
				ProjectID:    projectId,
				OwnerID:      userId,
				OriginalName: videoFile.Filename,
				StoredName:   storedName,
				Duration:     duration,
				FrameCount:   0,
			})
		}

		// Report all invalid videos
		if len(invalidVideos) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":          "Some videos are invalid",
				"invalid_videos": invalidVideos,
			})
			return
		}

		// Add Videos metadata
		var videoCollection *mongo.Collection = database.OpenCollection("dataset_videos", client)
		_, err = videoCollection.InsertMany(ctx, videoDocuments)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save video information"})
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
			FrameCount: 0,
			Status:     "UPLOADED",
			CreatedAt:  now,
			UpdatedAt:  now,
		}
		var datasetCollection *mongo.Collection = database.OpenCollection("datasets", client)
		_, err = datasetCollection.InsertOne(ctx, dataset)
		if err != nil {
			// Remove Videos DB if Dataset insertion fails
			_, _ = videoCollection.DeleteMany(c, bson.M{"dataset_id": datasetId})
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Dataset"})
			return
		}
		uploadSucceeded = true
		c.JSON(http.StatusCreated, dataset)
	}
}
