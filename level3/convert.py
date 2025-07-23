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

    if sampwidth != 2:
        raise ValueError("Only 16-bit PCM WAV files are supported. Yours is fancy and I am tired.")

    samples = np.frombuffer(audio_data, dtype=np.int16)

    # Handle stereo
    if n_channels == 2:
        samples = samples.reshape((-1, 2))
        target_channel = 0  # 0 for left, 1 for right
        flat_channel = samples[:, target_channel]

        if len(full_message) > len(flat_channel):
            raise ValueError("Message too large for audio file (even in your weak left ear).")

        # Embed message
        encoded_channel = np.copy(flat_channel)
        for i, bit in enumerate(full_message):
            encoded_channel[i] &= ~1  # Clear LSB
            encoded_channel[i] |= int(bit)

        samples[:, target_channel] = encoded_channel

        # Flatten back
        encoded_samples = samples.flatten()
    else:
        # Mono
        if len(full_message) > len(samples):
            raise ValueError("Message too large for audio file.")

        encoded_samples = np.copy(samples)
        for i, bit in enumerate(full_message):
            encoded_samples[i] &= ~1
            encoded_samples[i] |= int(bit)

    # Write stego audio
    with wave.open(audio_out, 'wb') as wav_out:
        wav_out.setparams(params)
        wav_out.writeframes(encoded_samples.astype(np.int16).tobytes())

    print(f"Message successfully hidden in '{audio_out}' using {['mono', 'stereo'][n_channels == 2]} mode.")


# Usage
hide_data('cover.wav', 'riddle.txt', 'stego.wav')
