package services

import (
	"chatgpt-clone/backend/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// CreateNewChat creates a new chat session for a user.
func CreateNewChat(userID primitive.ObjectID, title string) (*models.Chat, error) {
	newChat := models.Chat{
		ID:         primitive.NewObjectID(),
		UserID:     userID,
		Title:      title,
		CreatedAt:  primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:  primitive.NewDateTimeFromTime(time.Now()),
		IsArchived: false,
	}

	_, err := chatCollection.InsertOne(context.Background(), newChat)
	if err != nil {
		return nil, err
	}
	return &newChat, nil
}

// GetUserChats retrieves all non-archived chats for a specific user.
func GetUserChats(userID primitive.ObjectID) ([]models.Chat, error) {
	var chats []models.Chat
	filter := bson.M{"user_id": userID, "is_archived": false}
	opts := options.Find().SetSort(bson.D{{Key: "updated_at", Value: -1}})

	cursor, err := chatCollection.Find(context.Background(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &chats); err != nil {
		return nil, err
	}
	if chats == nil {
		return []models.Chat{}, nil
	}

	return chats, nil
}

// GetChatMessages retrieves all messages for a specific chat.
func GetChatMessages(chatID primitive.ObjectID) ([]models.Message, error) {
	var messages []models.Message
	filter := bson.M{"chat_id": chatID}
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: 1}})

	cursor, err := messageCollection.Find(context.Background(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &messages); err != nil {
		return nil, err
	}
	if messages == nil {
		return []models.Message{}, nil
	}

	return messages, nil
}

// --- ADD THIS NEW FUNCTION ---
// CountMessagesInChat counts the number of messages in a given chat.
func CountMessagesInChat(chatID primitive.ObjectID) (int64, error) {
	count, err := messageCollection.CountDocuments(context.Background(), bson.M{"chat_id": chatID})
	if err != nil {
		return 0, err
	}
	return count, nil
}
// --- END OF NEW FUNCTION ---

// SaveMessage saves a new message to the database and updates the parent chat's timestamp.
func SaveMessage(message *models.Message) (*models.Message, error) {
	_, err := messageCollection.InsertOne(context.Background(), message)
	if err != nil {
		return nil, err
	}

	filter := bson.M{"_id": message.ChatID}
	update := bson.M{"$set": bson.M{"updated_at": primitive.NewDateTimeFromTime(time.Now())}}
	_, err = chatCollection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		return nil, err
	}

	return message, nil
}

// UpdateChatTitle updates the title of a specific chat
func UpdateChatTitle(chatID primitive.ObjectID, title string) error {
	filter := bson.M{"_id": chatID}
	update := bson.M{"$set": bson.M{"title": title, "updated_at": primitive.NewDateTimeFromTime(time.Now())}}

	_, err := chatCollection.UpdateOne(context.Background(), filter, update)
	return err
}

// GetChatByID retrieves a specific chat by its ID
func GetChatByID(chatID primitive.ObjectID) (*models.Chat, error) {
	var chat models.Chat
	filter := bson.M{"_id": chatID}

	err := chatCollection.FindOne(context.Background(), filter).Decode(&chat)
	if err != nil {
		return nil, err
	}

	return &chat, nil
}

// CleanupEmptyChat checks if a chat has any messages. If not, it deletes the chat.
func CleanupEmptyChat(chatID primitive.ObjectID) error {
	count, err := messageCollection.CountDocuments(context.Background(), bson.M{"chat_id": chatID})
	if err != nil {
		return err
	}

	if count == 0 {
		_, err := chatCollection.DeleteOne(context.Background(), bson.M{"_id": chatID})
		if err != nil {
			return err
		}
	}

	return nil
}

// DeleteChat permanently deletes a chat and all its messages from the database
func DeleteChat(chatID primitive.ObjectID) error {
	_, err := messageCollection.DeleteMany(context.Background(), bson.M{"chat_id": chatID})
	if err != nil {
		return err
	}

	_, err = chatCollection.DeleteOne(context.Background(), bson.M{"_id": chatID})
	if err != nil {
		return err
	}

	return nil
}