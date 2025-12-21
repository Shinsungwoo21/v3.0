import requests
import json
import sys

def test_chat_api():
    url = "http://localhost:3000/api/chat"
    headers = {"Content-Type": "application/json"}
    data = {
        "messages": [
            {
                "role": "user",
                "content": [{"text": "Hello, are you working?"}]
            }
        ],
        "modelId": "anthropic.claude-3-5-sonnet-20240620-v1:0"
    }

    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, headers=headers, json=data, stream=True)
        
        if response.status_code == 200:
            print("Response Status: 200 OK")
            print("Stream Content:")
            for chunk in response.iter_content(chunk_size=None):
                if chunk:
                    print(chunk.decode('utf-8'), end='', flush=True)
            print("\nVerification Successful!")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_chat_api()
