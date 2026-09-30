# NeuroCare BCI - EEG & Machine Learning Pipeline

## 1. Dataset Specification

* **Reference**: Wairagkar et al. (2018), *Movement intention detection from EEG*, PLOS ONE. DOI: 10.1371/journal.pone.0193722
* **Cohort**: 14 healthy human participants (aged 20–35).
* **Task Paradigm**: Visually cued Motor Execution and Motor Imagery trials.
* **Classes**:
  - `0`: Right Hand Movement (`right_hand`)
  - `1`: Rest / Idle (`rest`)
  - `2`: Left Hand Movement (`left_hand`)
* **Sampling Rate**: 1024 Hz
* **Electrode Configuration**: 19 standard channels in 10-20 international montage:
  `Fp1`, `Fp2`, `F7`, `F3`, `Fz`, `F4`, `F8`, `T7`, `C3`, `Cz`, `C4`, `T8`, `P7`, `P3`, `Pz`, `P4`, `P8`, `O1`, `O2`
* **Trial Duration**: 6.0 seconds per trial (-3.0s to +3.0s relative to movement cue onset). Total: 6,144 time points per trial.
* **Total Trials**: 1,656 valid trials across all 14 participants.

---

## 2. Signal Preprocessing Methodology

EEG signals contain physiological artifacts (ocular blinks, muscular EMG), power line interference, and non-stationarity. The preprocessing steps in `bci_pipeline/preprocessing/` are:

1. **Baseline Correction**:
   - The pre-stimulus interval (-2.5s to -0.5s relative to cue onset) is used to subtract baseline DC offset on each channel independently.
2. **Notch Filtering**:
   - 2nd-order IIR Notch filter centered at 50.0 Hz (Quality factor Q = 30) attenuates AC power-line contamination.
3. **Sensorimotor Bandpass Filtering**:
   - 4th-order zero-phase Butterworth bandpass filter spanning 8.0 Hz to 30.0 Hz.
   - This encompasses the sensorimotor Mu rhythm (8–13 Hz) and Beta rhythm (13–30 Hz), where Event-Related Desynchronization (ERD) is physiologically most prominent.
4. **Task Window Slicing**:
   - Active execution and imagery interval isolated from +0.5s to +3.0s post-stimulus (2.5 seconds total).
5. **Decimation / Resampling**:
   - Polyphase resampling reduces sampling frequency from 1024 Hz to 128 Hz.
   - 2.5 seconds at 128 Hz yields 320 samples per channel, cutting data dimension by 8× and enabling sub-millisecond inference on hospital workstations.
6. **Z-score Standardization**:
   - Channel-wise standardization: $(x - \mu) / \sigma$ across time points prevents high-amplitude channel dominance.

---

## 3. Feature Extraction Methodology

For each 19-channel trial, a 139-dimensional feature vector is extracted (`bci_pipeline/features/extraction.py`):

1. **Spectral Power via Welch PSD**:
   - Welch's average periodogram with Hann windowing.
   - Bandpower in Mu band (8–13 Hz).
   - Bandpower in Beta band (13–30 Hz).
   - Relative Mu and Beta powers: $\text{Power}_{\text{band}} / \text{Power}_{\text{total}}$.
2. **Log-Variance**:
   - Channel log-variance $\log(\text{Var}(x) + \epsilon)$, standard in Common Spatial Pattern (CSP) feature representations.
3. **Hjorth Parameters**:
   - **Activity**: Variance $\text{Var}(x)$ representing signal power.
   - **Mobility**: $\sqrt{\frac{\text{Var}(dx/dt)}{\text{Var}(x)}}$ representing mean frequency.
   - **Complexity**: Ratio of mobility of first derivative to mobility of signal, representing spectral bandwidth.
4. **Contralateral Inter-Hemispheric Asymmetry**:
   - Sensorimotor asymmetry indices: $\frac{\text{Left} - \text{Right}}{\text{Left} + \text{Right} + \epsilon}$
   - Computed for Mu and Beta bands across contralateral electrode pairs:
     - `C3` vs `C4` (Primary Motor Cortex)
     - `F3` vs `F4` (Premotor / Frontal Cortex)
     - `P3` vs `P4` (Parietal Somatosensory Cortex)

---

## 4. Machine Learning Model Selection & Real Evaluation Results

To guarantee strict compliance with scientific integrity and avoid data leakage across subjects, we evaluated models using a **Subject-Aware Split**:
* **Training Cohort**: Subjects 1 through 11 (1,296 trials total).
* **Holdout Test Cohort**: Unseen Subjects 12, 13, and 14 (360 trials total).

### Actual Evaluation Results on Holdout Subjects (3-Class Classification, Chance = 33.3%):

| Model Candidate | Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score (Weighted) | Status |
|:---|:---:|:---:|:---:|:---:|:---|
| **SVM (RBF Kernel)** | **38.33%** | **38.53%** | **38.33%** | **38.39%** | **Selected Best Model** |
| SVM (Linear Kernel) | 36.39% | 36.45% | 36.39% | 36.30% | Candidate |
| Logistic Regression (L2) | 33.61% | 33.55% | 33.61% | 33.47% | Baseline |
| Random Forest (100 Trees) | 33.06% | 32.98% | 33.06% | 32.93% | Baseline |

### Confusion Matrix (SVM RBF on Unseen Holdout Subjects):

$$\begin{pmatrix}
\text{Right Hand (True)} & \mathbf{39} & 34 & 47 \\
\text{Rest (True)} & 35 & \mathbf{53} & 32 \\
\text{Left Hand (True)} & 42 & 32 & \mathbf{46}
\end{pmatrix}$$

* **Per-Class F1-Scores**:
  - `right_hand`: 0.339
  - `rest`: 0.440
  - `left_hand`: 0.372
* Model serialized to: `bci_pipeline/models/saved_models/bci_classifier.joblib`.
