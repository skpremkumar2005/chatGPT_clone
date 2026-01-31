package services

import (
	"chatgpt-clone/backend/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// LogActivity logs a user activity
func LogActivity(
	companyID, userID primitive.ObjectID,
	action, resource, resourceID, description string,
	success bool,
	metadata map[string]interface{},
	ipAddress, userAgent, method, endpoint string,
	statusCode int,
	errorMsg string,
) error {
	log := models.ActivityLog{
		ID:          primitive.NewObjectID(),
		CompanyID:   companyID,
		UserID:      userID,
		Action:      action,
		Resource:    resource,
		ResourceID:  resourceID,
		Description: description,
		IPAddress:   ipAddress,
		UserAgent:   userAgent,
		Method:      method,
		Endpoint:    endpoint,
		StatusCode:  statusCode,
		Metadata:    metadata,
		Success:     success,
		ErrorMsg:    errorMsg,
		Timestamp:   primitive.NewDateTimeFromTime(time.Now()),
	}

	_, err := activityLogCollection.InsertOne(context.Background(), log)
	return err
}

// GetActivityLogs retrieves activity logs with pagination and filtering
func GetActivityLogs(
	companyID primitive.ObjectID,
	page, limit int,
	userID *primitive.ObjectID,
	action, resource string,
	startDate, endDate *time.Time,
) ([]models.ActivityLog, int64, error) {
	ctx := context.Background()

	filter := bson.M{"company_id": companyID}

	if userID != nil && !userID.IsZero() {
		filter["user_id"] = *userID
	}

	if action != "" {
		filter["action"] = action
	}

	if resource != "" {
		filter["resource"] = resource
	}

	if startDate != nil && endDate != nil {
		filter["timestamp"] = bson.M{
			"$gte": primitive.NewDateTimeFromTime(*startDate),
			"$lte": primitive.NewDateTimeFromTime(*endDate),
		}
	} else if startDate != nil {
		filter["timestamp"] = bson.M{"$gte": primitive.NewDateTimeFromTime(*startDate)}
	} else if endDate != nil {
		filter["timestamp"] = bson.M{"$lte": primitive.NewDateTimeFromTime(*endDate)}
	}

	skip := (page - 1) * limit
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "timestamp", Value: -1}})

	cursor, err := activityLogCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var logs []models.ActivityLog
	if err := cursor.All(ctx, &logs); err != nil {
		return nil, 0, err
	}

	total, err := activityLogCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

// GetUserActivitySummary gets activity summary for a specific user
func GetUserActivitySummary(userID primitive.ObjectID, days int) (map[string]interface{}, error) {
	ctx := context.Background()

	startDate := time.Now().AddDate(0, 0, -days)

	// Count total activities
	totalActivities, err := activityLogCollection.CountDocuments(ctx, bson.M{
		"user_id": userID,
		"timestamp": bson.M{
			"$gte": primitive.NewDateTimeFromTime(startDate),
		},
	})
	if err != nil {
		return nil, err
	}

	// Group by action
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"user_id": userID,
				"timestamp": bson.M{
					"$gte": primitive.NewDateTimeFromTime(startDate),
				},
			},
		},
		{
			"$group": bson.M{
				"_id":   "$action",
				"count": bson.M{"$sum": 1},
			},
		},
	}

	cursor, err := activityLogCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	actionBreakdown := make(map[string]int)
	for cursor.Next(ctx) {
		var result struct {
			Action string `bson:"_id"`
			Count  int    `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		actionBreakdown[result.Action] = result.Count
	}

	// Get last login
	var lastLogin models.ActivityLog
	opts := options.FindOne().SetSort(bson.D{{Key: "timestamp", Value: -1}})
	err = activityLogCollection.FindOne(ctx, bson.M{
		"user_id": userID,
		"action":  models.ActionLogin,
	}, opts).Decode(&lastLogin)

	var lastLoginTime *time.Time
	if err == nil {
		t := lastLogin.Timestamp.Time()
		lastLoginTime = &t
	}

	summary := map[string]interface{}{
		"total_activities": totalActivities,
		"action_breakdown": actionBreakdown,
		"last_login":       lastLoginTime,
		"period_days":      days,
	}

	return summary, nil
}

// GetCompanyActivityStats gets overall activity statistics for a company
func GetCompanyActivityStats(companyID primitive.ObjectID, days int) (map[string]interface{}, error) {
	ctx := context.Background()

	startDate := time.Now().AddDate(0, 0, -days)

	// Total activities
	totalActivities, err := activityLogCollection.CountDocuments(ctx, bson.M{
		"company_id": companyID,
		"timestamp": bson.M{
			"$gte": primitive.NewDateTimeFromTime(startDate),
		},
	})
	if err != nil {
		return nil, err
	}

	// Activities by day
	dailyPipeline := []bson.M{
		{
			"$match": bson.M{
				"company_id": companyID,
				"timestamp": bson.M{
					"$gte": primitive.NewDateTimeFromTime(startDate),
				},
			},
		},
		{
			"$group": bson.M{
				"_id": bson.M{
					"$dateToString": bson.M{
						"format": "%Y-%m-%d",
						"date":   "$timestamp",
					},
				},
				"count": bson.M{"$sum": 1},
			},
		},
		{
			"$sort": bson.M{"_id": 1},
		},
	}

	cursor, err := activityLogCollection.Aggregate(ctx, dailyPipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	dailyActivities := []map[string]interface{}{}
	for cursor.Next(ctx) {
		var result struct {
			Date  string `bson:"_id"`
			Count int    `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		dailyActivities = append(dailyActivities, map[string]interface{}{
			"date":  result.Date,
			"count": result.Count,
		})
	}

	// Most active users
	userPipeline := []bson.M{
		{
			"$match": bson.M{
				"company_id": companyID,
				"timestamp": bson.M{
					"$gte": primitive.NewDateTimeFromTime(startDate),
				},
			},
		},
		{
			"$group": bson.M{
				"_id":   "$user_id",
				"count": bson.M{"$sum": 1},
			},
		},
		{
			"$sort": bson.M{"count": -1},
		},
		{
			"$limit": 10,
		},
	}

	cursor, err = activityLogCollection.Aggregate(ctx, userPipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	mostActiveUsers := []map[string]interface{}{}
	for cursor.Next(ctx) {
		var result struct {
			UserID primitive.ObjectID `bson:"_id"`
			Count  int                `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}

		// Get user details
		user, err := GetUserByID(result.UserID)
		if err == nil {
			mostActiveUsers = append(mostActiveUsers, map[string]interface{}{
				"user_id": result.UserID.Hex(),
				"name":    user.Name,
				"email":   user.Email,
				"count":   result.Count,
			})
		}
	}

	stats := map[string]interface{}{
		"total_activities":  totalActivities,
		"daily_activities":  dailyActivities,
		"most_active_users": mostActiveUsers,
		"period_days":       days,
	}

	return stats, nil
}
