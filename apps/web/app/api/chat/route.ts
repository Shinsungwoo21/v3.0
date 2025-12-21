import { bedrockClient } from "@/lib/bedrock";
import { searchPerformances } from "@/lib/rag";
import { ConverseStreamCommand, Message, ToolResultBlock, ContentBlock, ToolUseBlock } from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";
import { BEDROCK_TOOLS, executeTool } from "@/lib/bedrock-tools";

// System prompt as defined in requirements
const BASE_SYSTEM_PROMPT = `당신은 유용한 AI 어시스턴트입니다. 
당신은 사용자의 질문에 대해 친절하고 정확하게 답변해야 합니다. 
만약 답변에 확신이 없다면, 솔직하게 모른다고 대답하세요.
Markdown 형식을 사용하여 가독성 좋은 답변을 제공하세요.

[중요 기능 안내]
- 당신은 공연 좌석 조회, 좌석 선점(Holding), 예약 확정 도구를 사용할 수 있습니다.
- 좌석 선점(create_holding)은 **1분간만 유지(TTL 1분)**됨을 사용자에게 명확히 안내해야 합니다.
- **좌석 조회 및 추천 절차 (필수 준수):**
  1. 먼저 사용자가 선택한 공연의 **등급별 가격과 잔여석 정보**를 요약해서 알려주세요. (예: VIP석 15만원 10석...)
  2. 그 다음, **"몇 분이서 관람하시나요? (최대 4매까지 가능)"** 라고 먼저 물어보세요.
  3. 인원을 확인한 후, **"어떤 등급의 좌석을 원하시나요?"** 라고 물어보세요.
  4. 사용자가 등급을 선택하면, 해당 등급의 **구체적인 좌석 번호(예: A-5, A-6)**를 추천해 주세요.
  5. 사용자가 좌석을 "좋다"고 하거나 "진행해달라"고 하면 그제서야 \`create_holding\` 도구로 선점(Holding)을 진행하세요.
- **주의사항 (Hallucination 및 오류 방지):**
  - **중요:** 사용자가 "R석" 등 **좌석 등급**을 언급했을 때, 이를 **좌석 번호(예: R-1)**로 착각하여 존재하지 않는 좌석을 만들어내지 마십시오.
  - 반드시 \`get_ticket_availability\` 도구의 결과(\`details\`)에 실제로 존재하는 좌석 ID만 추천해야 합니다. (예: R등급은 C, D, E열일 수 있음)
  - 사용자의 요청이 "좌석 등급(예: R석)"인지 "특정 좌석 번호(예: R-15)"인지 모호하다면, 추측하지 말고 **"말씀하신 내용이 R등급 좌석을 의미하시나요, 아니면 R-15번 좌석을 의미하시나요?"**라고 사용자에게 확인 질문을 하십시오.
  - \`create_holding\` 성공은 예약 완료가 아닙니다. **"선점"** 상태일 뿐입니다.
  - 사용자가 **"예약 확정"** 버튼을 누르거나 명시적으로 확정 의사를 밝힐 때까지 절대 "예약이 완료되었습니다"라고 말하지 마세요.
  - 예약 확정 요청이 오면 \`confirm_reservation\` 도구를 사용하세요. 이 도구의 결과가 \`success: true\`일 때만 "예약이 확정되었습니다"라고 말할 수 있습니다.
- 좌석이 중복 선점된 경우, 다른 좌석을 제안하세요.
- **예약 취소 요청 시:** 즉시 \`release_holding\` 도구를 사용하여 선점을 해제하고 결과를 알려주세요.`;

