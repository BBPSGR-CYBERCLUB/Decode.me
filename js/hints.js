// Hints Management for the CTF Game

// Default points per level and hint deduction amount
const POINTS_PER_LEVEL = 10;
const POINTS_DEDUCTED_PER_HINT = 1;

// Hint arrays for each level
const hints = {
  level2: [
    "This level involves AES-256 encryption.",
    "You need a key to decrypt the message.",
    "The key has been used before.",
    "Try using online decryption tools with different keys."
  ],

  level3: [
    "The audio file contains hidden information.",
    "Look at the decrypt.py file for help.",
    "This is an example of steganography.",
  ],

  level4: [
    "Did you like, try to inspect??."
  ],

  level5: [
    "Use the decode.py and translate.py files.",
    "The puzzle combines multiple encryption techniques.",
    "Look for patterns in the encrypted message.",
    "The solution may require multiple decryption steps."
  ]
};

// Modal for displaying hints
function createHintModal() {
  // Create a modal container if it doesn't exist
  if (!document.getElementById('hint-modal')) {
    const modal = document.createElement('div');
    modal.id = 'hint-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1000';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.backdropFilter = 'blur(5px)';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#111';
    modalContent.style.margin = '15% auto';
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid #0f0';
    modalContent.style.borderRadius = '5px';
    modalContent.style.width = '70%';
    modalContent.style.maxWidth = '500px';
    modalContent.style.color = '#0f0';
    modalContent.style.fontFamily = "'JetBrains Mono', monospace";

    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.style.color = '#0f0';
    closeButton.style.float = 'right';
    closeButton.style.fontSize = '28px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => { modal.style.display = 'none'; };

    const hintTitle = document.createElement('h3');
    hintTitle.textContent = 'Hint';
    hintTitle.style.marginBottom = '15px';
    hintTitle.style.borderBottom = '1px solid #0f0';
    hintTitle.style.paddingBottom = '10px';

    const hintText = document.createElement('p');
    hintText.id = 'hint-text';
    hintText.style.marginBottom = '20px';

    const pointsText = document.createElement('p');
    pointsText.id = 'points-info';
    pointsText.style.fontStyle = 'italic';
    pointsText.style.color = '#ff9900';
    pointsText.textContent = 'Note: Using hints deducts 1 point from your score.';

    modalContent.appendChild(closeButton);
    modalContent.appendChild(hintTitle);
    modalContent.appendChild(hintText);
    modalContent.appendChild(pointsText);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);

    // Close modal when clicking outside of it
    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
  }
}

// Get the current level from the page URL
function getCurrentLevel() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();

  if (filename.startsWith('level')) {
    return filename.replace('.html', '').toLowerCase();
  }

  return null;
}

// Show a hint and record hint usage
async function showHint(hintIndex) {
  const level = getCurrentLevel();
  if (!level || !hints[level] || hintIndex >= hints[level].length) {
    return false;
  }

  // Get the hint
  const hint = hints[level][hintIndex];

  // Display in modal
  createHintModal();
  document.getElementById('hint-text').textContent = hint;
  document.getElementById('hint-modal').style.display = 'block';

  // Record hint usage in Firebase if user is logged in
  const user = firebase.auth().currentUser;
  if (user) {
    try {
      // Reference to the team document
      const teamRef = firebase.firestore().collection('teams').doc(user.uid);

      // Get current hints used count
      const teamDoc = await teamRef.get();
      const teamData = teamDoc.data();

      // Update hints used count
      if (!teamData.levels[level]) {
        teamData.levels[level] = {};
      }

      if (!teamData.levels[level].hintsUsed) {
        teamData.levels[level].hintsUsed = 0;
      }

      // Only increment if this hint index hasn't been used before
      const usedHints = teamData.levels[level].usedHintIndices || [];
      if (!usedHints.includes(hintIndex)) {
        // Update the team document with new hints count and used indices
        await teamRef.update({
          [`levels.${level}.hintsUsed`]: firebase.firestore.FieldValue.increment(1),
          [`levels.${level}.usedHintIndices`]: firebase.firestore.FieldValue.arrayUnion(hintIndex)
        });
      }
    } catch (error) {
      console.error('Error updating hints used:', error);
    }
  }

  return true;
}

// Handle file download hint - specific to levels that need file downloads
async function handleFileDownloadHint(filePath) {
  const level = getCurrentLevel();
  if (!level) return;

  // Record hint usage in Firebase if user is logged in
  const user = firebase.auth().currentUser;
  if (user) {
    try {
      // Reference to the team document
      const teamRef = firebase.firestore().collection('teams').doc(user.uid);

      // Get current hints used count
      const teamDoc = await teamRef.get();
      const teamData = teamDoc.data();

      // Update hints used count
      if (!teamData.levels[level]) {
        teamData.levels[level] = {};
      }

      if (!teamData.levels[level].hintsUsed) {
        teamData.levels[level].hintsUsed = 0;
      }

      // Only increment if file hasn't been downloaded before
      const downloadedFiles = teamData.levels[level].downloadedFiles || [];
      if (!downloadedFiles.includes(filePath)) {
        // Update the team document with new hints count and downloaded files
        await teamRef.update({
          [`levels.${level}.hintsUsed`]: firebase.firestore.FieldValue.increment(1),
          [`levels.${level}.downloadedFiles`]: firebase.firestore.FieldValue.arrayUnion(filePath)
        });
      }
    } catch (error) {
      console.error('Error updating hints used:', error);
    }
  }

  // Redirect to download the file
  window.location.href = filePath;
}

// Calculate points for a level based on hints used
function calculateLevelPoints(hintsUsed = 0) {
  return Math.max(POINTS_PER_LEVEL - (hintsUsed * POINTS_DEDUCTED_PER_HINT), 0);
}

// Export functions for use in other scripts
window.hintSystem = {
  showHint,
  handleFileDownloadHint,
  calculateLevelPoints,
  POINTS_PER_LEVEL,
  POINTS_DEDUCTED_PER_HINT
};
