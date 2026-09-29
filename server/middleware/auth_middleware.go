package middleware

import (
	"net/http"

	"github.com/PHM1605/ai-station-v3/server/utils"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Access Token raw string
		token, err := utils.GetAccessToken(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort() // NOTE: in Middleware we cancel latter Callback like this
			return
		}
		// Access Token is empty string
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
			c.Abort()
			return
		}
		// Validate Access Token; parse Token into Claims
		claims, err := utils.ValidateAccessToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}
		// Put info into Request's context
		c.Set("userId", claims.UserId)
		c.Set("role", claims.Role)
		// Continue to Handler after Middleware
		c.Next()
	}
}
