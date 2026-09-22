package middleware

import (
	"github.com/gin-gonic/gin"
)

type SignedDetails struct {
	Email
}

// Generate both Access Token and Refresh Token
func GenerateAllTokens(email, firstName, lastName, role, userId string) (string, string, error) {
	claims := &SignedDetails{}
}

func GetAccessToken(c *gin.Context) (string, error) {
	tokenString, err := c.Cookie("access_token")
	if err != nil {
		return "", err
	}
	// token good
	return tokenString, nil
}

func ValidateToken(tokenString string)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

	}
}
