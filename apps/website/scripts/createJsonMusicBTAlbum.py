import os
import json
from tinytag import TinyTag
from datetime import datetime


json_directory = '../json'
if not os.path.exists(json_directory):
    os.makedirs(json_directory)

def get_music_files_details(directory):
    # Define supported music file extensions
    supported_extensions = ['.mp3', '.wav', '.flac', '.aac']
    music_files_details = []

    # Walk through the directory
    for root, dirs, files in os.walk(directory):
        for file in files:
            # Check if the file has a supported extension
            if any(file.lower().endswith(ext) for ext in supported_extensions):
                try:
                    # Get full file path
                    file_path = os.path.join(root, file)
                    # Read metadata from the music file
                    tag = TinyTag.get(file_path)
                    # Get file's creation time (note: this shows the last modified time in most systems)
                    creation_time = datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M:%S')
                    duration = tag.duration if tag.duration else 0  # Duration in seconds

                    music_files_details.append({
                        'name': tag.title if tag.title else file,  # Use file name if title is not available
                        'author': tag.artist if tag.artist else 'Unknown',
                        'duration': str(datetime.utcfromtimestamp(duration).strftime('%M:%S'))  # Format as HH:MM:SS
                    
                    })
                except Exception as e:
                    print(f"Error processing {file}: {e}")

    return music_files_details

# Directory containing the music files
music_directory = '../public/music/BT - Album'

# Fetch details
details = get_music_files_details(music_directory)
json_file_path = '../public/json/music_files_bt_album.json'

# Create JSON file
with open(json_file_path, 'w') as json_file:
    json.dump(details, json_file, indent=4)

print(f"JSON file created with {len(details)} music files.")
