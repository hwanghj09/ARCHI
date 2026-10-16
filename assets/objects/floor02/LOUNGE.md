# 2층 직원 휴게실 오브젝트 분리

기존 배경의 두 소파와 두 테이블을 지운 벽 그림 위에 소파·테이블·리모컨을 각각 배치한다. 커피 테이블을 조사하면 기존 `f2-remote`를 획득하며, 리모컨 그림만 숨긴다. 재입장과 저장 복원은 같은 획득 기록을 사용한다. 소파의 담요·포스터·자판기 조사와 행사장 영사기 조건은 유지한다.

- 벽: `assets/background/floor02/floor02-lounge-wall.png`
- 소품: 이 폴더의 `lounge-sofa.png`, `lounge-table.png`, `projector-remote.png`
- 원본: 각 폴더의 `source/`에 보존. 기존 `floor02-lounge-interior.png`도 보존한다.
- 제작: built-in imagegen. 실제 요청문은 `lounge-generation.json`에 기록했다.
- 크기 정규화: 저장소 루트에서 `node scripts/prepare-floor02-lounge.mjs`. `floor02/build.py`가 생성하는 기존 합성 배경과 별도로 관리한다.
- 배치: `js/floors/floor-02.js`. `sprite` 단일 그림은 `frames: 1`, 테이블 위 물건은 `base`, 획득 후 숨길 그림은 `gives` + `hideWhenTaken`을 사용한다.
- 확인: `node tests/floor02-lounge.mjs` (획득·재조사·재입장·저장 복원·영사기 연결·모바일 화면).
