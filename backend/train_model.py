from api.ai_model import train_model


if __name__ == "__main__":
    result = train_model()
    print("Model trained successfully")
    print(f"Saved model to: {result['model_path']}")
    print(f"Validation accuracy: {result['accuracy']:.4f}")
    print(f"Feature count: {result['feature_count']}")
