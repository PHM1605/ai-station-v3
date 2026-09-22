package routes

import (
	controller "github.com/PHM1605/ai-station-v3/server/controllers"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func SetupUnprotectedRoutes(router *gin.Engine, client *mongo.Client) {
	router.POST("/refresh", controller.RefreshTokenHandler(client))
}
