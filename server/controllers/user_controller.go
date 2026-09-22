package controllers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/PHM1605/ai-station-v3/server/models"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func RegisterUser(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parsing User model from Request
		var user models.User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data"})
			return
		}
		// User info from Request is parsed well; now check the `validate:"required,xxx"` tag
		validate := validator.New()
		if err := validate.Struct(user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
			return
		}
		// User info from Request good; now we hash password

	}
}

func RefreshTokenHander(client *mongo.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set timeout for Request
		var ctx, cancel = context.WithTimeout(c, 100*time.Second)
		defer cancel()

		refreshToken, err := c.Cookie("refresh_token")
		if err != nil {
			fmt.Println("error", err.Error())
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unable to return Refresh Token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Tokens refreshed"})
	}
}
