package utils

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type SignedDetails struct {
	Email     string
	FirstName string
	LastName  string
	Role      string
	UserId    string
	jwt.RegisteredClaims
}

var SECRET_ACCESS_KEY string = os.Getenv("SECRET_ACCESS_KEY")
var SECRET_REFRESH_KEY string = os.Getenv("SECRET_REFRESH_KEY")

func GetRoleFromContext(c *gin.Context) (string, error) {
	role, exists := c.Get("role")

}
