import wave
import numpy as np

def extract_data(audio_file):
    with wave.open(audio_file, 'rb') as wav:
        params = wav.getparams()
        n_channels, sampwidth, framerate, n_frames = params[:4]
        audio_data = wav.readframes(n_frames)

    if sampwidth != 2:
        raise ValueError("Only 16-bit PCM WAV files are supported.")

    samples = np.frombuffer(audio_data, dtype=np.int16)

    # Handle stereo
    if n_channels == 2:
        samples = samples.reshape((-1, 2))
        target_channel = 0  # Extract from left channel
        samples = samples[:, target_channel]

    bits = [str(sample & 1) for sample in samples]

    # Convert bits to bytes
    byte_chunks = [''.join(bits[i:i+8]) for i in range(0, len(bits), 8)]

    # Find delimiter (11111111 11111110)
    delimiter = ['11111111', '11111110']
    message_bytes = []
    for i in range(len(byte_chunks) - 1):
        if byte_chunks[i] == delimiter[0] and byte_chunks[i+1] == delimiter[1]:
            break
        try:
            message_bytes.append(int(byte_chunks[i], 2))
        except ValueError:
            break  # Random garbage at the end? Yeet.

    # Convert to string
    try:
        message = bytes(message_bytes).decode('utf-8')
    except UnicodeDecodeError:
        message = bytes(message_bytes).decode('utf-8', errors='replace')

    print("Recovered message:")
    print(message)

# Usage
extract_data("stego.wav")
