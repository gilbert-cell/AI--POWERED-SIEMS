# AI Model Backend Usage

This backend now includes a simple AI training and prediction workflow using the UNSW NB15 dataset.

## Setup

1. Place the dataset here:
   - `backend/data/UNSW_NB15_training-set.csv`

2. Activate the existing Python virtual environment:
   - `cd backend`
   - `source ../venv/bin/activate`

3. Install required Python packages:
   - `pip install pandas scikit-learn joblib`

## Train the model

Run:

```bash
cd backend
python train_model.py
```

This will train a RandomForest model and save it to `backend/model.pkl`.

## API endpoints

Start Django as usual:

```bash
cd backend
python manage.py runserver
```

Then use the AI endpoints:

- `POST /api/ai/train/` to train the model using `backend/data/UNSW_NB15_training-set.csv`
- `POST /api/ai/predict/` to classify a single log record

### Example prediction request

```json
{
  "srcip": "192.168.1.10",
  "dstip": "10.0.0.5",
  "proto": "tcp",
  "service": "http",
  "state": "FIN",
  "dur": 120,
  "sbytes": 1500,
  "dbytes": 500,
  "attack_cat": "Backdoor"
}
```

The prediction API returns a JSON response like:

```json
{
  "threat": 1,
  "probabilities": [0.12, 0.88]
}
```

## Dataset preview and load

- `GET /api/ai/dataset/preview/?rows=10` returns dataset metadata and sample rows from `backend/data/UNSW_NB15_training-set.csv`.
- `POST /api/ai/dataset/load/` loads dataset records into the Django log database so they can be displayed through the SIEM log viewer.

Example load request:

```json
{
  "max_rows": 100
}
```

After loading, use the existing `/api/logs/` endpoint to view dataset-derived SIEM logs.

