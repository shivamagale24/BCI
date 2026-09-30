# NeuroCare BCI - Signal Processing & Machine Learning Pipeline

## Overview
This subsystem provides the complete pipeline for loading, preprocessing, extracting features from, and classifying multi-channel EEG motor execution/imagery data from the **Wairagkar et al. (2018)** dataset (PLOS ONE).

## Module Structure
```
bci_pipeline/
├── data/
│   └── (raw dataset files: sub-*/ or sourcedata/Participant*.mat)
├── preprocessing/
│   ├── filters.py        # Notch, Butterworth Bandpass (8-30Hz), baseline correction, resampling
│   └── preprocessing.py  # EEGPreprocessor pipeline orchestrator
├── features/
│   └── extraction.py     # Welch PSD, Mu/Beta bandpower, Asymmetry, Hjorth parameters
├── models/
│   ├── train.py          # Subject-aware training script with scikit-learn models
│   ├── evaluate.py       # Detailed evaluation metrics & confusion matrix reporter
│   └── saved_models/     # Serialized model (.joblib) & metrics (.json)
├── loader.py             # Loads real 19-channel EEG trials across participants
├── predictor.py          # Real-time inference engine mapping signals to hospital intents
└── README.md
```

## How to Train the Model
From the project root:
```bash
python -m bci_pipeline.models.train
```

## How to View Evaluation Metrics
```bash
python -m bci_pipeline.models.evaluate
```

## How to Test Inference
```bash
python -c "from bci_pipeline.loader import EEGLoader; from bci_pipeline.predictor import BCIPredictor; l = EEGLoader(); p = BCIPredictor(); s = l.get_sample_trial(1, 0, 0); print(p.predict(s['eeg']))"
```
