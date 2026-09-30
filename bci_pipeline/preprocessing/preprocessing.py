"""
EEG Preprocessing Pipeline for NeuroCare BCI.

Orchestrates notch filtering, bandpass filtering, epoch windowing,
resampling, and robust normalization.
"""

from typing import Optional, Tuple, Dict, Any
import numpy as np
from .filters import (
    apply_notch_filter,
    apply_bandpass_filter,
    resample_signal,
    apply_baseline_correction
)


class EEGPreprocessor:
    """
    Standardized EEG Preprocessing Pipeline for Motor Execution/Imagery.
    
    Processing steps:
    1. Baseline correction over pre-stimulus interval (-2.5s to -0.5s)
    2. Powerline Notch filtering at 50 Hz
    3. Sensorimotor Bandpass filtering (8.0 - 30.0 Hz: Mu & Beta bands)
    4. Task window slicing (0.0s to 3.0s post-stimulus interval)
    5. Downsampling from 1024 Hz to 128 Hz for computational efficiency
    6. Channel-wise z-score normalization
    """

    def __init__(
        self,
        orig_fs: float = 1024.0,
        target_fs: float = 128.0,
        lowcut: float = 8.0,
        highcut: float = 30.0,
        notch_freq: float = 50.0,
        window_seconds: Tuple[float, float] = (0.5, 3.0),
        baseline_seconds: Tuple[float, float] = (-2.5, -0.5),
        time_offset: float = -3.0  # Trial starts at t = -3.0s relative to onset
    ):
        self.orig_fs = orig_fs
        self.target_fs = target_fs
        self.lowcut = lowcut
        self.highcut = highcut
        self.notch_freq = notch_freq
        self.window_seconds = window_seconds
        self.baseline_seconds = baseline_seconds
        self.time_offset = time_offset

    def _sec_to_idx(self, sec: float, fs: float) -> int:
        """Convert relative time in seconds to sample index."""
        rel_sec = sec - self.time_offset
        return int(round(rel_sec * fs))

    def preprocess_trial(self, trial_data: np.ndarray) -> np.ndarray:
        """
        Preprocess a single EEG trial.

        Parameters
        ----------
        trial_data : np.ndarray
            Shape: (n_channels, n_samples), e.g. (19, 6144)

        Returns
        -------
        processed : np.ndarray
            Preprocessed EEG epoch of shape (n_channels, n_resampled_samples)
        """
        x = trial_data.copy().astype(np.float32)

        # 1. Baseline correction using pre-stimulus baseline window
        base_start = self._sec_to_idx(self.baseline_seconds[0], self.orig_fs)
        base_end = self._sec_to_idx(self.baseline_seconds[1], self.orig_fs)
        base_start = max(0, min(base_start, x.shape[-1] - 1))
        base_end = max(base_start + 1, min(base_end, x.shape[-1]))
        x = apply_baseline_correction(x, (base_start, base_end))

        # 2. Notch filter for 50 Hz powerline noise
        if self.notch_freq is not None and self.notch_freq < (self.orig_fs / 2):
            x = apply_notch_filter(x, fs=self.orig_fs, notch_freq=self.notch_freq)

        # 3. Bandpass filter for sensorimotor rhythm (8-30 Hz)
        x = apply_bandpass_filter(x, fs=self.orig_fs, lowcut=self.lowcut, highcut=self.highcut)

        # 4. Extract active task window (e.g. 0.5s to 3.0s post-stimulus)
        win_start = self._sec_to_idx(self.window_seconds[0], self.orig_fs)
        win_end = self._sec_to_idx(self.window_seconds[1], self.orig_fs)
        win_start = max(0, min(win_start, x.shape[-1] - 1))
        win_end = max(win_start + 1, min(win_end, x.shape[-1]))
        x = x[..., :, win_start:win_end]

        # 5. Resample to target sampling frequency
        x, _ = resample_signal(x, orig_fs=self.orig_fs, target_fs=self.target_fs)

        # 6. Robust channel-wise standardization (z-score across time)
        mean = np.mean(x, axis=-1, keepdims=True)
        std = np.std(x, axis=-1, keepdims=True)
        std = np.where(std < 1e-8, 1.0, std)
        x = (x - mean) / std

        return x.astype(np.float32)

    def preprocess_batch(self, batch_data: np.ndarray) -> np.ndarray:
        """
        Preprocess multiple EEG trials.

        Parameters
        ----------
        batch_data : np.ndarray
            Shape: (n_trials, n_channels, n_samples)

        Returns
        -------
        processed : np.ndarray
            Shape: (n_trials, n_channels, n_resampled_samples)
        """
        processed_list = [self.preprocess_trial(trial) for trial in batch_data]
        return np.stack(processed_list, axis=0)

    def get_config(self) -> Dict[str, Any]:
        """Return preprocessor configuration dictionary."""
        return {
            "orig_fs": self.orig_fs,
            "target_fs": self.target_fs,
            "lowcut": self.lowcut,
            "highcut": self.highcut,
            "notch_freq": self.notch_freq,
            "window_seconds": self.window_seconds,
            "baseline_seconds": self.baseline_seconds,
            "time_offset": self.time_offset
        }
