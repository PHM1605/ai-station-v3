package database

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func Connect() *mongo.Client {
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("Warning: unable to find .env file")
	}
	MongoDbUri := os.Getenv("MONGODB_URI")
	if MongoDbUri == "" {
		log.Fatal("MONGODB_URI not set!")
	}

	clientOptions := options.Client().ApplyURI(MongoDbUri)
	client, err := mongo.Connect(clientOptions)
	if err != nil {
		return nil
	}
	return client
}

func OpenCollection(collectionName string, client *mongo.Client) *mongo.Collection {
	// read DB name from .env
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("Warning: unable to find .env file")
	}

	databaseName := os.Getenv("DATABASE_NAME")
	fmt.Println("DATABASE_NAME: ", databaseName)

	collection := client.Database(databaseName).Collection(collectionName)
	if collection == nil {
		return nil
	}
	// all good
	return collection
}
