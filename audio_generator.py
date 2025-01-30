import json
import os

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import save

# Load environment variables
load_dotenv()

# Initialize the ElevenLabs client
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
# Load the configuration
with open('phrases.json') as f:
    config = json.load(f)

# Create output directories
for voice in config['voices'].values():
    voice_dir = f"audio/{voice['name'].lower().replace(' ', '_')}"
    os.makedirs(voice_dir, exist_ok=True)

    # Create phrase directories
    os.makedirs(f"{voice_dir}/phrases", exist_ok=True)
    os.makedirs(f"{voice_dir}/digits", exist_ok=True)


def generate_audio(text, voice_id, filename):
    """
    Generate audio using ElevenLabs API and save it to a file.
    """
    try:
        if not os.path.exists(filename):
            # Generate audio
            audio = client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128",
            )

            # Save the audio file
            save(audio, filename)
            print(f"Generated: {filename}")
    except Exception as e:
        print(f"Error generating {filename}: {str(e)}")


# Generate all audio files
for voice_name, voice_data in config['voices'].items():
    voice_id = voice_data['voice_id']  # Use the voice_id from the JSON

    # Generate phrase files
    for phrase_key, phrase_text in voice_data['phrases'].items():
        filename = f"audio/{voice_data['name'].lower().replace(' ', '_')}/phrases/{phrase_key}.mp3"
        generate_audio(phrase_text, voice_id, filename)

    # Generate digit files
    for digit, digit_text in voice_data['digits'].items():
        filename = f"audio/{voice_data['name'].lower().replace(' ', '_')}/digits/{digit}.mp3"
        generate_audio(digit_text, voice_id, filename)

print("Audio generation complete!")