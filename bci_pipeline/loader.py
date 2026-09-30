"""
EEG Data Loader for NeuroCare BCI.

Dataset: Wairagkar et al. (2018) Motor Execution / Imagery Dataset.
DOI: 10.1371/journal.pone.0193722
Classes:
    0: 'right_hand'
    1: 'rest'
    2: 'left_hand'
Channels: 19 channels (10-20 standard montage)
Sampling Frequency: 1024 Hz
Duration: 6.0 seconds per trial (-3.0s to +3.0s relative to onset)
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import scipy.io as sio


# Standard 19 EEG channel names in acquisition order (rows 0-18 in Participant MAT files)
CHANNEL_NAMES = [
    "Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8",
    "T7", "C3", "Cz", "C4", "T8",
    "P7", "P3", "Pz", "P4", "P8",
    "O1", "O2"
]

# Condition mapping according to MOABB / dataset specification
# Dimension 1 in the MAT array has size 3:
# Col 0: right_hand
# Col 1: rest
# Col 2: left_hand
CLASS_LABELS = {
    0: "right_hand",
    1: "rest",
    2: "left_hand"
}

LABEL_TO_ID = {v: k for k, v in CLASS_LABELS.items()}
ORIGINAL_FS = 1024.0
TRIAL_DURATION_SEC = 6.0
SAMPLES_PER_TRIAL = 6144


class EEGLoader:
    """Loads and standardizes EEG data from Wairagkar 2018 dataset."""

    def __init__(self, data_dir: Optional[Union[str, Path]] = None):
        """
        Initialize the loader.

        Parameters
        ----------
        data_dir : str or Path, optional
            Path to the directory containing participant MAT files.
            Defaults to bci_pipeline/data/raw/sourcedata or bci_pipeline/data/sourcedata.
        """
        if data_dir is None:
            # Check standard project paths
            possible_paths = [
                Path("bci_pipeline/data/raw/sourcedata"),
                Path("bci_pipeline/data/sourcedata"),
                Path("bci_pipeline/data/raw"),
                Path("bci_pipeline/data")
            ]
            found_dir = None
            for p in possible_paths:
                if p.exists() and len(list(p.glob("Participant*.mat"))) > 0:
                    found_dir = p
                    break
            if found_dir is None:
                raise FileNotFoundError(
                    "Could not locate Participant*.mat files in default directories. "
                    "Please provide an explicit data_dir."
                )
            self.data_dir = found_dir.resolve()
        else:
            self.data_dir = Path(data_dir).resolve()
            if not self.data_dir.exists():
                raise FileNotFoundError(f"Specified data_dir does not exist: {self.data_dir}")

        self.channel_names = list(CHANNEL_NAMES)
        self.class_labels = dict(CLASS_LABELS)
        self.fs = ORIGINAL_FS

    def list_available_participants(self) -> List[int]:
        """Return sorted list of available participant IDs."""
        mat_files = list(self.data_dir.glob("Participant*.mat"))
        p_ids = []
        for f in mat_files:
            stem = f.stem  # e.g., 'Participant1'
            id_str = stem.replace("Participant", "")
            if id_str.isdigit():
                p_ids.append(int(id_str))
        return sorted(p_ids)

    def load_participant(self, participant_id: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Load all trials for a single participant.

        Parameters
        ----------
        participant_id : int
            Participant number (1 to 14).

        Returns
        -------
        X : np.ndarray
            EEG trials array of shape (n_trials, n_channels, n_times), dtype float32.
        y : np.ndarray
            Integer labels (0: right_hand, 1: rest, 2: left_hand) of shape (n_trials,), dtype int64.
        metadata : np.ndarray
            Array of participant IDs of shape (n_trials,), dtype int32.
        """
        file_path = self.data_dir / f"Participant{participant_id}.mat"
        if not file_path.exists():
            raise FileNotFoundError(f"Participant file not found: {file_path}")

        mat = sio.loadmat(file_path)
        key = f"Participant{participant_id}"
        if key not in mat:
            # Fallback check for any matching key
            candidates = [k for k in mat.keys() if k.startswith("Participant")]
            if not candidates:
                raise KeyError(f"No participant matrix found in {file_path}")
            key = candidates[0]

        raw_cell = mat[key]  # shape: (21, 3, n_trials)
        n_rows, n_conds, n_trials_per_cond = raw_cell.shape
        n_channels = len(CHANNEL_NAMES)  # 19

        trials_list = []
        labels_list = []

        for cond_idx in range(n_conds):
            for t_idx in range(n_trials_per_cond):
                # Channel signals: rows 0 through 18
                # Each cell contains a (6144, 1) or (6144,) array
                channel_signals = []
                for ch_idx in range(n_channels):
                    sig = raw_cell[ch_idx, cond_idx, t_idx].flatten()
                    channel_signals.append(sig)
                
                trial_data = np.stack(channel_signals, axis=0)  # shape (19, 6144)
                trials_list.append(trial_data)
                labels_list.append(cond_idx)

        X = np.array(trials_list, dtype=np.float32)
        y = np.array(labels_list, dtype=np.int64)
        subjects = np.full(shape=(len(y),), fill_value=participant_id, dtype=np.int32)

        return X, y, subjects

    def load_all(self, max_participants: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Load trials across all participants.

        Parameters
        ----------
        max_participants : int, optional
            Limit to first N participants (useful for quick testing/prototyping).

        Returns
        -------
        X : np.ndarray
            Combined EEG trials (total_trials, 19, 6144).
        y : np.ndarray
            Combined labels (total_trials,).
        subjects : np.ndarray
            Subject ID for each trial (total_trials,).
        """
        available = self.list_available_participants()
        if max_participants is not None:
            available = available[:max_participants]

        all_X, all_y, all_sub = [], [], []
        for p_id in available:
            X, y, sub = self.load_participant(p_id)
            all_X.append(X)
            all_y.append(y)
            all_sub.append(sub)

        X_cat = np.concatenate(all_X, axis=0)
        y_cat = np.concatenate(all_y, axis=0)
        sub_cat = np.concatenate(all_sub, axis=0)

        return X_cat, y_cat, sub_cat

    def get_sample_trial(
        self,
        participant_id: int = 1,
        condition: int = 0,
        trial_index: int = 0
    ) -> Dict:
        """
        Retrieve a single EEG trial with metadata for simulation/testing.

        Returns
        -------
        dict containing:
            - 'eeg': np.ndarray of shape (19, 6144)
            - 'channels': list of channel names
            - 'label': int condition code
            - 'label_name': str condition name
            - 'fs': float sampling rate
            - 'participant_id': int
            - 'trial_index': int
        """
        file_path = self.data_dir / f"Participant{participant_id}.mat"
        if not file_path.exists():
            raise FileNotFoundError(f"Participant file not found: {file_path}")

        mat = sio.loadmat(file_path)
        key = f"Participant{participant_id}"
        raw_cell = mat[key]

        n_channels = len(CHANNEL_NAMES)
        channel_signals = []
        for ch_idx in range(n_channels):
            sig = raw_cell[ch_idx, condition, trial_index].flatten()
            channel_signals.append(sig)

        eeg = np.stack(channel_signals, axis=0).astype(np.float32)

        return {
            "eeg": eeg,
            "channels": list(CHANNEL_NAMES),
            "label": int(condition),
            "label_name": CLASS_LABELS[condition],
            "fs": self.fs,
            "participant_id": participant_id,
            "trial_index": trial_index,
        }
