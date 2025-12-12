from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import JSONFormatter
import sys
import os
import json

video_id = 'gX8s25991ac' # TED Talk
if len(sys.argv) > 1:
    video_id = sys.argv[1]

cookies_file = 'cookies.txt'
if not os.path.exists(cookies_file):
    cookies_file = None

print(f"Fetching transcript for {video_id} using cookies: {cookies_file}")

try:
    transcript = YouTubeTranscriptApi.get_transcript(video_id, cookies=cookies_file)
    formatter = JSONFormatter()
    json_formatted = formatter.format_transcript(transcript)
    print(json_formatted)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
