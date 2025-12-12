from youtube_transcript_api import YouTubeTranscriptApi
import sys

print("Inspecting YouTubeTranscriptApi...")
try:
    print(dir(YouTubeTranscriptApi))
    if hasattr(YouTubeTranscriptApi, 'get_transcript'):
        print("get_transcript method exists.")
    else:
        print("get_transcript method MISSING.")
except Exception as e:
    print(f"Error inspecting: {e}")

print("Attempting fetch without cookies...")
try:
    transcript = YouTubeTranscriptApi.get_transcript('gX8s25991ac')
    print("Success! (No cookies needed?)")
except Exception as e:
    print(f"Fetch failed: {e}")
