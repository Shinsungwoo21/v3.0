import boto3
import streamlit as st
from botocore.exceptions import ClientError

# Configuration
REGION_NAME = 'ap-northeast-2'
PROFILE_NAME = 'BedrockDevUser-hyebom'

# Models
MODELS = {
    "Claude 3.5 Sonnet": "anthropic.claude-3-5-sonnet-20240620-v1:0",
    "Amazon Nova Lite": "apac.amazon.nova-lite-v1:0"
}

# System Prompt
SYSTEM_PROMPT = """
당신은 유용한 AI 어시스턴트입니다.
친절하고 전문적인 어조를 유지하되, 답변은 간결하고 명확하게 하세요.
사실에 기반하여 답변하고, 불확실한 내용은 추측하지 마세요.
Markdown 포맷을 적극 활용하여 가독성을 높이세요.
"""

def get_bedrock_client():
    try:
        session = boto3.Session(profile_name=PROFILE_NAME)
        client = session.client('bedrock-runtime', region_name=REGION_NAME)
        return client
    except Exception as e:
        # Fallback for environments without the specific profile
        try:
            client = boto3.client('bedrock-runtime', region_name=REGION_NAME)
            return client
        except Exception as e2:
            st.error(f"Failed to initialize Bedrock client: {e}")
            return None

def stream_response(client, model_id, messages, system_prompt):
    try:
        # Prepare system prompt
        system_prompts = [{"text": system_prompt}]
        
        response = client.converse_stream(
            modelId=model_id,
            messages=messages,
            system=system_prompts,
            inferenceConfig={
                "temperature": 0.7,
                "topP": 0.9,
                "maxTokens": 4096
            }
        )
        
        stream = response.get('stream')
        if stream:
            for event in stream:
                if 'contentBlockDelta' in event:
                    yield event['contentBlockDelta']['delta']['text']
                    
    except ClientError as e:
        st.error(f"Bedrock API Error: {e}")
        yield f"Error: {e}"
    except Exception as e:
        st.error(f"An error occurred: {e}")
        yield f"Error: {e}"

def main():
    st.set_page_config(page_title="Bedrock Chatbot", page_icon="🤖")
    st.title("Bedrock Chatbot Agent")

    # Initialize Client
    client = get_bedrock_client()
    if not client:
        return

    # Sidebar
    st.sidebar.title("설정 (Configuration)")
    st.sidebar.markdown("---")
    selected_model_name = st.sidebar.radio("모델 선택 (Select Model)", list(MODELS.keys()))
    model_id = MODELS[selected_model_name]
    st.sidebar.caption(f"Model ID: {model_id}")
    
    if st.sidebar.button("대화 초기화 (Clear Chat)"):
        st.session_state.messages = []
        st.rerun()

    # Initialize Session State
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display Chat History
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            # Extract text content from the structure
            if isinstance(message["content"], list):
                text_content = "".join([item["text"] for item in message["content"] if "text" in item])
                st.markdown(text_content)
            else:
                st.markdown(message["content"])

    # Chat Input
    if prompt := st.chat_input("메시지를 입력하세요..."):
        # Add User Message to History
        user_message_structure = {"role": "user", "content": [{"text": prompt}]}
        st.session_state.messages.append(user_message_structure)
        
        with st.chat_message("user"):
            st.markdown(prompt)

        # Generate Response
        with st.chat_message("assistant"):
            response_stream = stream_response(client, model_id, st.session_state.messages, SYSTEM_PROMPT)
            
            # st.write_stream automatically handles the generator and returns the full text
            full_response = st.write_stream(response_stream)
            
            # Append Assistant Message to History
            assistant_message_structure = {"role": "assistant", "content": [{"text": full_response}]}
            st.session_state.messages.append(assistant_message_structure)

if __name__ == "__main__":
    main()