async function processConverseStream(
    messages: Message[],
    systemPrompt: string,
    controller: ReadableStreamDefaultController,
    depth = 0
) {
    if (depth > 5) {
        console.warn("Max recursion depth reached");
        return;
    }

    const command = new ConverseStreamCommand({
        modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
        messages: messages,
        system: [{ text: systemPrompt }],
        toolConfig: { tools: BEDROCK_TOOLS },
        inferenceConfig: {
            maxTokens: 4096,
            temperature: 0.7,
            topP: 0.9,
        },
    });

    try {
        const response = await bedrockClient.send(command);

        if (!response.stream) throw new Error("No stream in response");

        let stopReason = "";

        // Track blocks to reconstruct the assistant's message
        // ConverseStream sends parts. We need to assemble them.
        // Simplified Logic: We will accumulate text for streaming, and tool use details for execution.
        let currentToolUse: Partial<ToolUseBlock> | null = null;
        const generatedContentBlocks: ContentBlock[] = [];
        let currentText = "";

        // @ts-ignore
        for await (const event of response.stream) {
            // 1. Block Start
            if (event.contentBlockStart) {
                if (event.contentBlockStart.start?.toolUse) {
                    currentToolUse = event.contentBlockStart.start.toolUse;
                } else {
                    currentToolUse = null; // Text block start
                }
            }

            // 2. Block Delta
            if (event.contentBlockDelta) {
                if (event.contentBlockDelta.delta?.text) {
                    const txt = event.contentBlockDelta.delta.text;
                    currentText += txt;
                    // Stream text to client
                    controller.enqueue(new TextEncoder().encode(txt));
                }
                if (event.contentBlockDelta.delta?.toolUse && currentToolUse) {
                    // Accumulate JSON input string
                    currentToolUse.input = (currentToolUse.input || "") + event.contentBlockDelta.delta.toolUse.input;
                }
            }

            // 3. Block Stop
            if (event.contentBlockStop) {
                if (currentToolUse) {
                    // Finalize Tool Use Block
                    try {
                        // Input comes as string, need to ensure it's valid for history
                        // But for history 'input' should be JSON object (document-like) or string?
                        // SDK types say `input: any`.
                        // However, when *receiving* from stream, it is string partials.
                        // We must parse it to store in `generatedContentBlocks` as a proper object if needed, 
                        // OR keep as is. The Message format expects parsed JSON in `input`.
                        if (typeof currentToolUse.input === 'string') {
                            currentToolUse.input = JSON.parse(currentToolUse.input);
                        }
                        generatedContentBlocks.push({ toolUse: currentToolUse as ToolUseBlock });
                        currentToolUse = null;
                    } catch (e) {
                        console.error("Failed to parse tool input json", e);
                    }
                } else if (currentText) {
                    generatedContentBlocks.push({ text: currentText });
                    currentText = "";
                }
            }

            // 4. Message Stop
            if (event.messageStop) {
                stopReason = event.messageStop.stopReason || "";
            }
        }

        // Add the assistant's response to history
        if (generatedContentBlocks.length > 0) {
            messages.push({ role: 'assistant', content: generatedContentBlocks });
        }

        // Handle Tool Use
        if (stopReason === 'tool_use') {
            const toolResults: ToolResultBlock[] = [];

            // Collect all actions to inject (Release + Create supported)
            const actionsToInject: any[] = [];

            for (const block of generatedContentBlocks) {
                if (block.toolUse) {
                    const toolName = block.toolUse.name;
                    const toolInput = block.toolUse.input;
                    const toolUseId = block.toolUse.toolUseId;

                    if (toolName && toolUseId) {
                        // Execute
                        const result = await executeTool(toolName, toolInput);

                        // Capture metadata if release_holding
                        if (toolName === 'release_holding' && result.success) {
                            actionsToInject.push({
                                type: "HOLDING_RELEASED",
                                holdingId: result.holdingId // Now available from tool result
                            });
                        }

                        // Capture metadata if create_holding
                        if (toolName === 'create_holding' && result.success) {
                            const expiresAtTime = new Date(result.expiresAt).getTime();
                            const nowTime = Date.now();
                            const remainingMs = expiresAtTime - nowTime;

                            actionsToInject.push({
                                type: "HOLDING_CREATED",
                                holdingId: result.holdingId,
                                expiresAt: result.expiresAt,
                                remainingMs: remainingMs > 0 ? remainingMs : 60000 // Fallback to 60s if invalid
                            });
                        }

                        toolResults.push({
                            toolUseId: toolUseId,
                            content: [{ json: result }]
                        });
                    }
                }
            }

            if (toolResults.length > 0) {
                // Add tool results to history
                messages.push({ role: 'user', content: toolResults.map(r => ({ toolResult: r })) });

                // Inject ACTION_DATA immediately for THIS turn's tools (e.g. Release)
                // This ensures "Release" event is streamed BEFORE the recursive call generates the "Create" event.
                if (actionsToInject.length > 0) {
                    for (const actionData of actionsToInject) {
                        // Recalculate remainingMs for created holdings
                        if (actionData.expiresAt) {
                            const expiresAtTime = new Date(actionData.expiresAt).getTime();
                            const nowTime = Date.now();
                            const remainingMs = expiresAtTime - nowTime;
                            actionData.remainingMs = remainingMs > 0 ? remainingMs : 0;
                        }

                        // Stream each action individually
                        const metadataString = `\n<!-- ACTION_DATA: ${JSON.stringify(actionData)} -->`;
                        controller.enqueue(new TextEncoder().encode(metadataString));
                    }
                }

                // Recurse to generate next steps (e.g. Create holding text + action)
                await processConverseStream(messages, systemPrompt, controller, depth + 1);
            }
        }

    } catch (e) {
        console.error("Stream Loop Error:", e);
        controller.error(e);
    }
}

export async function POST(req: NextRequest) {
    try {
        const { messages, modelId } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Messages array is required" },
                { status: 400 }
            );
        }

        // RAG Injection
        let systemPromptText = BASE_SYSTEM_PROMPT;
        // Inject Current Time
        systemPromptText += `\n\n[Current Time]: ${new Date().toISOString()}`;

        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            let query = "";
            if (typeof lastMessage.content === 'string') {
                query = lastMessage.content;
            } else if (Array.isArray(lastMessage.content)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                query = lastMessage.content.map((c: any) => c.text || "").join(" ");
            }

            if (query) {
                const context = await searchPerformances(query);
                if (context) {
                    systemPromptText += `\n\n[Performance Data]\n${context}`;
                    console.log("RAG Context injected");
                }
            }
        }

        const stream = new ReadableStream({
            async start(controller) {
                await processConverseStream(messages, systemPromptText, controller);
                controller.close();
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });

    } catch (error: any) {
        console.error("Bedrock API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
