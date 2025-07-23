import wave
import numpy as np

def extract_data(audio_file):
    with wave.open(audio_file, 'rb') as wav:
        params = wav.getparams()
        n_channels, sampwidth, framerate, n_frames = params[:4]
        audio_data = wav.readframes(n_frames)

    print(f"Channels: {n_channels}, Sample Width: {sampwidth * 8} bits, Frame Rate: {framerate}, Total Frames: {n_frames}")

    if sampwidth == 1:
        # 8-bit WAVs are unsigned, so we shift them to center around 0
        samples = np.frombuffer(audio_data, dtype=np.uint8)
        samples = samples.astype(np.int16) - 128  # Convert to signed for LSB extraction
    elif sampwidth == 2:
        # 16-bit WAVs are signed
        samples = np.frombuffer(audio_data, dtype=np.int16)
    else:
        raise ValueError("Only 8-bit and 16-bit PCM WAV files are supported. This ain't no audiophile club.")

    # Handle stereo
    if n_channels == 2:
        samples = samples.reshape((-1, 2))
        target_channel = 0  # Left ear gang
        samples = samples[:, target_channel]

    # Extract LSBs
    bits = [str(sample & 1) for sample in samples]

    # Group into bytes
    byte_chunks = [''.join(bits[i:i+8]) for i in range(0, len(bits), 8)]

    # Define end-of-message delimiter (yes, like Morse code for nerds)
    delimiter = ['11111111', '11111110']
    message_bytes = []
    for i in range(len(byte_chunks) - 1):
        if byte_chunks[i] == delimiter[0] and byte_chunks[i+1] == delimiter[1]:
            break
        try:
            message_bytes.append(int(byte_chunks[i], 2))
        except ValueError:
            print("Non-binary garbage in the data. Smells like corruption or wrong format.")
            break

    # Decode the bytes into a string, with backup if UTF-8 dies
    try:
        message = bytes(message_bytes).decode('utf-8')
    except UnicodeDecodeError:
        message = bytes(message_bytes).decode('utf-8', errors='replace')

    print("\nRecovered message:")
    print(message)

# Usage
extract_data("stego.wav")
