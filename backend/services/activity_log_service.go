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
	baseFilter := bson.M{
		"company_id": companyID,
		"timestamp":  bson.M{"$gte": primitive.NewDateTimeFromTime(startDate)},
	}

	// Total actions
	totalActions, err := activityLogCollection.CountDocuments(ctx, baseFilter)
	if err != nil {
		return nil, err
	}

	// Successful actions
	successFilter := bson.M{
		"company_id": companyID,
		"timestamp":  bson.M{"$gte": primitive.NewDateTimeFromTime(startDate)},
		"success":    true,
	}
	successfulActions, _ := activityLogCollection.CountDocuments(ctx, successFilter)

	// Failed actions
	failFilter := bson.M{
		"company_id": companyID,
		"timestamp":  bson.M{"$gte": primitive.NewDateTimeFromTime(startDate)},
		"success":    false,
	}
	failedActions, _ := activityLogCollection.CountDocuments(ctx, failFilter)

	// Unique active users
	uniqueUsersPipeline := []bson.M{
		{"$match": baseFilter},
		{"$group": bson.M{"_id": "$user_id"}},
		{"$count": "unique_users"},
	}
	uniqueCursor, err := activityLogCollection.Aggregate(ctx, uniqueUsersPipeline)
	var uniqueUsers int64
	if err == nil {
		defer uniqueCursor.Close(ctx)
		if uniqueCursor.Next(ctx) {
			var res struct {
				Count int64 `bson:"unique_users"`
			}
			if err := uniqueCursor.Decode(&res); err == nil {
				uniqueUsers = res.Count
			}
		}
	}

	// Actions by type
	actionTypePipeline := []bson.M{
		{"$match": baseFilter},
		{"$group": bson.M{"_id": "$action", "count": bson.M{"$sum": 1}}},
		{"$sort": bson.M{"count": -1}},
	}
	typeCursor, err := activityLogCollection.Aggregate(ctx, actionTypePipeline)
	actionsByType := map[string]int{}
	if err == nil {
		defer typeCursor.Close(ctx)
		for typeCursor.Next(ctx) {
			var res struct {
				Action string `bson:"_id"`
				Count  int    `bson:"count"`
			}
			if err := typeCursor.Decode(&res); err == nil && res.Action != "" {
				actionsByType[res.Action] = res.Count
			}
		}
	}

	// Daily activities
	dailyPipeline := []bson.M{
		{"$match": baseFilter},
		{
			"$group": bson.M{
				"_id": bson.M{
					"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$timestamp"},
				},
				"count": bson.M{"$sum": 1},
			},
		},
		{"$sort": bson.M{"_id": 1}},
	}
	dailyCursor, err := activityLogCollection.Aggregate(ctx, dailyPipeline)
	dailyActivities := []map[string]interface{}{}
	if err == nil {
		defer dailyCursor.Close(ctx)
		for dailyCursor.Next(ctx) {
			var res struct {
				Date  string `bson:"_id"`
				Count int    `bson:"count"`
			}
			if err := dailyCursor.Decode(&res); err == nil {
				dailyActivities = append(dailyActivities, map[string]interface{}{
					"date":  res.Date,
					"count": res.Count,
				})
			}
		}
	}

	// Most active users
	userPipeline := []bson.M{
		{"$match": baseFilter},
		{"$group": bson.M{"_id": "$user_id", "count": bson.M{"$sum": 1}}},
		{"$sort": bson.M{"count": -1}},
		{"$limit": 10},
	}
	userCursor, err := activityLogCollection.Aggregate(ctx, userPipeline)
	mostActiveUsers := []map[string]interface{}{}
	if err == nil {
		defer userCursor.Close(ctx)
		for userCursor.Next(ctx) {
			var res struct {
				UserID primitive.ObjectID `bson:"_id"`
				Count  int                `bson:"count"`
			}
			if err := userCursor.Decode(&res); err == nil {
				user, err := GetUserByID(res.UserID)
				if err == nil {
					mostActiveUsers = append(mostActiveUsers, map[string]interface{}{
						"user_id": res.UserID.Hex(),
						"name":    user.Name,
						"email":   user.Email,
						"count":   res.Count,
					})
				}
			}
		}
	}

	return map[string]interface{}{
		"total_actions":     totalActions,
		"successful_actions": successfulActions,
		"failed_actions":    failedActions,
		"unique_users":      uniqueUsers,
		"actions_by_type":   actionsByType,
		"daily_activities":  dailyActivities,
		"most_active_users": mostActiveUsers,
		"period_days":       days,
	}, nil
}
