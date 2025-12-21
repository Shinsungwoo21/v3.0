
import { bedrockClient } from "@/lib/bedrock";
import { ConverseStreamCommand, Message } from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";

// System prompt as defined in requirements
const SYSTEM_PROMPT = `당신은 유용한 AI 어시스턴트입니다. 
당신은 사용자의 질문에 대해 친절하고 정확하게 답변해야 합니다. 
만약 답변에 확신이 없다면, 솔직하게 모른다고 대답하세요.
Markdown 형식을 사용하여 가독성 좋은 답변을 제공하세요.`;

export async function POST(req: NextRequest) {
    try {
        const { messages, modelId } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Messages array is required" },
                { status: 400 }
            );
        }

        const command = new ConverseStreamCommand({
            modelId: modelId || "anthropic.claude-3-5-sonnet-20240620-v1:0",
            messages: messages as Message[],
            system: [{ text: SYSTEM_PROMPT }],
            inferenceConfig: {
                maxTokens: 4096,
                temperature: 0.7,
                topP: 0.9,
            },
        });

        const response = await bedrockClient.send(command);

        if (!response.stream) {
            throw new Error("No stream in response");
        }

        // Create a Web Stream from the Bedrock AsyncIterable
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // @ts-ignore - response.stream is AsyncIterable but TypeScript types might differ slightly
                    for await (const event of response.stream) {
                        if (event.contentBlockDelta) {
                            const text = event.contentBlockDelta.delta?.text || "";
                            controller.enqueue(new TextEncoder().encode(text));
                        }
                    }
                    controller.close();
                } catch (error) {
                    console.error("Stream processing error:", error);
                    controller.error(error);
                }
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });

    } catch (error: any) {
        console.error("============= Bedrock API Error Detail =============");
        console.error(JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.error("====================================================");
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
