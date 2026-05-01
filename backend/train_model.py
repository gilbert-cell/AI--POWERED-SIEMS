from api.ai_model import train_hybrid_models


if __name__ == "__main__":
    result = train_hybrid_models()
    print("Hybrid training completed successfully")
    print(f"Random Forest saved to: {result['rf_model_path']}")
    print(f"Isolation Forest saved to: {result['if_model_path']}")
    print(f"Random Forest accuracy: {result['rf_accuracy']:.4f}")
    print(f"Random Forest feature count: {result['rf_feature_count']}")
    print(f"Isolation Forest feature count: {result['if_feature_count']}")
