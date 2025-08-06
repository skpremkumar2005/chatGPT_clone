package config

// AppConfig could hold any application-wide configuration
// that doesn't fit into database or other specific configs.
type AppConfig struct {
	AppName string
	Env     string
}

// LoadConfig could be used to load configuration from a file or environment.
func LoadConfig() *AppConfig {
	return &AppConfig{
		AppName: "ChatGPT Clone",
		Env:     "development", // This could be dynamically set
	}
}