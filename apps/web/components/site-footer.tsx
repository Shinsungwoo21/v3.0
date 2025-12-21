export function SiteFooter() {
    return (
        <footer className="w-full bg-gray-50 border-t border-gray-200 py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-12 md:gap-16">
                    {/* Left Column: Customer Center */}
                    <div className="space-y-4 pl-0 md:pl-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-gray-900">고객센터 {'>'}</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">1599-3089</h2>
                        <p className="text-sm text-gray-500">
                            월-금 10:00 - 18:00 (주말 · 공휴일 휴무)
                        </p>
                        <div className="pt-4">
                            <span className="text-xl font-bold text-primary flex items-center gap-1">
                                MegaTicket
                            </span>
                        </div>
                    </div>

                    {/* Right Column: Links & Company Info */}
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
                            <span className="cursor-pointer hover:text-gray-900">회사소개</span>
                            <span className="cursor-pointer hover:text-gray-900">이용약관</span>
                            <span className="cursor-pointer hover:text-gray-900 font-bold">개인정보처리방침</span>
                            <span className="cursor-pointer hover:text-gray-900 text-red-500">제휴문의</span>
                            <span className="cursor-pointer hover:text-gray-900">파트너 페이지</span>
                        </div>

                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 border rounded-md text-xs text-gray-600 font-bold bg-white hover:bg-gray-100">
                                📢 자주묻는질문
                            </button>
                            <button className="px-3 py-1.5 border rounded-md text-xs text-gray-600 font-bold bg-white hover:bg-gray-100">
                                📝 1:1 문의하기
                            </button>
                            <button className="px-3 py-1.5 border rounded-md text-xs text-gray-600 font-bold bg-white hover:bg-gray-100">
                                🚨 공지사항
                            </button>
                        </div>

                        <div className="text-xs text-gray-400 leading-relaxed space-y-1">
                            <p>(주)메가티켓 | 대표이사: 김제미니 | 서울특별시 강남구 테헤란로 123, 45층</p>
                            <p>사업자등록번호: 123-45-67890 | 사업자정보확인</p>
                            <p>통신판매업신고: 2024-서울강남-1234</p>
                            <p>개인정보관리책임자: 홍길동 (help@megaticket.co.kr)</p>
                            <p className="pt-2">Hosting by (주)AWS | Copyright © MegaTicket All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
