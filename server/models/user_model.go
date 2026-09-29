package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type User struct {
	ID        bson.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"` // if this field isn't give => remove it (not auto to 00000) so that MongoDB generates a random ID for that
	UserID    string        `json:"user_id" bson:"user_id"`
	FirstName string        `json:"first_name" bson:"first_name" validate:"required,min=2,max=100"`
	LastName  string        `json:"last_name" bson:"last_name" validate:"required,min=2,max=100"`
	Email     string        `json:"email" bson:"email" validate:"required,email"`
	Password  string        `json:"password" bson:"password" validate:"required,min=6"`
	Role      string        `json:"role" bson:"role" validate:"oneof=ADMIN USER"`
	CreatedAt time.Time     `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time     `json:"updated_at" bson:"updated_at"`
}

type UserLogin struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type UserLogout struct {
	UserId string `json:"user_id"`
}

type UserResponse struct {
	UserID    string `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
}

type Project struct {
	ProjectID string    `json:"project_id" bson:"project_id"`
	OwnerID   string    `json:"owner_id" bson:"owner_id"`
	Name      string    `json:"name" bson:"name"`
	Type      string    `json:"type" bson:"type"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type CreateProjectRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
}
