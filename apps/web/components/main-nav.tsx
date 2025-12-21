
import Link from "next/link"
import { cn } from "@/lib/utils"

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    const links = [
        { href: "/concerts?category=musical", label: "뮤지컬" },
        { href: "/concerts?category=concert", label: "콘서트" },
        { href: "/concerts?category=play", label: "연극" },
        { href: "/concerts?category=classic", label: "클래식/무용" },
        { href: "/concerts?category=sports", label: "스포츠" },
        { href: "/concerts?category=exhibition", label: "전시/행사" },
        { href: "/concerts?category=ranking", label: "랭킹" },
        { href: "/concerts?category=event", label: "이벤트" },
    ]

    return (
        <nav
            className={cn("flex items-center space-x-6 text-sm font-medium", className)}
            {...props}
        >
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-primary text-muted-foreground"
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    )
}
