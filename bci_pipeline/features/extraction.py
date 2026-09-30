"""
Feature Extraction for NeuroCare BCI.

Extracts sensorimotor rhythm (Mu/Beta) spectral power, inter-hemispheric asymmetry,
and time-domain Hjorth parameters from preprocessed EEG epochs.
"""

from typing import List, Dict, Tuple, Optional
import numpy as np
from scipy import signal


def calculate_bandpower(
    psd: np.ndarray,
    freqs: np.ndarray,
    band: Tuple[float, float]
) -> float:
    """
    Calculate absolute band power by integrating PSD over frequency range.

    Parameters
    ----------
    psd : np.ndarray
        Power spectral density array (1D).
    freqs : np.ndarray
        Frequency bins corresponding to PSD.
    band : tuple of (float, float)
        (low_freq, high_freq) in Hz.

    Returns
    -------
    bandpower : float
        Integrated power within specified band.
    """
    low, high = band
    idx_band = np.logical_and(freqs >= low, freqs <= high)
    if not np.any(idx_band):
        return 0.0
    # Approximate integral using composite trapezoidal rule
    freq_res = freqs[1] - freqs[0] if len(freqs) > 1 else 1.0
    return float(np.sum(psd[idx_band]) * freq_res)


def calculate_hjorth_parameters(x: np.ndarray) -> Tuple[float, float, float]:
    """
    Compute Hjorth parameters: Activity, Mobility, Complexity.

    Parameters
    ----------
    x : np.ndarray
        1D signal array for a single channel.

    Returns
    -------
    activity : float
        Variance of the signal.
    mobility : float
        Proportional to mean frequency: sqrt(var(dx) / var(x)).
    complexity : float
        Proportional to bandwidth: mobility(dx) / mobility(x).
    """
    var_zero = float(np.var(x))
    if var_zero < 1e-12:
        return 0.0, 0.0, 0.0

    dx = np.diff(x)
    var_d1 = float(np.var(dx))
    if var_d1 < 1e-12:
        return var_zero, 0.0, 0.0

    mobility = np.sqrt(var_d1 / var_zero)

    ddx = np.diff(dx)
    var_d2 = float(np.var(ddx))
    if var_d2 < 1e-12:
        return var_zero, mobility, 0.0

    mobility_d1 = np.sqrt(var_d2 / var_d1)
    complexity = mobility_d1 / mobility if mobility > 1e-12 else 0.0

    return var_zero, mobility, complexity


class EEGFeatureExtractor:
    """
    Extracts sensorimotor features from preprocessed multichannel EEG.
    """

    def __init__(
        self,
        fs: float = 128.0,
        channel_names: Optional[List[str]] = None,
        mu_band: Tuple[float, float] = (8.0, 13.0),
        beta_band: Tuple[float, float] = (13.0, 30.0)
    ):
        self.fs = fs
        self.mu_band = mu_band
        self.beta_band = beta_band
        self.channel_names = channel_names or [
            "Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8",
            "T7", "C3", "Cz", "C4", "T8",
            "P7", "P3", "Pz", "P4", "P8",
            "O1", "O2"
        ]
        self.ch_to_idx = {name: i for i, name in enumerate(self.channel_names)}
        self._feature_names: List[str] = []
        self._build_feature_names()

    def _build_feature_names(self):
        """Construct descriptive feature names for interpretability."""
        names = []
        # Per-channel spectral and temporal features
        for ch in self.channel_names:
            names.append(f"{ch}_mu_power")
            names.append(f"{ch}_beta_power")
            names.append(f"{ch}_rel_mu")
            names.append(f"{ch}_rel_beta")
            names.append(f"{ch}_log_var")
            names.append(f"{ch}_hjorth_mobility")
            names.append(f"{ch}_hjorth_complexity")

        # Inter-hemispheric sensorimotor asymmetry features
        asym_pairs = [("C3", "C4"), ("F3", "F4"), ("P3", "P4")]
        for left_ch, right_ch in asym_pairs:
            if left_ch in self.ch_to_idx and right_ch in self.ch_to_idx:
                names.append(f"asym_{left_ch}_{right_ch}_mu")
                names.append(f"asym_{left_ch}_{right_ch}_beta")

        self._feature_names = names

    @property
    def feature_names(self) -> List[str]:
        return list(self._feature_names)

    def extract_trial(self, trial_data: np.ndarray) -> np.ndarray:
        """
        Extract feature vector from a single preprocessed EEG epoch.

        Parameters
        ----------
        trial_data : np.ndarray
            Shape: (n_channels, n_times), e.g. (19, 320)

        Returns
        -------
        feat_vector : np.ndarray
            1D array of extracted numerical features.
        """
        n_channels, n_times = trial_data.shape
        features = []
        channel_mu_power = {}
        channel_beta_power = {}

        # 1. Compute PSD and temporal features per channel
        # nperseg is set to min(n_times, fs) for sufficient frequency resolution
        nperseg = min(n_times, int(self.fs))
        if nperseg < 16:
            nperseg = n_times

        for ch_idx in range(n_channels):
            ch_name = self.channel_names[ch_idx] if ch_idx < len(self.channel_names) else f"ch_{ch_idx}"
            sig = trial_data[ch_idx]

            # PSD via Welch's method
            freqs, psd = signal.welch(sig, fs=self.fs, nperseg=nperseg, noverlap=nperseg // 2)

            mu_pow = calculate_bandpower(psd, freqs, self.mu_band)
            beta_pow = calculate_bandpower(psd, freqs, self.beta_band)
            total_pow = mu_pow + beta_pow + 1e-8

            rel_mu = mu_pow / total_pow
            rel_beta = beta_pow / total_pow

            # Store for asymmetry
            channel_mu_power[ch_name] = mu_pow
            channel_beta_power[ch_name] = beta_pow

            # Time-domain / Hjorth parameters
            var, mobility, complexity = calculate_hjorth_parameters(sig)
            log_var = float(np.log(var + 1e-8))

            features.extend([
                mu_pow,
                beta_pow,
                rel_mu,
                rel_beta,
                log_var,
                mobility,
                complexity
            ])

        # 2. Inter-hemispheric sensorimotor asymmetry: (left - right) / (left + right)
        asym_pairs = [("C3", "C4"), ("F3", "F4"), ("P3", "P4")]
        for left_ch, right_ch in asym_pairs:
            if left_ch in channel_mu_power and right_ch in channel_mu_power:
                l_mu = channel_mu_power[left_ch]
                r_mu = channel_mu_power[right_ch]
                asym_mu = (l_mu - r_mu) / (l_mu + r_mu + 1e-8)

                l_beta = channel_beta_power[left_ch]
                r_beta = channel_beta_power[right_ch]
                asym_beta = (l_beta - r_beta) / (l_beta + r_beta + 1e-8)

                features.extend([asym_mu, asym_beta])

        return np.array(features, dtype=np.float32)

    def extract_batch(self, batch_data: np.ndarray) -> np.ndarray:
        """
        Extract features for multiple preprocessed trials.

        Parameters
        ----------
        batch_data : np.ndarray
            Shape: (n_trials, n_channels, n_times)

        Returns
        -------
        X : np.ndarray
            Shape: (n_trials, n_features)
        """
        feat_list = [self.extract_trial(trial) for trial in batch_data]
        return np.stack(feat_list, axis=0)
