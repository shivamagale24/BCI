"""EEG Preprocessing package for NeuroCare BCI."""

from .filters import (
    apply_notch_filter,
    apply_bandpass_filter,
    resample_signal,
    apply_baseline_correction
)
from .preprocessing import EEGPreprocessor

__all__ = [
    "apply_notch_filter",
    "apply_bandpass_filter",
    "resample_signal",
    "apply_baseline_correction",
    "EEGPreprocessor"
]
