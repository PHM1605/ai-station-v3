package routes

import (
	controller "github.com/PHM1605/ai-station-v3/server/controllers"
	"github.com/PHM1605/ai-station-v3/server/middleware"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func SetupProtectedRoutes(router *gin.Engine, client *mongo.Client) {
	// Verify User first
	router.Use(middleware.AuthMiddleware())

	router.GET("/auth/me", controller.GetCurrentUser(client))
	router.POST("/logout", controller.LogoutHandler(client))

	router.GET("/projects", controller.GetProjects(client))
	router.POST("/projects", controller.CreateProject(client))
	router.DELETE("/projects/:projectId", controller.DeleteProject(client))

	router.GET("/projects/:projectId/datasets", controller.GetDatasets(client))
	router.POST("/projects/:projectId/datasets", controller.CreateDataset(client))
	router.DELETE("/projects/:projectId/datasets/:datasetId", controller.DeleteDataset(client))

	router.GET("/projects/:projectId/frames", controller.GetAllFrames(client))
	router.GET("/projects/:projectId/datasets/:datasetId/frames", controller.GetDatasetFrames(client))
	router.GET("/frames/:frameId/image", controller.GetFrameImage(client))
	router.GET("/frames/:frameId/navigation", controller.GetFrameNavigationContext(client))
}
