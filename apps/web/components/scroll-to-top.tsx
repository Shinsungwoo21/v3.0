
"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener("scroll", toggleVisibility)
        return () => window.removeEventListener("scroll", toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    return (
        <Button
            variant="outline"
            size="icon"
            className={cn(
                "fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300 bg-white border-primary/20 hover:border-primary hover:bg-primary hover:text-white",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
            )}
            onClick={scrollToTop}
            aria-label="Scroll to top"
        >
            <ArrowUp className="h-6 w-6" />
        </Button>
    )
}
