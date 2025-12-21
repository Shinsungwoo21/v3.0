
"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sparkles, Zap, Brain } from "lucide-react";

interface ModelSelectorProps {
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
}

export function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className="w-[200px] h-9 bg-white/80 border-orange-200 text-xs backdrop-blur-sm focus:ring-orange-500/20 text-gray-700 shadow-sm hover:border-orange-400 hover:ring-2 hover:ring-orange-100 transition-all duration-300">
                <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="anthropic.claude-3-5-sonnet-20240620-v1:0">
                    <div className="flex items-center gap-2">
                        <Brain className="h-3.5 w-3.5 text-purple-500" />
                        <span>Claude 3.5 Sonnet</span>
                    </div>
                </SelectItem>
                <SelectItem value="apac.amazon.nova-lite-v1:0">
                    <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-yellow-500" />
                        <span>Amazon Nova Lite</span>
                    </div>
                </SelectItem>
                <SelectItem value="global.anthropic.claude-sonnet-4-5-20250929-v1:0" disabled>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        <span>Claude 4.5 Sonnet (Coming Soon)</span>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
}
