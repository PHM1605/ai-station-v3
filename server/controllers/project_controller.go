package controllers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/PHM1605/ai-station-v3/server/database"
	"github.com/PHM1605/ai-station-v3/server/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetProjects(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("userId") // get from "auth_middleware.go"
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}
		// Set Timeout for Request
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()
		// fetch from DB
		var projectCollection *mongo.Collection = database.OpenCollection("projects", client)
		cursor, err := projectCollection.Find(
			ctx,
			bson.M{"owner_id": userID},
			options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve projects"})
			return
		}
		defer cursor.Close(ctx)
		// Parse Projects from Cursor
		var projects = make([]models.Project, 0)
		if err := cursor.All(ctx, &projects); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse projects"})
			return
		}
		// all good
		c.JSON(http.StatusOK, gin.H{"projects": projects})
	}
}

func CreateProject(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("userId") // get from "auth_middleware.go"
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		// Parsing Project info from Request
		var projectRequest models.CreateProjectRequest
		if err := c.ShouldBindJSON(&projectRequest); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data"})
			return
		}
		// Validate Project info
		projectRequest.Name = strings.TrimSpace(projectRequest.Name)
		if projectRequest.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Project name is required"})
			return
		}
		if projectRequest.Type != "OBJECT_DETECTION" && projectRequest.Type != "SEGMENTATION" && projectRequest.Type != "CLASSIFICATION" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project type"})
			return
		}
		// Setup Timeout for Request
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()
		// Finish the entry of Project to be added to DB
		var project models.Project
		project.ProjectID = bson.NewObjectID().Hex()
		project.OwnerID = userID
		project.Name = projectRequest.Name
		project.Type = projectRequest.Type
		project.CreatedAt = time.Now()
		project.UpdatedAt = time.Now()
		// Add to DB
		var projectCollection *mongo.Collection = database.OpenCollection("projects", client)
		_, err := projectCollection.InsertOne(ctx, project)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
			return
		}
		// all good
		c.JSON(http.StatusCreated, project)
	}
}

func DeleteProject(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		projectId := c.Param("projectId")
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()

		var projectCollection *mongo.Collection = database.OpenCollection("projects", client)
		result, err := projectCollection.DeleteOne(
			ctx,
			bson.M{"project_id": projectId, "owner_id": userId},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
			return
		}
		if result.DeletedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
	}
}
