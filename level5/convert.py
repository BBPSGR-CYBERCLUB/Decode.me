import wave
import numpy as np

def text_to_bits(text):
    return ''.join(format(byte, '08b') for byte in text.encode('utf-8'))

def hide_data(audio_in, text_file, audio_out):
    # Read message
    with open(text_file, 'r', encoding='utf-8') as f:
        message = f.read()

    message_bits = text_to_bits(message)
    delimiter = '1111111111111110'  # 16-bit end marker
    full_message = message_bits + delimiter

    # Open audio
    with wave.open(audio_in, 'rb') as wav:
        params = wav.getparams()
        n_channels, sampwidth, framerate, n_frames = params[:4]
        audio_data = wav.readframes(n_frames)

    if sampwidth == 1:
        dtype = np.uint8
    elif sampwidth == 2:
        dtype = np.int16
    else:
        raise ValueError("Only 8-bit or 16-bit PCM WAV files are supported.")

    samples = np.frombuffer(audio_data, dtype=dtype)

    if n_channels == 2:
        samples = samples.reshape((-1, 2))
        target_channel = 0  # 0 for left, 1 for right
        flat_channel = samples[:, target_channel]

        if len(full_message) > len(flat_channel):
            raise ValueError("Message too large for audio file (even in your weak left ear).")

        # Embed message
        encoded_channel = np.copy(flat_channel)
        for i, bit in enumerate(full_message):
            # Ensure operations stay within data type bounds
            if sampwidth == 1:
                encoded_channel[i] = np.uint8((encoded_channel[i] & 0xFE) | int(bit))
            else:
                encoded_channel[i] = (encoded_channel[i] & ~1) | int(bit)

        samples[:, target_channel] = encoded_channel
        encoded_samples = samples.flatten()
    else:
        if len(full_message) > len(samples):
            raise ValueError("Message too large for audio file.")

        encoded_samples = np.copy(samples)
        for i, bit in enumerate(full_message):
            # Ensure operations stay within data type bounds
            if sampwidth == 1:
                encoded_samples[i] = np.uint8((encoded_samples[i] & 0xFE) | int(bit))
            else:
                encoded_samples[i] = (encoded_samples[i] & ~1) | int(bit)

    # Write stego audio
    with wave.open(audio_out, 'wb') as wav_out:
        wav_out.setparams(params)
        wav_out.writeframes(encoded_samples.astype(dtype).tobytes())

    bit_depth = 8 if sampwidth == 1 else 16
    print(f"Message successfully hidden in '{audio_out}' using {['mono','stereo'][n_channels==2]} mode ({bit_depth}-bit).")

# Usage
hide_data('morse.wav', 'riddle.txt', 'password.wav')