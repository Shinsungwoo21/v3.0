# 팀 Repo 브랜치 백업 정보

삭제 일시: 2026-01-13 17:28 KST

## 브랜치별 복구 정보

| 브랜치명 | 마지막 커밋 SHA | 설명 |
|----------|-----------------|------|
| `stfc` | `a12ea8bc93fbc7094459e2181d9cf1348fc48218` | S3 endpoint policy 통합 |
| `feature/s3-migration` | `17bb53f3f38daaeef096701bc4f645ec982801bb` | dnf update 추가 (이후 수정됨) |
| `main` | `a12ea8bc93fbc7094459e2181d9cf1348fc48218` | 최신 (stfc와 동일) |

## 복구 명령어

```bash
# stfc 브랜치 복구
git checkout -b stfc a12ea8bc93fbc7094459e2181d9cf1348fc48218
git push team stfc

# feature/s3-migration 브랜치 복구
git checkout -b feature/s3-migration 17bb53f3f38daaeef096701bc4f645ec982801bb
git push team feature/s3-migration
```
