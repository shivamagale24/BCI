"""
EEG Signal Filters and Preprocessing Utilities.

NeuroCare BCI - Preprocessing Subsystem
Implements bandpass, notch, downsampling, and baseline correction for EEG signals.
"""

from typing import Tuple, Optional
import numpy as np
from scipy import signal


def apply_notch_filter(
    data: np.ndarray,
    fs: float = 1024.0,
    notch_freq: float = 50.0,
    quality_factor: float = 30.0
) -> np.ndarray:
    """
    Apply an IIR notch filter to remove power-line interference (50 Hz).

    Parameters
    ----------
    data : np.ndarray
        EEG data of shape (n_channels, n_times) or (n_times,).
    fs : float
        Sampling frequency in Hz.
    notch_freq : float
        Frequency to attenuate (default 50.0 Hz).
    quality_factor : float
        Quality factor Q = f0 / delta_f.

    Returns
    -------
    filtered : np.ndarray
        Notch-filtered EEG data with same shape as input.
    """
    b, a = signal.iirnotch(notch_freq, quality_factor, fs)
    # Apply zero-phase forward-backward filtering along time axis (last axis)
    return signal.filtfilt(b, a, data, axis=-1).astype(np.float32)


def apply_bandpass_filter(
    data: np.ndarray,
    fs: float = 1024.0,
    lowcut: float = 8.0,
    highcut: float = 30.0,
    order: int = 4
) -> np.ndarray:
    """
    Apply a zero-phase Butterworth bandpass filter targeting Mu (8-13 Hz)
    and Beta (13-30 Hz) sensorimotor rhythms for Motor Execution/Imagery.

    Parameters
    ----------
    data : np.ndarray
        EEG data array of shape (..., n_times).
    fs : float
        Sampling frequency in Hz.
    lowcut : float
        Lower cutoff frequency in Hz (default 8.0 Hz).
    highcut : float
        Upper cutoff frequency in Hz (default 30.0 Hz).
    order : int
        Filter order (default 4).

    Returns
    -------
    filtered : np.ndarray
        Bandpass-filtered EEG data with same shape as input.
    """
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = signal.butter(order, [low, high], btype="bandpass")
    return signal.filtfilt(b, a, data, axis=-1).astype(np.float32)


def resample_signal(
    data: np.ndarray,
    orig_fs: float = 1024.0,
    target_fs: float = 128.0
) -> Tuple[np.ndarray, float]:
    """
    Resample EEG data to target sampling frequency using polyphase filtering.

    Parameters
    ----------
    data : np.ndarray
        EEG data array of shape (..., n_times).
    orig_fs : float
        Original sampling rate in Hz (default 1024.0).
    target_fs : float
        Target sampling rate in Hz (default 128.0).

    Returns
    -------
    resampled_data : np.ndarray
        Resampled EEG data.
    target_fs : float
        The new sampling rate.
    """
    if orig_fs == target_fs:
        return data.astype(np.float32), orig_fs

    num_samples = int(round(data.shape[-1] * (target_fs / orig_fs)))
    resampled = signal.resample(data, num_samples, axis=-1).astype(np.float32)
    return resampled, target_fs


def apply_baseline_correction(
    data: np.ndarray,
    baseline_window: Tuple[int, int]
) -> np.ndarray:
    """
    Subtract the channel-wise mean computed over a baseline time window.

    Parameters
    ----------
    data : np.ndarray
        EEG data array of shape (..., n_channels, n_times).
    baseline_window : tuple of (int, int)
        Sample indices (start_idx, end_idx) defining the baseline.

    Returns
    -------
    corrected_data : np.ndarray
        Baseline-subtracted EEG data.
    """
    start_idx, end_idx = baseline_window
    baseline_mean = np.mean(data[..., :, start_idx:end_idx], axis=-1, keepdims=True)
    return (data - baseline_mean).astype(np.float32)
