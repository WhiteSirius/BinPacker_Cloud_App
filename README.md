# BinPacker Cloud App 📦

> 3D Bin Packing Optimization for Logistics Transportation
> **Thesis Project by Andrei Baban**

## 🎯 Project Overview

This project implements an advanced 3D bin packing algorithm using the innovative "collision points" approach to optimize cargo loading in European logistics vehicles. The solution is deployed on Google Cloud Platform with a modern React frontend and FastAPI backend.

## 🏗️ Architecture

- **Frontend**: React.js with TypeScript and Three.js for 3D visualization
- **Backend**: FastAPI with Python 3.9+
- **Database**: PostgreSQL on Google Cloud SQL
- **Deployment**: Google Cloud Run with CI/CD via Cloud Build
- **Algorithm**: Custom collision points approach with EU logistics constraints

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker (optional)
- Google Cloud SDK (for deployment)

### Local Development

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd BinPacker_Cloud_App
   ```

2. **Backend setup**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run backend**:
   ```bash
   python src/api/main.py
   ```

5. **Frontend setup**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📁 Project Structure

```
BinPacker_Cloud_App/
├── src/
│   ├── algorithm/          # Core bin packing algorithm
│   ├── api/               # FastAPI backend
│   ├── models/            # Database models
│   └── utils/             # Utility functions
├── frontend/              # React.js application
├── tests/                 # Test suites
├── docs/                  # Documentation
├── infrastructure/        # Cloud deployment configs
└── data/                  # Sample datasets
```

## 🔬 Algorithm Features

- **Collision Points Approach**: Novel spatial optimization method
- **EU Logistics Constraints**: Compliance with European transport regulations
- **100% Support Validation**: Ensures cargo stability
- **Multi-destination Loading**: LIFO delivery optimization
- **Weight Distribution**: Proper axle weight management
- **Rotation Management**: Palletized vs non-palletized cargo handling

## 🌐 API Endpoints

- `POST /api/v1/optimize` - Run bin packing optimization
- `POST /api/v1/upload-excel` - Upload cargo data from Excel
- `GET /api/v1/vehicles` - Manage vehicle configurations
- `GET /api/v1/optimization/{job_id}/results` - Get optimization results

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src/ --cov-report=html
```

## 🚀 Deployment

### Google Cloud Platform

1. **Setup GCP project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com sql-component.googleapis.com
   ```

2. **Deploy via Cloud Build**:
   ```bash
   gcloud builds submit --config=cloudbuild.yaml .
   ```

### Docker

```bash
# Build and run locally
docker-compose up --build

# Production build
docker build -t binpacker-app .
docker run -p 8000:8000 binpacker-app
```

## 📊 Performance Metrics

- **Target Efficiency**: >90% space utilization
- **Processing Speed**: <60 seconds for 200 items
- **Accuracy**: >95% vs manual expert packing
- **Scalability**: 1000+ items with cloud resources

## 🤝 Contributing

This is a thesis project. For questions or collaboration:

- **Author**: Andrei Baban

## 📄 License

Academic project - All rights reserved.

## 🏆 Thesis Objectives

1. Develop novel 3D bin packing algorithm
2. Implement real-world logistics constraints
3. Create scalable cloud-based solution
4. Demonstrate practical industry application
5. Contribute to academic research in optimization

---

**Status**: 🚧 In Development (3-4 week sprint to working prototype)
**Last Updated**: $(date)
**Version**: 1.0.0